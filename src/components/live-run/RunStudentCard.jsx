import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

function LapChip({ label, active, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-9 h-9 rounded-full border text-sm font-bold transition-all ${active ? 'border-primary bg-primary/10 text-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.18)]' : 'border-border bg-background text-muted-foreground'} disabled:opacity-50`}
    >
      {label}
    </button>
  );
}

export default function RunStudentCard({ student, participant, lapsRequired, onLap, onFinish, onUndo, onStatus }) {
  const disabled = participant.status !== 'running';
  const lapLabels = [1, 2, 3, 4].filter(v => v <= Math.ceil(Number(lapsRequired || 1)));
  if (Number(lapsRequired) % 1 !== 0) lapLabels.push('½');

  return (
    <div className="rounded-2xl border border-primary/35 bg-primary/5 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onUndo} disabled={!participant.history?.length} className="w-8 h-8 rounded-full text-muted-foreground disabled:opacity-30 hover:bg-background flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
          <Button disabled={disabled} onClick={onFinish} className="h-12 px-5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-md">
            <Check className="w-4 h-4" /> סיים
          </Button>
        </div>

        <div className="flex-1 min-w-0 text-right">
          <h3 className="font-extrabold text-[15px] truncate">{student.name}</h3>
          <div className="flex items-center justify-end gap-2 mt-2">
            <span className="text-xs text-muted-foreground" dir="ltr">{participant.laps}/{lapsRequired}</span>
            <div className="flex flex-row-reverse gap-1.5">
              {lapLabels.map(label => (
                <LapChip
                  key={label}
                  label={label}
                  active={participant.laps >= Number(label === '½' ? lapsRequired : label)}
                  disabled={disabled}
                  onClick={onLap}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {participant.status === 'not_participated' && (
        <button onClick={() => onStatus('running')} className="mt-2 text-xs text-primary font-bold">החזר לריצה</button>
      )}
      {participant.status === 'running' && (
        <button onClick={() => onStatus('not_participated')} className="mt-2 text-xs text-muted-foreground">סמן לא השתתף/ה</button>
      )}
    </div>
  );
}