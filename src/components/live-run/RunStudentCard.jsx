import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LapCircles from './LapCircles';
import { displayRunStudentName, formatResultSeconds } from './runUtils';

export default function RunStudentCard({ student, participant, totalLaps, grade, passThreshold = 55, onFinish, onNotParticipate, onUndo, onSetLaps }) {
  const name = displayRunStudentName(student);
  const status = participant.status;
  const laps = participant.laps || 0;

  if (status === 'not_participated' || status === 'not_completed') {
    return (
      <div className="rounded-2xl border bg-muted/40 p-3 flex items-center gap-2" dir="rtl">
        <div className="flex-1 min-w-0 text-right">
          <h3 className="font-extrabold text-[15px] truncate text-muted-foreground">{name}</h3>
          <span className="text-xs text-muted-foreground">{status === 'not_completed' ? 'לא השלים/ה' : 'לא השתתף/ה'}</span>
        </div>
        <button onClick={onUndo} disabled={!participant.history?.length} className="w-9 h-9 rounded-full text-muted-foreground disabled:opacity-30 hover:bg-muted flex items-center justify-center" aria-label="בטל">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (status === 'finished') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-3 flex items-center gap-2" dir="rtl">
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 justify-start">
            <h3 className="font-extrabold text-[15px] truncate">{name}</h3>
            {participant.finishTimeMs != null && (
              <span className="font-mono font-black text-sm text-green-700 dark:text-green-400" dir="ltr">{formatResultSeconds(participant.finishTimeMs)}</span>
            )}
            {grade != null && (
              <span className="rounded-md bg-green-600/15 text-green-700 dark:text-green-400 px-1.5 py-0.5 text-xs font-black shrink-0">{grade}</span>
            )}
            {grade != null && (
              grade >= passThreshold
                ? <span className="rounded-full bg-green-600 text-white px-2 py-0.5 text-[10px] font-black shrink-0">עבר ✓</span>
                : <span className="rounded-full bg-destructive text-destructive-foreground px-2 py-0.5 text-[10px] font-black shrink-0">לא עבר</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-2 justify-start">
            <LapCircles totalLaps={totalLaps} laps={laps} disabled />
            <span className="text-xs text-muted-foreground font-semibold shrink-0">{laps}/{totalLaps}</span>
          </div>
        </div>
        <button onClick={onUndo} className="w-9 h-9 rounded-full text-muted-foreground hover:bg-muted flex items-center justify-center shrink-0" aria-label="בטל סיום">
          <RotateCcw className="w-4 h-4" />
        </button>
        <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-3 flex items-center gap-2" dir="rtl">
      <div className="flex-1 min-w-0 text-right">
        <h3 className="font-extrabold text-[15px] truncate">{name}</h3>
        <div className="flex items-center gap-1.5 mt-2 justify-start">
          <LapCircles totalLaps={totalLaps} laps={laps} onSetLaps={onSetLaps} />
          <span className="text-xs text-muted-foreground font-semibold shrink-0">{laps}/{totalLaps}</span>
        </div>
      </div>
      <Button onClick={onFinish} className="h-10 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black shrink-0">סיים ✓</Button>
      <button onClick={onNotParticipate} className="w-9 h-9 rounded-full text-muted-foreground hover:bg-muted flex items-center justify-center shrink-0" aria-label="לא השתתף/ה">
        <XCircle className="w-5 h-5" />
      </button>
    </div>
  );
}