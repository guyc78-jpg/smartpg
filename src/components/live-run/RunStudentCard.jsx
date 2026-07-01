import { Check, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { displayRunStudentName, formatRunTime } from './runUtils';

function LapChip({ label, active, current, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center
        ${active ? 'bg-primary text-primary-foreground' : current ? 'border-2 border-primary bg-primary/10 text-primary' : 'border border-border bg-background text-muted-foreground'}
        disabled:opacity-40`}
    >
      {label}
    </button>
  );
}

export default function RunStudentCard({ student, participant, lapsRequired, grade, onLap, onFinish, onUndo, onStatus }) {
  const isRunning = participant.status === 'running';
  const isFinished = participant.status === 'finished';
  const disabled = !isRunning;
  const req = Math.ceil(Number(lapsRequired || 1));
  const lapLabels = [1, 2, 3, 4].filter(v => v <= req);
  if (Number(lapsRequired) % 1 !== 0) lapLabels.push('½');

  return (
    <div className={`rounded-2xl border p-2.5 ${isFinished ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' : 'bg-card border-border'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onUndo} disabled={!participant.history?.length} className="w-8 h-8 rounded-full text-muted-foreground disabled:opacity-30 hover:bg-muted flex items-center justify-center">
            <RotateCcw className="w-4 h-4" />
          </button>
          {isFinished ? (
            <span className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center"><Check className="w-4 h-4" /></span>
          ) : (
            <Button disabled={disabled} onClick={onFinish} className="h-9 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold">
              <Check className="w-3.5 h-3.5" /> סיים
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-extrabold text-[15px] truncate">{displayRunStudentName(student)}</h3>
          {participant.finishTimeMs != null && <span className="font-mono font-bold text-sm" dir="ltr">{formatRunTime(participant.finishTimeMs)}</span>}
          {isFinished && <span className="rounded-md bg-background border px-1.5 py-0.5 text-xs font-bold">{grade}</span>}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex flex-row-reverse gap-1.5">
          {lapLabels.map(label => {
            const threshold = Number(label === '½' ? lapsRequired : label);
            return (
              <LapChip
                key={label}
                label={label}
                active={participant.laps >= threshold}
                current={!isFinished && Math.ceil(participant.laps) + (Number(participant.laps) % 1 !== 0 ? 0 : 1) === threshold}
                disabled={disabled}
                onClick={onLap}
              />
            );
          })}
        </div>
        <span className="text-xs text-muted-foreground" dir="ltr">{participant.laps}/{lapsRequired}</span>
      </div>

      {!isFinished && (
        <div className="mt-2 flex flex-wrap gap-1.5 justify-end">
          {participant.status !== 'running' && <button onClick={() => onStatus('running')} className="text-xs font-bold text-primary">החזר לריצה</button>}
          {isRunning && (
            <>
              <button onClick={() => onStatus('not_participated')} className="text-xs text-muted-foreground">לא השתתף/ה</button>
              <button onClick={() => onStatus('exempt')} className="text-xs text-muted-foreground">פטור/ה</button>
              <button onClick={() => onStatus('not_completed')} className="text-xs text-muted-foreground">לא סיים/ה</button>
              <button onClick={() => onStatus('not_relevant')} className="text-xs text-muted-foreground">לא רלוונטי</button>
            </>
          )}
          {!isRunning && <span className="text-xs font-bold text-muted-foreground flex items-center gap-1"><X className="w-3 h-3" /> {participant.status === 'not_completed' ? 'לא סיים/ה' : participant.status === 'not_participated' ? 'לא השתתף/ה' : participant.status === 'exempt' ? 'פטור/ה' : 'לא רלוונטי'}</span>}
        </div>
      )}
    </div>
  );
}