export default function LapCircles({ totalLaps, laps, onSetLaps, disabled }) {
  const fullLaps = Math.floor(totalLaps);
  const hasHalf = totalLaps % 1 !== 0;
  const values = Array.from({ length: fullLaps }, (_, i) => i + 1);
  if (hasHalf) values.push(totalLaps);

  const nextValue = laps < fullLaps ? Math.floor(laps) + 1 : (hasHalf && laps < totalLaps ? totalLaps : null);

  return (
    <div className="flex flex-wrap items-center gap-1" dir="rtl">
      {values.map(value => {
        const isHalf = hasHalf && value === totalLaps;
        const done = laps >= value;
        const isNext = value === nextValue;
        const clickable = !disabled && (done || isNext);
        return (
          <button
            key={value}
            type="button"
            disabled={!clickable}
            onClick={() => onSetLaps?.(done ? (isHalf ? fullLaps : value - 1) : value)}
            className={`w-8 h-8 rounded-full text-xs font-black flex items-center justify-center transition-colors ${
              done ? 'bg-primary text-primary-foreground'
              : isNext ? 'bg-primary/10 text-primary ring-2 ring-primary/40'
              : 'bg-muted text-muted-foreground/50'
            }`}
          >
            {isHalf ? '½' : value}
          </button>
        );
      })}
    </div>
  );
}