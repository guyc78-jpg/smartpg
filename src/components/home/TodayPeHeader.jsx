import { DAY_LABELS } from '@/lib/scheduleImport';
import { findCurrentAndNextLesson } from '@/lib/periodTimes';

function classesFontSize(count) {
  if (count <= 2) return 'text-sm';
  if (count <= 4) return 'text-xs';
  if (count <= 7) return 'text-[11px]';
  return 'text-[10px]';
}

export default function TodayPeHeader({ todaysLessons, classById }) {
  const today = new Date();
  const dayLabel = DAY_LABELS[today.getDay()];
  const dateStr = today.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });

  const uniqueClasses = [];
  const seen = new Set();
  todaysLessons.forEach(l => {
    if (seen.has(l.classId)) return;
    seen.add(l.classId);
    uniqueClasses.push(classById[l.classId] || { id: l.classId, name: l.className });
  });

  const { current, next } = findCurrentAndNextLesson(todaysLessons);
  const currentOrNext = current || next;
  const currentOrNextClassName = currentOrNext ? (classById[currentOrNext.classId]?.name || currentOrNext.className) : '';

  return (
    <div className="rounded-2xl bg-gradient-to-l from-primary to-primary/85 text-primary-foreground p-4 space-y-2 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs opacity-80">יום {dayLabel}</p>
          <p className="text-lg font-bold leading-tight">{dateStr}</p>
        </div>
        <div className="text-left">
          {currentOrNext ? (
            <>
              <p className="text-[11px] opacity-80">{current ? 'שיעור נוכחי' : 'שיעור הבא'}</p>
              <p className="text-sm font-bold">שעה {currentOrNext.period} · {currentOrNextClassName}</p>
            </>
          ) : todaysLessons.length > 0 ? (
            <p className="text-xs opacity-80">אין שיעורים נוספים היום</p>
          ) : null}
        </div>
      </div>

      {uniqueClasses.length > 0 ? (
        <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {uniqueClasses.map(c => (
            <span key={c.id} className={`shrink-0 whitespace-nowrap rounded-full bg-white/15 px-2.5 py-1 font-semibold ${classesFontSize(uniqueClasses.length)}`}>
              {c.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm font-semibold pt-1">אין שיעורי חנ״ג היום</p>
      )}
    </div>
  );
}