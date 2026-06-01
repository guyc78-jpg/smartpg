import { RotateCcw, Flag, Footprints, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RUN_STATUS_LABELS, formatRunTime } from './runUtils';

const STATUS_CLASS = {
  running: 'bg-primary/10 text-primary border-primary/20',
  finished: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  not_completed: 'bg-destructive/10 text-destructive border-destructive/20',
  not_participated: 'bg-muted text-muted-foreground border-border',
};

export default function RunStudentCard({ student, participant, elapsedMs, lapsRequired, onLap, onFinish, onUndo, onStatus }) {
  const currentTime = participant.finishTimeMs ?? elapsedMs;
  const disabled = participant.status !== 'running';

  return (
    <div className="card-3d rounded-2xl p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-base truncate">{student.name}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge variant="outline" className={STATUS_CLASS[participant.status]}>{RUN_STATUS_LABELS[participant.status]}</Badge>
            <Badge variant="secondary">{participant.laps}/{lapsRequired} הקפות</Badge>
          </div>
        </div>
        <div className="font-mono font-bold text-lg text-left shrink-0" dir="ltr">{participant.status === 'not_participated' ? '—' : formatRunTime(currentTime)}</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button disabled={disabled} onClick={onLap} className="h-12 text-sm font-bold btn-3d">
          <Footprints className="w-4 h-4" /> הקפה
        </Button>
        <Button disabled={disabled} variant="outline" onClick={onFinish} className="h-12 text-sm font-bold">
          <Flag className="w-4 h-4" /> סיום
        </Button>
        <Button variant="outline" onClick={onUndo} disabled={!participant.history?.length} className="h-12 text-sm font-bold">
          <RotateCcw className="w-4 h-4" /> בטל
        </Button>
        <Button variant="outline" onClick={() => onStatus(participant.status === 'not_participated' ? 'running' : 'not_participated')} className="h-12 text-sm font-bold">
          <XCircle className="w-4 h-4" /> לא השתתף
        </Button>
      </div>
    </div>
  );
}