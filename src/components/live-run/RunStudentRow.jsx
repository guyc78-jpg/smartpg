import { useState } from 'react';
import { Check, Plus, RotateCcw, User } from 'lucide-react';
import { displayRunStudentName, formatClockTime } from './runUtils';

export default function RunStudentRow({ student, participant, raceStarted, raceRunning, grade, passThreshold = 55, onLap, onNotParticipate, onUndo }) {
  const [expanded, setExpanded] = useState(false);
  const name = displayRunStudentName(student);
  const status = participant.status;
  const laps = participant.laps || 0;
  const lapTimes = participant.lapTimes || [];
  const out = status === 'not_participated' || status === 'not_completed';
  const finished = status === 'finished';
  const lastTime = finished ? participant.finishTimeMs : (lapTimes.length ? lapTimes[lapTimes.length - 1] : 0);

  return (
    <div className={`border-b last:border-0 px-3 py-2.5 ${out ? 'bg-muted/30' : 'bg-card'}`} dir="rtl">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${finished ? 'bg-green-100 dark:bg-green-950/40' : 'bg-muted'}`}>
          {finished ? <Check className="w-5 h-5 text-green-600" strokeWidth={3} /> : <User className={`w-5 h-5 ${out ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />}
        </div>

        <button type="button" onClick={() => setExpanded(v => !v)} className="flex-1 min-w-0 text-right">
          <h3 className={`font-bold text-[15px] truncate ${out ? 'text-muted-foreground' : ''}`}>{name}</h3>
          <p className="text-xs text-muted-foreground">
            {out ? (status === 'not_completed' ? 'לא השלים/ה' : 'לא השתתף/ה') : `סיבובים: ${laps}`}
          </p>
        </button>

        {finished && grade != null && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black shrink-0 ${grade >= passThreshold ? 'bg-green-600 text-white' : 'bg-destructive text-destructive-foreground'}`}>
            {grade} {grade >= passThreshold ? '✓' : ''}
          </span>
        )}

        {!out && (
          <span className={`font-mono font-black text-sm shrink-0 ${finished ? 'text-green-600' : 'text-primary'}`} dir="ltr">
            {formatClockTime(lastTime)}
          </span>
        )}

        {!out && !finished && (
          <div className="flex flex-col items-center shrink-0 -my-1">
            <button
              onClick={onLap}
              disabled={!raceRunning}
              className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition disabled:opacity-30"
              aria-label="סיבוב"
            >
              <Plus className="w-5 h-5" strokeWidth={3} />
            </button>
            <span className="text-[9px] text-muted-foreground font-semibold leading-none mt-0.5">סיבוב</span>
          </div>
        )}

        {(out || finished) && (
          <button onClick={onUndo} disabled={!participant.history?.length} className="w-9 h-9 rounded-full text-muted-foreground disabled:opacity-30 hover:bg-muted flex items-center justify-center shrink-0" aria-label="בטל">
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {lapTimes.length > 0 && !out && (
        <div className="flex gap-1.5 mt-1.5 pr-[52px] overflow-x-auto no-scrollbar">
          {lapTimes.map((t, i) => (
            <span key={i} className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground/80" dir="ltr">
              {i + 1} - {formatClockTime(t)}
            </span>
          ))}
        </div>
      )}

      {expanded && (
        <div className="mt-2 pt-2 border-t space-y-2">
          <div className="flex gap-2">
            {!out && !finished && raceStarted && (
              <button onClick={onNotParticipate} className="flex-1 h-9 rounded-xl border text-xs font-bold text-muted-foreground hover:bg-muted">
                לא השתתף/ה
              </button>
            )}
            <button onClick={onUndo} disabled={!participant.history?.length} className="flex-1 h-9 rounded-xl border text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-30 flex items-center justify-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> ביטול פעולה אחרונה
            </button>
          </div>
        </div>
      )}
    </div>
  );
}