const GRADES = ['ז', 'ח', 'ט', 'י', 'יא', 'יב'];

export default function GradeFilterPills({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-6 gap-1.5" dir="rtl">
      {GRADES.map(g => (
        <button
          key={g}
          onClick={() => onSelect(selected === g ? null : g)}
          className={`h-9 rounded-full text-sm font-bold border transition-colors
            ${selected === g
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card/70 text-foreground border-border/60 hover:bg-secondary'}`}
        >
          {g}׳
        </button>
      ))}
    </div>
  );
}