import { RotateCcw, TimerReset, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RUN_STATUS_LABELS, displayRunStudentName, formatRunTime } from './runUtils';

function StatusButton({ label, onClick }) {
  return <button onClick={onClick} className="rounded-lg border bg-background px-2 py-1 text-[11px] font-bold text-muted-foreground active:scale-95">{label}</button>;
}

export default function RunStudentCard({ student, participant, elapsedMs, lapsRequired, onLap, onFinish, onUndo, onStatus }) {
  const isRunning = participant.status === 'running';
  const isFinished = participant.status === 'finished';
  const shownTime = isFinished ? participant.finishTimeMs : isRunning ? elapsedMs : null;

  return (
    <div className={`rounded-2xl border p-2.5 shadow-sm ${isFinished ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : isRunning ? 'bg-card border-primary/30' : 'bg-muted/40 border-border'}`}>
      <div className="grid grid-cols-[1fr_auto] gap-2 items-start">
        <div className="min-w-0 text-right">
          <div className="flex items-center gap-2 justify-end">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isFinished ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-secondary text-secondary-foreground'}`}>{RUN_STATUS_LABELS[participant.status]}</span>
            <h3 className="font-black text-[15px] truncate">{displayRunStudentName(student)}</h3>
          </div>
          <div className="mt-1 flex items-center justify-end gap-3 text-xs text-muted-foreground">
            <span>סיבובים: <b className="text-foreground" dir="ltr">{participant.laps}/{lapsRequired}</b></span>
            <span>זמן: <b className="font-mono text-foreground" dir="ltr">{shownTime !== null ? formatRunTime(shownTime) : '—'}</b></span>
          </div>
        </div>
        <button onClick={onUndo} disabled={!participant.history?.length} className="h-9 w-9 rounded-full border bg-background text-muted-foreground disabled:opacity-25 flex items-center justify-center">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-[1fr_1fr] gap-2">
        <Button disabled={!isRunning} onClick={onLap} variant="outline" className="h-12 rounded-xl font-black"><TimerReset className="w-4 h-4" /> סיבוב</Button>
        <Button disabled={!isRunning} onClick={onFinish} className="h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black">סיום</Button>
      </div>

      <div className="mt-2 flex flex-wrap justify-end gap-1.5">
        {participant.status !== 'running' && <StatusButton label="החזר לריצה" onClick={() => onStatus('running')} />}
        <StatusButton label="לא בוצע" onClick={() => onStatus('not_participated')} />
        <StatusButton label="פטור" onClick={() => onStatus('exempt')} />
        <StatusButton label="לא סיים" onClick={() => onStatus('not_completed')} />
        <StatusButton label="לא רלוונטי" onClick={() => onStatus('not_relevant')} />
        <button onClick={() => onStatus('not_participated')} className="h-7 w-7 rounded-full text-muted-foreground flex items-center justify-center"><XCircle className="w-4 h-4" /></button>
      </div>
    </div>
  );
}