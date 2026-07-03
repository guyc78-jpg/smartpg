import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock, UserPlus, Users } from 'lucide-react';
import { periodsForDay, formatPeriodRange, getCurrentPeriod } from '@/lib/periodTimes';
import LessonTopicInline from '@/components/home/LessonTopicInline';
import QuickSubstituteFillDialog from '@/components/home/QuickSubstituteFillDialog';

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function initialOffset(lessons) {
  const now = new Date();
  const day = now.getDay();
  const todays = (lessons || []).filter(l => l.dayOfWeek === day);
  if (todays.length === 0) return 0;
  const last = Math.max(...todays.map(l => Number(l.period)));
  const end = formatPeriodRange(last, day).split('–')[1]?.trim();
  if (!end) return 0;
  const [h, m] = end.split(':').map(Number);
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m ? 1 : 0;
}

export default function DailyScheduleCard({ scheduleLessons, classById }) {
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(() => initialOffset(scheduleLessons));
  const [expandedPeriod, setExpandedPeriod] = useState(null);
  const [fillSlot, setFillSlot] = useState(null);

  const date = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }, [offset]);
  const day = date.getDay();
  const isToday = offset === 0;
  const currentPeriod = isToday ? getCurrentPeriod() : null;

  const dayLessons = useMemo(
    () => (scheduleLessons || []).filter(l => l.dayOfWeek === day),
    [scheduleLessons, day]
  );
  const periods = periodsForDay(day).filter(p => dayLessons.some(l => Number(l.period) === p));

  const dateLabel = date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateISO = toISODate(date);

  return (
    <div className="rounded-2xl card-3d overflow-hidden" dir="rtl">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-foreground">
          <CalendarDays className="w-4 h-4 text-primary" />
          מערכת יומית
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {/* Date navigator */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setOffset(o => o - 1)}
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
              aria-label="יום קודם"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-full border border-border/60 bg-background/50 text-sm font-bold">
              <CalendarDays className="w-4 h-4 text-primary" />
              {dateLabel}
            </div>
            <button
              onClick={() => setOffset(o => o + 1)}
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
              aria-label="יום הבא"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Period rows */}
          {periods.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">אין שיעורים ביום זה</p>
          ) : (
            <div className="space-y-1.5">
              {periods.map(p => {
                const lessons = dayLessons.filter(l => Number(l.period) === p);
                const hasClass = lessons.some(l => l.classId);
                const label = [...new Set(lessons.map(l => classById[l.classId]?.name || l.subject || l.className).filter(Boolean))].join(', ');
                const isCurrent = p === currentPeriod;
                const muted = !hasClass && !isCurrent;
                const expanded = expandedPeriod === p;
                return (
                  <div
                    key={p}
                    className={`rounded-xl border transition-colors
                      ${isCurrent ? 'border-primary/60 ring-1 ring-primary/40 bg-primary/10 shadow-sm' : 'border-border/50 bg-card/60'}
                      ${muted ? 'opacity-50' : ''}`}
                  >
                    <button
                      onClick={() => setExpandedPeriod(expanded ? null : p)}
                      className="w-full flex items-center gap-2 px-2 py-2"
                    >
                      <span className={`h-7 w-7 shrink-0 rounded-lg flex items-center justify-center text-sm font-black ${isCurrent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary'}`}>
                        {p}
                      </span>
                      {hasClass ? <Users className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
                      <span className={`text-sm font-bold truncate text-right ${isCurrent ? 'text-primary' : 'text-foreground'}`}>{label}</span>
                      <span className="flex-1" />
                      <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap" dir="ltr">
                        {formatPeriodRange(p, day)}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                    {expanded && (
                      <div className="px-3 pb-2.5 pt-0.5 space-y-1 text-right">
                        {lessons.filter(l => l.classId).map(l => (
                          <LessonTopicInline key={`topic-${l.id}`} classId={l.classId} date={dateISO} period={p} />
                        ))}
                        {lessons.some(l => l.classId) && (
                          <Link
                            to={`/class/${lessons.find(l => l.classId).classId}`}
                            className="inline-block text-xs font-bold text-primary hover:underline"
                          >
                            מעבר לכיתה ←
                          </Link>
                        )}
                        {!hasClass && (
                          <button
                            onClick={() => setFillSlot({ period: p, subject: label })}
                            className="inline-flex items-center gap-1 text-xs font-bold text-warning hover:opacity-80"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            הוסף מילוי מקום
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isToday && (
            <p className="text-center text-[11px] text-muted-foreground">בסיום היום תוצג מערכת מחר</p>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-1 border-t border-border/40">
            <Link to="/schedule" className="flex items-center gap-1.5 px-2 py-2 text-sm font-bold text-foreground hover:text-primary">
              <CalendarDays className="w-4 h-4" />
              מערכת מלאה
            </Link>
            <Link to="/substitute-fills" className="flex items-center gap-1.5 px-2 py-2 text-sm font-bold text-warning hover:opacity-80">
              <UserPlus className="w-4 h-4" />
              מילויי מקום
            </Link>
          </div>
        </div>
      )}

      <QuickSubstituteFillDialog
        open={Boolean(fillSlot)}
        onOpenChange={(o) => { if (!o) setFillSlot(null); }}
        classes={Object.values(classById || {}).filter(c => (c.status || 'active') === 'active')}
        date={dateISO}
        dateLabel={dateLabel}
        day={day}
        initialPeriod={fillSlot?.period}
        defaultSubject={fillSlot?.subject}
      />
    </div>
  );
}