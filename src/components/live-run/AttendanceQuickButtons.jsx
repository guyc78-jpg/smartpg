const OPTIONS = [
  { value: 'present', label: 'נוכח', active: 'bg-green-600 text-white' },
  { value: 'absent', label: 'נעדר', active: 'bg-destructive text-destructive-foreground' },
  { value: 'excused', label: 'פטור', active: 'bg-amber-500 text-white' },
];

export default function AttendanceQuickButtons({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 justify-start" dir="rtl">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-2.5 h-7 rounded-full text-[11px] font-bold transition-colors ${value === opt.value ? opt.active : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}