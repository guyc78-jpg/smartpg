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
    <div className="overflow-x-auto no-scrollbar rounded-2xl glass-surface shadow-[0_12px_32px_-12px_rgba(10,20,45,0.25)]" dir="rtl">
      <table className="border-separate border-spacing-0 w-full min-w-[620px]">
        <thead>
          <tr>
            <th
              className="sticky right-0 z-20 w-12 h-11 p-0 text-primary rounded-tr-2xl overflow-hidden backdrop-blur-xl"
              style={{
                background: 'linear-gradient(160deg, hsl(var(--primary) / 0.22), hsl(var(--card) / 0.55))',
                boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.6), inset -1px 0 0 rgba(255,255,255,0.35), inset 0 -1px 0 hsl(var(--primary) / 0.2), 0 4px 12px -4px hsl(var(--primary) / 0.35)',
              }}
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
                className={`h-11 text-sm font-black px-2 backdrop-blur-xl ${d === today ? 'text-primary-foreground' : 'text-primary'} ${d === DAYS[DAYS.length - 1] ? 'rounded-tl-2xl' : ''}`}
                style={d === today
                  ? {
                      background: 'linear-gradient(160deg, hsl(var(--primary) / 0.92), hsl(var(--primary) / 0.75))',
                      boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.1), 0 6px 16px -6px hsl(var(--primary) / 0.6)',
                    }
                  : {
                      background: 'linear-gradient(160deg, hsl(var(--primary) / 0.38), hsl(var(--card) / 0.45))',
                      boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.5), inset 1px 0 0 rgba(255,255,255,0.2), inset 0 -1px 0 hsl(var(--primary) / 0.25)',
                    }}
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
                className="sticky right-0 z-10 border-b border-l border-border/40 p-1 backdrop-blur-xl"
                style={{
                  background: 'linear-gradient(160deg, hsl(var(--primary) / 0.30), hsl(var(--card) / 0.55))',
                  boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.3), inset 1.5px 0 0 rgba(255,255,255,0.35)',
                }}
              >
                <div className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-sm font-black ${p === currentPeriod ? 'text-primary-foreground shadow-[inset_0_1.5px_0_rgba(255,255,255,0.5),0_4px_10px_-3px_hsl(var(--primary)/0.6)] bg-gradient-to-b from-primary to-primary/80' : 'text-primary'}`}>
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
                      <div
                        className="text-center space-y-0.5 rounded-xl px-1 py-1 backdrop-blur-md"
                        style={{
                          background: 'linear-gradient(160deg, hsl(var(--primary) / 0.16), hsl(var(--card) / 0.55))',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 0 0 1px hsl(var(--primary) / 0.15), 0 4px 10px -4px hsl(var(--primary) / 0.35)',
                        }}
                      >
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