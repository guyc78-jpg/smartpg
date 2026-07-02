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
    <div className="overflow-x-auto no-scrollbar rounded-2xl border shadow-sm" dir="rtl">
      <table className="border-separate border-spacing-0 w-full min-w-[620px]">
        <thead>
          <tr>
            <th className="sticky right-0 z-20 w-12 bg-gradient-to-b from-primary to-primary/85 text-primary-foreground text-[10px] font-bold p-1 rounded-tr-2xl">
              <div className="text-right pr-0.5">יום</div>
              <div className="text-left pl-0.5 border-t border-primary-foreground/25 mt-0.5 pt-0.5">שעה</div>
            </th>
            {DAYS.map(d => (
              <th
                key={d}
                className={`h-11 text-sm font-bold text-primary-foreground px-2 ${d === today ? 'bg-accent' : 'bg-gradient-to-b from-primary to-primary/85'} ${d === DAYS[DAYS.length - 1] ? 'rounded-tl-2xl' : ''}`}
              >
                {DAY_NAMES[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map((p, rowIdx) => (
            <tr key={p}>
              <th className="sticky right-0 z-10 bg-card border-b border-l border-border/60 p-1">
                <div className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-sm font-black ${p === currentPeriod ? 'bg-primary text-primary-foreground shadow-md' : 'text-primary'}`}>
                  {p}
                </div>
              </th>
              {DAYS.map(d => {
                const dayHasPeriod = periodsForDay(d).includes(p);
                if (!dayHasPeriod) {
                  return <td key={d} className="h-14 min-w-[92px] border-b border-l border-border/50 bg-muted/60" />;
                }
                const cellLessons = lessonsAt(d, p);
                const isTodayCol = d === today;
                const isLiveNow = isTodayCol && p === currentPeriod && cellLessons.length > 0;
                return (
                  <td
                    key={d}
                    onClick={() => onCellClick(d, p, cellLessons[0] || null)}
                    className={`h-14 min-w-[92px] border-b border-l border-border/50 p-1 cursor-pointer transition-colors align-middle
                      ${isTodayCol ? 'bg-primary/5 border-l-primary/40' : rowIdx % 2 === 1 ? 'bg-muted/30' : 'bg-card/60'}
                      ${isTodayCol && p === currentPeriod ? 'bg-primary/15 shadow-inner' : ''}
                      ${isLiveNow ? 'relative ring-2 ring-inset ring-primary rounded-lg' : ''}
                      hover:bg-primary/10`}
                  >
                    {cellLessons.length > 0 ? (
                      <div className="text-center space-y-0.5">
                        {isLiveNow && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[9px] font-black px-1.5 py-px leading-tight">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
                            כעת
                          </span>
                        )}
                        <p className="text-xs font-bold text-primary truncate leading-tight">
                          {[...new Set(cellLessons.map(l => l.subject || 'חינוך גופני'))].join(', ')}
                        </p>
                        {(() => {
                          const names = cellLessons
                            .map(l => classById[l.classId]?.name || l.className)
                            .filter(Boolean)
                            .join(', ');
                          return names ? (
                            <p className="text-[10px] text-primary/70 truncate leading-tight">{names}</p>
                          ) : null;
                        })()}
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