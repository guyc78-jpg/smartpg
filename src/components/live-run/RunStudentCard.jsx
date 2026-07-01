import { Check, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { displayRunStudentName, formatRunTime } from './runUtils';

export default function RunStudentCard({ student, participant, rank, isFreeType, onFinish, onUndo, onDistanceChange }) {
  const isRunning = participant.status === 'running';
  const isFinished = participant.status === 'finished';

  return (
    <div className={`rounded-2xl border p-3 ${isFinished ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' : 'bg-card border-border'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isFinished && rank != null && <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">{rank}</span>}
          <h3 className="font-extrabold text-[15px] truncate">{displayRunStudentName(student)}</h3>
          {isRunning && <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5 shrink-0">רץ/ה</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {participant.finishTimeMs != null && <span className="font-mono font-bold text-sm" dir="ltr">{formatRunTime(participant.finishTimeMs)}</span>}
          <button onClick={onUndo} disabled={!participant.history?.length} className="w-8 h-8 rounded-full text-muted-foreground disabled:opacity-30 hover:bg-muted flex items-center justify-center">
            <RotateCcw className="w-4 h-4" />
          </button>
          {isFinished ? (
            <span className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center"><Check className="w-4 h-4" /></span>
          ) : (
            <Button onClick={onFinish} className="h-9 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"><Check className="w-3.5 h-3.5" /> סיים</Button>
          )}
        </div>
      </div>

      {isFreeType && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">מרחק (מ׳):</span>
          <Input type="number" min="0" value={participant.resultDistance ?? ''} onChange={e => onDistanceChange(e.target.value)} className="h-9 text-sm max-w-[120px]" placeholder="אופציונלי" />
        </div>
      )}
    </div>
  );
}