import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Play, RotateCcw, Search, Square } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import { useLiveRun } from '@/contexts/LiveRunContext';
import RunSetup from '@/components/live-run/RunSetup';
import RunStudentCard from '@/components/live-run/RunStudentCard';
import RunSummary from '@/components/live-run/RunSummary';
import { formatRunTime, secondsFromMs, sortRunStudents } from '@/components/live-run/runUtils';
import { measurementTypeLabel } from '@/lib/runMeasurementTypes';

export default function LiveRunPage() {
  const navigate = useNavigate();
  const { data } = useApp();
  const run = useLiveRun();
  const { session, elapsedMs } = run;
  const [search, setSearch] = useState('');

  const selectedStudents = useMemo(() => {
    if (!session) return [];
    return data.students.filter(s => session.selectedIds.includes(s.id));
  }, [data.students, session]);

  const currentClass = data.classes.find(c => c.id === session?.setup?.classId);
  const isFreeType = session?.setup?.measurementType === 'free';

  const counts = useMemo(() => {
    const values = Object.values(session?.participants || {});
    return {
      running: values.filter(p => p.status === 'running').length,
      finished: values.filter(p => p.status === 'finished').length,
    };
  }, [session]);

  const params = new URLSearchParams(window.location.search);
  const initial = { classId: params.get('classId') || '', period: params.get('period') || '', date: params.get('date') || '' };

  const resetRun = () => {
    if (window.confirm('איפוס הריצה ימחק את כל הזמנים הזמניים. להמשיך?')) run.resetRun();
  };

  const finishRun = () => {
    if (window.confirm('לעבור למסך סיכום? תלמידים שעדיין רצים יסומנו כלא השתתפו.')) run.finishRun();
  };

  const saveSummary = async () => {
    if (!session) return;
    const { classId, date, period, measurementType } = session.setup;
    const existing = await base44.entities.RunMeasurement.filter({ class_id: classId, date, period, measurement_type: measurementType });
    const existingByStudent = Object.fromEntries(existing.map(r => [r.student_id, r]));

    const toCreate = [];
    const toUpdate = [];
    for (const student of selectedStudents) {
      const participant = session.participants[student.id];
      const completed = participant.status === 'finished';
      const payload = {
        student_id: student.id, class_id: classId, date, period,
        measurement_type: measurementType,
        result_seconds: completed ? secondsFromMs(participant.finishTimeMs) : null,
        result_distance: participant.resultDistance != null && participant.resultDistance !== '' ? Number(participant.resultDistance) : null,
        status: completed ? 'finished' : 'not_participated',
      };
      const match = existingByStudent[student.id];
      if (match) toUpdate.push({ id: match.id, ...payload });
      else toCreate.push(payload);
    }
    if (toCreate.length > 0) await base44.entities.RunMeasurement.bulkCreate(toCreate);
    if (toUpdate.length > 0) await base44.entities.RunMeasurement.bulkUpdate(toUpdate);
    run.markSaved();
    run.closeSession();
    toast.success('התוצאות נשמרו');
    navigate(`/class/${classId}`);
  };

  if (!session) {
    return <Layout title="ריצה חיה" subtitle="מדידת תלמידים בשיעורי חנ״ג" backTo="/"><RunSetup data={data} initial={initial} onStart={run.startSession} /></Layout>;
  }

  if (session.phase === 'summary') {
    return (
      <Layout title="סיכום ריצה" subtitle={`${currentClass?.name || ''} · ${measurementTypeLabel(session.setup.measurementType)}`} backTo="/live-run">
        <RunSummary session={session} students={selectedStudents} onEdit={run.updateSummaryResult} onBack={run.reopenRun} onSave={saveSummary} isFreeType={isFreeType} />
      </Layout>
    );
  }

  const searchTerm = search.trim().toLowerCase();
  const sortedStudents = sortRunStudents(selectedStudents, session.participants)
    .filter(s => !searchTerm || `${s.name || ''} ${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(searchTerm));

  const finishedRank = {};
  sortRunStudents(selectedStudents, session.participants)
    .filter(s => session.participants[s.id].status === 'finished')
    .forEach((s, idx) => { finishedRank[s.id] = idx + 1; });

  return (
    <Layout title="ריצה חיה" subtitle={`${currentClass?.name || ''} · ${measurementTypeLabel(session.setup.measurementType)}`}>
      <div className="max-w-[520px] mx-auto px-2 pt-3 pb-28 space-y-3" dir="rtl">
        <section className="sticky z-30 rounded-b-3xl bg-background/95 backdrop-blur border-b px-2 pb-3 text-center space-y-3 relative" style={{ top: 'var(--header-h, 0px)' }}>
          <button onClick={resetRun} aria-label="איפוס ריצה" className="absolute left-2 top-2 h-7 w-7 rounded-full text-muted-foreground hover:bg-muted flex items-center justify-center" title="איפוס ריצה">
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="font-mono text-6xl font-black tracking-wider text-foreground" dir="ltr">{formatRunTime(elapsedMs)} 🏃</div>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>רצים: {counts.running}</span>
            <span>סיימו: {counts.finished}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {session.running ? (
              <Button onClick={run.pauseTimer} className="h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-lg font-black"><Square className="w-4 h-4" /> עצור</Button>
            ) : (
              <Button onClick={run.startTimer} className="h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-lg font-black"><Play className="w-4 h-4" /> {elapsedMs ? 'המשך' : 'התחל'}</Button>
            )}
            <Button variant="outline" onClick={finishRun} className="h-14 rounded-2xl text-lg font-black"><Flag className="w-4 h-4" /> סיים ריצה</Button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש תלמיד/ה" className="w-full h-10 rounded-xl border border-input bg-background pr-9 pl-3 text-sm" />
          </div>
        </section>

        <div className="space-y-2">
          {sortedStudents.map(student => (
            <RunStudentCard
              key={student.id}
              student={student}
              participant={session.participants[student.id]}
              rank={finishedRank[student.id]}
              isFreeType={isFreeType}
              onFinish={() => run.finishStudent(student.id)}
              onUndo={() => run.undoStudent(student.id)}
              onDistanceChange={(value) => run.updateSummaryResult(student.id, { resultDistance: value })}
            />
          ))}
          {sortedStudents.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">לא נמצאו תלמידים.</div>}
        </div>
      </div>
    </Layout>
  );
}