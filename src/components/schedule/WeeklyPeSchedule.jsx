import { DAY_LABELS } from '@/lib/scheduleImport';
import { formatPeriodStart } from '@/lib/periodTimes';

const WEEKDAYS = [0, 1, 2, 3, 4]; // Sunday-Thursday only, no Friday/Saturday

export default function WeeklyPeSchedule({ scheduleLessons, classById }) {
  const byDay = WEEKDAYS.reduce((acc, day) => {
    acc[day] = (scheduleLessons || [])
      .filter(l => l.dayOfWeek === day)
      .sort((a, b) => a.period - b.period);
    return acc;
  }, {});

  const hasAny = WEEKDAYS.some(day => byDay[day].length > 0);
  if (!hasAny) {
    return <p className="text-center text-sm text-muted-foreground py-8">אין שיעורי חינוך גופני במערכת. ייבא מערכת שעות כדי להתחיל.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {WEEKDAYS.filter(day => byDay[day].length > 0).map(day => (
        <div key={day} className="rounded-xl bg-muted/40 p-3 space-y-1.5">
          <p className="text-xs font-bold text-muted-foreground">יום {DAY_LABELS[day]}</p>
          <div className="space-y-1.5">
            {byDay[day].map(lesson => (
              <div key={lesson.id} className="rounded-lg bg-card p-2 flex items-center gap-2">
                <div className="text-center shrink-0 w-11">
                  <p className="text-xs font-bold">{formatPeriodStart(lesson.period)}</p>
                  <p className="text-[9px] text-muted-foreground">שיעור {lesson.period}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground break-words">{lesson.subject || 'חינוך גופני'}</p>
                  <p className="text-sm font-bold break-words">{classById[lesson.classId]?.name || lesson.className}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}