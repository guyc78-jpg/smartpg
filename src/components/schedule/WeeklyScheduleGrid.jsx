import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { PERIODS, periodsForDay, getCurrentPeriod } from '@/lib/periodTimes';
import { getScheduleGridDimensions } from '@/lib/scheduleGridLayout';
import { formatCompactClassSummary, getAdaptiveClassLabels, groupScheduleLessonsForDisplay } from '@/lib/scheduleDisplay';

const DAYS = [0, 1, 2, 3, 4, 5];
const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];

export default function WeeklyScheduleGrid({ scheduleLessons, classById, onCellClick }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().getDay();
  const currentPeriod = getCurrentPeriod();

  const lessonsAt = (day, period) =>
    (scheduleLessons || []).filter(l => l.dayOfWeek === day && Number(l.period) === Number(period));

  return (
    <div className="schedule-grid overflow-x-auto no-scrollbar rounded-2xl" dir="rtl">
      <table className="table-fixed border-separate border-spacing-0 w-full min-w-[720px]">
        <thead>
          <tr>
            <th
              className="schedule-corner sticky right-0 z-20 w-12 h-11 p-0 rounded-tr-2xl overflow-hidden border-b border-l border-border"
            >
              <div className="relative w-full h-full">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                </svg>
                <span className="absolute top-[5px] left-[7px] text-[10px] font-black leading-none drop-shadow-sm">יום</span>
                <span className="absolute bottom-[5px] right-[6px] text-[10px] font-black leading-none drop-shadow-sm">שעה</span>
              </div>
            </th>
            {DAYS.map(d => (
              <th
                key={d}
                className={`schedule-day-head h-11 text-sm font-black px-2 border-b border-l border-border ${d === today ? 'is-today' : ''} ${d === DAYS[DAYS.length - 1] ? 'rounded-tl-2xl' : ''}`}
              >
                {DAY_NAMES[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map((p, rowIdx) => {
            const lessonsByDay = Object.fromEntries(DAYS.map(day => {
              const lessons = groupScheduleLessonsForDisplay(lessonsAt(day, p), classById).sort((a, b) => {
                const aClass = a.displayClassName || classById[a.classId]?.name || a.className || '';
                const bClass = b.displayClassName || classById[b.classId]?.name || b.className || '';
                return aClass.localeCompare(bClass, 'he', { numeric: true, sensitivity: 'base' })
                  || (a.subject || '').localeCompare(b.subject || '', 'he');
              });
              return [day, lessons];
            }));
            const maxLessonsInPeriod = Math.max(0, ...DAYS.map(day => lessonsByDay[day].length));
            const { columns: lessonColumnCount, rows: lessonTrackCount } = getScheduleGridDimensions(maxLessonsInPeriod);
            const lessonGridStyle = {
              gridTemplateColumns: `repeat(${lessonColumnCount}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${lessonTrackCount}, minmax(2.75rem, 1fr))`,
            };

            return (
              <tr key={p} data-lesson-columns={lessonColumnCount} data-lesson-tracks={lessonTrackCount}>
                <th
                  className="schedule-period-head sticky right-0 z-10 border-b border-l border-border p-1"
                >
                  <div className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-sm font-black ${p === currentPeriod ? 'text-primary-foreground bg-primary ring-1 ring-primary/50' : ''}`}>
                    {p}
                  </div>
                </th>
                {DAYS.map(d => {
                  const dayHasPeriod = periodsForDay(d).includes(p);
                  if (!dayHasPeriod) {
                    return <td key={d} className="schedule-cell is-unavailable h-14 min-w-[92px] border-b border-l border-border" />;
                  }
                  const cellLessons = lessonsByDay[d];
                  const isTodayCol = d === today;
                  const isLiveNow = isTodayCol && p === currentPeriod && cellLessons.length > 0;
                  return (
                    <td
                      key={d}
                      onClick={() => { if (cellLessons.length <= 1) onCellClick(d, p, cellLessons[0] || null); }}
                      className={`schedule-cell min-h-14 min-w-[92px] border-b border-l border-border p-1 cursor-pointer transition-colors align-top
                        ${isTodayCol ? 'is-today' : rowIdx % 2 === 1 ? 'is-alternate' : ''}
                        ${isTodayCol && p === currentPeriod ? 'is-current' : ''}
                        hover:brightness-110`}
                    >
                      {cellLessons.length > 0 ? (
                        <div
                          className="grid h-full gap-1 content-start"
                          style={lessonGridStyle}
                          role="group"
                          aria-label={`${cellLessons.length} שיעורים ביום ${DAY_NAMES[d]}, שעה ${p}`}
                        >
                          {cellLessons.map((lesson, lessonIndex) => {
                            const canUseFullWidthRows = lessonColumnCount === 2
                              && cellLessons.length <= lessonTrackCount;
                            const isBalancedLastLesson = lessonColumnCount === 2
                              && cellLessons.length % 2 === 1
                              && lessonIndex === cellLessons.length - 1;
                            const shouldSpanFullRow = canUseFullWidthRows || isBalancedLastLesson;
                            const lessonSubject = lesson.subject || 'חינוך גופני';
                            const lessonClass = lesson.displayClassName || classById[lesson.classId]?.name || lesson.className || '';
                            const classNames = lesson.classLabels || [lessonClass];
                            const { labels: allClassLabels } = getAdaptiveClassLabels(classNames);
                            const hasMultipleClasses = lesson.isGrouped && allClassLabels.length > 1;
                            const compactClassSummary = formatCompactClassSummary(allClassLabels);
                            return (
                              <button
                                type="button"
                                key={lesson.id}
                                onClick={event => { event.stopPropagation(); onCellClick(d, p, lesson); }}
                                title={[lessonSubject, allClassLabels.join(', ')].filter(Boolean).join(' · ')}
                                aria-label={[lessonSubject, allClassLabels.join(', ')].filter(Boolean).join(', ')}
                                className={`schedule-lesson flex min-h-11 h-full min-w-0 w-full flex-col items-center justify-center overflow-hidden rounded-xl px-0.5 py-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${shouldSpanFullRow ? 'col-span-2' : ''} ${isLiveNow ? 'is-live' : ''}`}
                              >
                                <p className="w-full min-w-0 truncate text-[11px] font-bold leading-tight">{lessonSubject}</p>
                                {hasMultipleClasses ? (
                                  <p className="w-full min-w-0 truncate px-0.5 text-[9px] font-semibold leading-tight text-muted-foreground" aria-hidden="true">
                                    {compactClassSummary}
                                  </p>
                                ) : lessonClass && (
                                  <p className="w-full min-w-0 truncate text-[9px] text-muted-foreground leading-tight">{lessonClass}</p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid h-full min-h-12" style={lessonGridStyle}>
                          <span className="grid place-items-center" style={{ gridColumn: '1 / -1', gridRow: '1 / -1' }}>
                            <Plus className="w-4 h-4 text-muted-foreground/40" />
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
