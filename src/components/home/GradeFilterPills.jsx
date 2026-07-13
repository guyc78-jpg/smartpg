const GRADES = ['ז', 'ח', 'ט', 'י', 'יא', 'יב'];

export default function GradeFilterPills({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-6 gap-1.5" dir="rtl" role="group" aria-label="סינון כיתות לפי שכבה">
      {GRADES.map(g => (
        <button
          key={g}
          type="button"
          onClick={() => onSelect(selected === g ? null : g)}
          aria-pressed={selected === g}
          className={`h-11 rounded-full text-sm font-bold liquid-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected === g ? 'liquid-chip-active' : ''}`}
        >
          {g}׳
        </button>
      ))}
    </div>
  );
}
