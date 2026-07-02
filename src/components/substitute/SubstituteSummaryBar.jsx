import { Download, UserPlus } from 'lucide-react';

function Stat({ value, label, color }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-black leading-tight ${color || ''}`}>{value}</p>
      <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

export default function SubstituteSummaryBar({ fills, monthLabel, onExport }) {
  const reported = fills.filter(f => f.status === 'reported').length;
  const notReported = fills.filter(f => f.status === 'not_reported').length;
  const paid = fills.filter(f => f.status === 'paid').length;

  return (
    <div className="rounded-2xl border border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20 p-3" dir="rtl">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center shrink-0">
          <UserPlus className="w-4 h-4" />
        </span>
        <span className="text-sm font-black">סיכום {monthLabel}</span>
        <span className="flex-1" />
        <button onClick={onExport} disabled={fills.length === 0} className="h-8 px-3 rounded-lg border border-amber-300 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-100/60 disabled:opacity-40">
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2 pt-2">
        <Stat value={fills.length} label={'סה"כ'} />
        <Stat value={reported} label="דווחו" color="text-green-600" />
        <Stat value={notReported} label="לא דווחו" color="text-destructive" />
        <Stat value={paid} label="שולם" color="text-primary" />
      </div>
    </div>
  );
}