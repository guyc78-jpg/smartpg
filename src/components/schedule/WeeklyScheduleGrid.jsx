import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { PERIODS, periodsForDay, getCurrentPeriod } from '@/lib/periodTimes';

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
      <table className="border-separate border-spacing-0 w-full min-w-[620px]">
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
          {PERIODS.map((p, rowIdx) => (
            <tr key={p}>
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
                const cellLessons = lessonsAt(d, p);
                const isTodayCol = d === today;
                const isLiveNow = isTodayCol && p === currentPeriod && cellLessons.length > 0;
                return (
                  <td
                    key={d}
                    onClick={() => { if (cellLessons.length <= 1) onCellClick(d, p, cellLessons[0] || null); }}
                    className={`schedule-cell min-h-14 min-w-[92px] border-b border-l border-border p-1 cursor-pointer transition-colors align-middle
                      ${isTodayCol ? 'is-today' : rowIdx % 2 === 1 ? 'is-alternate' : ''}
                      ${isTodayCol && p === currentPeriod ? 'is-current' : ''}
                      hover:brightness-110`}
                  >
                    {cellLessons.length > 0 ? (
                      <div className="space-y-1">
                        {cellLessons.map(lesson => (
                          <button
                            type="button"
                            key={lesson.id}
                            onClick={event => { event.stopPropagation(); onCellClick(d, p, lesson); }}
                            className={`schedule-lesson block w-full text-center space-y-0.5 rounded-xl px-1 py-1 ${isLiveNow ? 'is-live' : ''}`}
                          >
                            <p className="text-xs font-bold truncate leading-tight">{lesson.subject || 'חינוך גופני'}</p>
                            {(classById[lesson.classId]?.name || lesson.className) && (
                              <p className="text-[10px] text-muted-foreground truncate leading-tight">{classById[lesson.classId]?.name || lesson.className}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Plus className="w-4 h-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
