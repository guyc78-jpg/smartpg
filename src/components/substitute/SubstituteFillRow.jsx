import { Trash2 } from 'lucide-react';
import { STATUS_LABELS, STATUS_STYLES } from './substituteUtils';

export default function SubstituteFillRow({ fill, onCycleStatus, onDelete }) {
  const d = new Date(fill.date + 'T00:00:00');
  const dateLabel = d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' });

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card border p-3" dir="rtl">
      <div className="text-center shrink-0 w-14">
        <p className="text-xs font-bold">{dateLabel}</p>
        {fill.period ? <p className="text-[10px] text-muted-foreground">שיעור {fill.period}</p> : null}
      </div>
      <div className="flex-1 min-w-0 text-right">
        <p className="font-bold text-sm truncate">{fill.className}</p>
        {(fill.subject || fill.location) && <p className="text-[10px] text-muted-foreground truncate">{[fill.subject, fill.location].filter(Boolean).join(' · ')}</p>}
      </div>
      <button
        onClick={() => onCycleStatus(fill)}
        className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-black transition-colors ${STATUS_STYLES[fill.status]}`}
        title="לחץ לשינוי סטטוס"
      >
        {STATUS_LABELS[fill.status]}
      </button>
      <button onClick={() => onDelete(fill)} className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="מחק">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
