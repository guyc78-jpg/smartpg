import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flag, Loader2, Pause, Play, RotateCcw, Save, Timer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import { toLocalISODate, formatLocalDate } from '@/lib/dateTime';
import { formatRunTime } from '@/components/live-run/runUtils';

function useStopwatchClock() {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef(0);
  const accumulatedRef = useRef(0);

  useEffect(() => {
    if (!running) return undefined;
    let frame;
    const tick = () => {
      setElapsedMs(accumulatedRef.current + performance.now() - startedAtRef.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const start = useCallback(() => {
    if (running) return;
    startedAtRef.current = performance.now();
    setRunning(true);
  }, [running]);

  const pause = useCallback(() => {
    if (!running) return;
    accumulatedRef.current += performance.now() - startedAtRef.current;
    setElapsedMs(accumulatedRef.current);
    setRunning(false);
  }, [running]);

  const reset = useCallback(() => {
    accumulatedRef.current = 0;
    startedAtRef.current = performance.now();
    setElapsedMs(0);
    setRunning(false);
  }, []);

  return { running, elapsedMs, start, pause, reset };
}

export default function StopwatchPage() {
  const { data } = useApp();
  const clock = useStopwatchClock();
  const [classId, setClassId] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [laps, setLaps] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);

  const classes = useMemo(
    () => data.classes.filter(item => (item.status || 'active') === 'active').sort((a, b) => a.name.localeCompare(b.name, 'he')),
    [data.classes]
  );

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const rows = classId
        ? await base44.entities.PeStopwatchLog.filter({ class_id: classId }, '-created_date', 25)
        : await base44.entities.PeStopwatchLog.list('-created_date', 25);
      setHistory(rows || []);
    } catch (error) {
      console.error('Failed to load stopwatch history', error);
      toast.error('לא ניתן לטעון את היסטוריית הסטופר');
    } finally {
      setLoadingHistory(false);
    }
  }, [classId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const addLap = () => {
    if (clock.elapsedMs <= 0) return;
    setLaps(current => [...current, Math.round(clock.elapsedMs)]);
  };

  const resetAll = () => {
    clock.reset();
    setLaps([]);
  };

  const saveMeasurement = async () => {
    if (!classId) return toast.error('יש לבחור כיתה לפני השמירה');
    if (clock.elapsedMs <= 0) return toast.error('יש להפעיל את הסטופר לפני השמירה');
    if (clock.running) clock.pause();
    setSaving(true);
    try {
      await base44.entities.PeStopwatchLog.create({
        class_id: classId,
        date: toLocalISODate(),
        period: 1,
        label: label.trim() || 'מדידת סטופר',
        laps,
        total_time_ms: Math.round(clock.elapsedMs),
        notes: notes.trim(),
      });
      toast.success('המדידה נשמרה');
      resetAll();
      setLabel('');
      setNotes('');
      await loadHistory();
    } catch (error) {
      console.error('Failed to save stopwatch result', error);
      toast.error('שמירת המדידה נכשלה');
    } finally {
      setSaving(false);
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      await base44.entities.PeStopwatchLog.delete(id);
      setHistory(current => current.filter(item => item.id !== id));
      toast.success('המדידה נמחקה');
    } catch (error) {
      console.error('Failed to delete stopwatch result', error);
      toast.error('מחיקת המדידה נכשלה');
    }
  };

  const [mainTime, centis] = formatRunTime(clock.elapsedMs).split('.');

  return (
    <Layout title="סטופר חנ״ג" subtitle="מדידה עצמאית עם הקפות והיסטוריה" backTo="/">
      <main className="mx-auto max-w-2xl space-y-4 p-4 pb-28" dir="rtl">
        <section className="glass-surface rounded-3xl p-4 sm:p-6">
          <div className="mx-auto flex aspect-square w-64 max-w-full flex-col items-center justify-center rounded-full border border-primary/30 bg-primary/5 shadow-[inset_0_0_32px_hsl(var(--primary)/0.12)]" aria-live="off">
            <Timer className={`mb-3 h-8 w-8 ${clock.running ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            <div dir="ltr" className="flex items-baseline" aria-label={`זמן ${formatRunTime(clock.elapsedMs)}`}>
              <span className="font-mono text-5xl font-black tabular-nums sm:text-6xl">{mainTime}</span>
              <span className="font-mono text-2xl font-bold tabular-nums text-primary">.{centis}</span>
            </div>
            <span className="mt-2 text-sm font-semibold text-muted-foreground">{clock.running ? 'המדידה פעילה' : clock.elapsedMs > 0 ? 'המדידה מושהית' : 'מוכן למדידה'}</span>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            <Button type="button" variant="outline" onClick={resetAll} disabled={clock.elapsedMs <= 0} className="h-12 px-2" aria-label="איפוס הסטופר"><RotateCcw /></Button>
            <Button type="button" variant="outline" onClick={addLap} disabled={clock.elapsedMs <= 0} className="h-12 gap-1 px-2"><Flag />הקפה</Button>
            <Button type="button" onClick={clock.running ? clock.pause : clock.start} className="col-span-2 h-12 gap-2 font-bold">
              {clock.running ? <Pause /> : <Play />}{clock.running ? 'השהה' : clock.elapsedMs > 0 ? 'המשך' : 'התחל'}
            </Button>
          </div>

          {laps.length > 0 && (
            <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="זמני הקפות">
              {laps.map((lap, index) => (
                <li key={`${lap}-${index}`} className="liquid-chip rounded-xl px-3 py-2 text-sm flex justify-between gap-2" dir="ltr">
                  <span>Lap {index + 1}</span><strong className="font-mono">{formatRunTime(lap)}</strong>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="glass-surface rounded-2xl p-4 space-y-3" aria-labelledby="save-stopwatch-title">
          <h2 id="save-stopwatch-title" className="font-bold">שמירת מדידה</h2>
          <label className="block space-y-1 text-sm font-semibold">
            <span>כיתה</span>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="h-11" aria-label="בחירת כיתה"><SelectValue placeholder="בחר כיתה" /></SelectTrigger>
              <SelectContent>{classes.map(cls => <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <label className="block space-y-1 text-sm font-semibold">
            <span>שם המדידה</span>
            <Input value={label} onChange={event => setLabel(event.target.value)} maxLength={100} placeholder="למשל: ספרינט קבוצתי" className="h-11" />
          </label>
          <label className="block space-y-1 text-sm font-semibold">
            <span>הערות</span>
            <Textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={500} placeholder="הערה אופציונלית" />
          </label>
          <Button type="button" onClick={saveMeasurement} disabled={saving || clock.elapsedMs <= 0} className="h-12 w-full gap-2 font-bold">
            {saving ? <Loader2 className="animate-spin" /> : <Save />} {saving ? 'שומר…' : 'שמור מדידה'}
          </Button>
        </section>

        <section className="space-y-2" aria-labelledby="stopwatch-history-title">
          <h2 id="stopwatch-history-title" className="px-1 font-bold">מדידות אחרונות</h2>
          {loadingHistory ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : history.length === 0 ? (
            <div className="glass-surface rounded-2xl p-8 text-center text-sm text-muted-foreground">עדיין לא נשמרו מדידות.</div>
          ) : history.map(item => {
            const className = data.classes.find(cls => cls.id === item.class_id)?.name || 'כיתה שנמחקה';
            return (
              <article key={item.id} className="glass-surface rounded-2xl p-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold">{item.label || 'מדידת סטופר'}</h3>
                  <p className="text-xs text-muted-foreground">{className} · {formatLocalDate(item.date)} · {(item.laps || []).length} הקפות</p>
                </div>
                <strong className="font-mono tabular-nums" dir="ltr">{formatRunTime(item.total_time_ms)}</strong>
                <Button type="button" variant="ghost" size="icon" onClick={() => deleteHistoryItem(item.id)} aria-label={`מחק מדידה ${item.label || ''}`} className="text-destructive"><Trash2 /></Button>
              </article>
            );
          })}
        </section>
      </main>
    </Layout>
  );
}
