import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import { useStopwatch } from '@/contexts/StopwatchContext';
import Layout from '@/components/app/Layout';
import StopwatchSetup from '@/components/stopwatch/StopwatchSetup';
import StopwatchRunner from '@/components/stopwatch/StopwatchRunner';
import StopwatchHistoryList from '@/components/stopwatch/StopwatchHistoryList';

export default function StopwatchPage() {
  const { data } = useApp();
  const stopwatch = useStopwatch();
  const { session, elapsedMs } = stopwatch;
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingLogs(true);
      const rows = await base44.entities.PeStopwatchLog.list('-date');
      setLogs(rows || []);
      setLoadingLogs(false);
    })();
  }, []);

  const classById = Object.fromEntries(data.classes.map(c => [c.id, c]));
  const params = new URLSearchParams(window.location.search);
  const initial = { classId: params.get('classId') || '', period: params.get('period') || '', date: params.get('date') || '' };

  const handleUpdateLog = async (id, patch) => {
    await base44.entities.PeStopwatchLog.update(id, patch);
    setLogs(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));
  };

  const handleDeleteLog = async (log) => {
    if (!window.confirm('למחוק את המדידה הזו?')) return;
    await base44.entities.PeStopwatchLog.delete(log.id);
    setLogs(prev => prev.filter(l => l.id !== log.id));
    toast.success('המדידה נמחקה');
  };

  const handleFinish = async () => {
    if (!session) return;
    const created = await base44.entities.PeStopwatchLog.create({
      class_id: session.classId, date: session.date, period: session.period,
      label: session.label || '', laps: session.laps, total_time_ms: elapsedMs,
    });
    setLogs(prev => [created, ...prev]);
    stopwatch.closeSession();
    toast.success('המדידה נשמרה בהיסטוריה');
  };

  return (
    <Layout title="סטופר חכם" subtitle="מדידת זמן מהירה לשיעור" backTo="/">
      {session ? (
        <StopwatchRunner session={session} elapsedMs={elapsedMs} onStart={stopwatch.start} onPause={stopwatch.pause} onLap={stopwatch.lap} onReset={stopwatch.reset} onFinish={handleFinish} />
      ) : (
        <StopwatchSetup data={data} initial={initial} onStart={stopwatch.startSession} />
      )}

      <div className="max-w-[480px] mx-auto px-3 pb-10 space-y-2">
        <h3 className="text-sm font-bold pt-2">היסטוריית מדידות</h3>
        {loadingLogs ? (
          <p className="text-center text-sm text-muted-foreground py-8">טוען...</p>
        ) : (
          <StopwatchHistoryList logs={logs} classById={classById} onUpdate={handleUpdateLog} onDelete={handleDeleteLog} />
        )}
      </div>
    </Layout>
  );
}