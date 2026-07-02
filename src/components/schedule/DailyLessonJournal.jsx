import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronDown, Edit2, Timer, Activity, ChevronLeft, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PERIODS, formatPeriodRange, getCurrentPeriod } from '@/lib/periodTimes';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function DailyLessonJournal({ dateIso, onDateChange, scheduleLessons, classById, lessonTopics, onAssign }) {
  const [expanded, setExpanded] = useState(null);
  const dayIdx = new Date(dateIso + 'T00:00:00').getDay();
  const todayIso = new Date().toISOString().slice(0, 10);
  const currentPeriod = dateIso === todayIso ? getCurrentPeriod() : null;

  const dayLessons = (scheduleLessons || []).filter(l => l.dayOfWeek === dayIdx);
  const lessonAt = (p) => dayLessons.find(l => Number(l.period) === Number(p)) || null;

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-muted-foreground shrink-0">תאריך:</span>
        <Input type="date" value={dateIso} onChange={e => onDateChange(e.target.value)} className="h-11 text-sm font-bold text-center max-w-[200px]" />
        <span className="text-sm text-muted-foreground">יום {DAY_NAMES[dayIdx]}</span>
      </div>

      {dayLessons.length === 0 && (
        <p className="text-center text-sm font-semibold text-muted-foreground py-2">אין שיעורים מתוזמנים ביום זה</p>
      )}

      <div className="space-y-2">
        {PERIODS.map(p => {
          const lesson = lessonAt(p);
          const cls = lesson ? classById[lesson.classId] : null;
          const topic = lesson
            ? (lessonTopics || []).find(t => t.classId === lesson.classId && t.date === dateIso && Number(t.period) === p)
            : null;
          const isCurrent = p === currentPeriod;
          const isOpen = expanded === p;

          return (
            <div key={p} className={`rounded-2xl border transition-shadow ${isCurrent ? 'card-3d border-primary/40 shadow-md' : 'bg-card/70 border-border/60'}`}>
              <button type="button" onClick={() => setExpanded(isOpen ? null : p)} className="w-full flex items-center gap-3 p-3 text-right">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${isCurrent ? 'bg-primary text-primary-foreground shadow' : 'bg-muted text-muted-foreground'}`}>
                  {p}
                </span>
                <Calendar className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                <span className={`text-sm truncate ${lesson ? 'font-black text-primary' : 'font-semibold text-muted-foreground'}`}>
                  {lesson ? (cls?.name || lesson.className) : 'פנוי'}
                </span>
                <span className="flex-1" />
                <span className={`font-mono text-sm font-bold tracking-wide shrink-0 ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`} dir="ltr">
                  {formatPeriodRange(p)}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
                  {lesson ? (
                    <>
                      <p className="text-xs text-muted-foreground">{topic?.topic || 'טרם הוגדר נושא לשיעור'}</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        <Link to={`/lesson-edit?classId=${lesson.classId}&period=${p}&date=${dateIso}`} className="h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg bg-secondary text-secondary-foreground text-[10px] font-semibold hover:bg-secondary/70">
                          <Edit2 className="w-3.5 h-3.5" />
                          עריכה
                        </Link>
                        <Link to={`/stopwatch?classId=${lesson.classId}&period=${p}&date=${dateIso}`} className="h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg bg-secondary text-secondary-foreground text-[10px] font-semibold hover:bg-secondary/70">
                          <Timer className="w-3.5 h-3.5" />
                          סטופר
                        </Link>
                        <Link to={`/live-run?classId=${lesson.classId}&period=${p}&date=${dateIso}`} className="h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg bg-secondary text-secondary-foreground text-[10px] font-semibold hover:bg-secondary/70">
                          <Activity className="w-3.5 h-3.5" />
                          ריצה חיה
                        </Link>
                        <Link to={`/lesson-manage?classId=${lesson.classId}&period=${p}&date=${dateIso}`} className="h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold hover:bg-primary/20">
                          <ChevronLeft className="w-3.5 h-3.5" />
                          ניהול שיעור
                        </Link>
                      </div>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => onAssign(dayIdx, p)} className="w-full h-10 text-xs gap-1.5 rounded-xl">
                      <Plus className="w-3.5 h-3.5" />
                      שבץ שיעור לשעה זו
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}