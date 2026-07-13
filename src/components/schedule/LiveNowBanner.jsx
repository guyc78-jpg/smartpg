import { useEffect, useState } from 'react';
import { Radio, Clock } from 'lucide-react';
import { findCurrentAndNextLesson, formatPeriodRange, formatPeriodStart } from '@/lib/periodTimes';

export default function LiveNowBanner({ scheduleLessons, classById }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const day = new Date().getDay();
  const todayLessons = (scheduleLessons || []).filter(l => l.dayOfWeek === day);
  const { current, next } = findCurrentAndNextLesson(todayLessons);

  const nameOf = (lesson) => classById?.[lesson.classId]?.name || lesson.className || lesson.subject || 'כיתה';
  const lessonsInPeriod = lesson => lesson
    ? todayLessons.filter(item => Number(item.period) === Number(lesson.period))
    : [];
  const namesInPeriod = lesson => [...new Set(lessonsInPeriod(lesson).map(nameOf).filter(Boolean))];

  if (current) {
    const currentNames = namesInPeriod(current);
    return (
      <div dir="rtl" className="flex items-center gap-3 rounded-2xl bg-primary text-primary-foreground px-4 py-3 shadow-md">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground/60" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-foreground" />
        </span>
        <div className="min-w-0 text-right">
          <p className="text-sm font-black leading-snug" title={currentNames.join(', ')}>
            כעת: {currentNames.join(', ')} · שעה {current.period}
          </p>
          <p className="text-xs opacity-85">{formatPeriodRange(current.period, day)}</p>
        </div>
        <Radio className="w-5 h-5 mr-auto opacity-70" />
      </div>
    );
  }

  if (next) {
    const nextNames = namesInPeriod(next);
    return (
      <div dir="rtl" className="flex items-center gap-3 rounded-2xl bg-muted/70 text-foreground px-4 py-3 border border-border/60">
        <Clock className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm font-semibold text-right leading-snug" title={nextNames.join(', ')}>
          אין שיעור כעת · הבא: {nextNames.join(', ')} בשעה {next.period} ({formatPeriodStart(next.period, day)})
        </p>
      </div>
    );
  }

  return null;
}
