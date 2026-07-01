import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { formatPeriodStart } from '@/lib/periodTimes';

export default function TodayLessonsList({ todaysLessons, classById, lessonTopics, todayIso }) {
  if (todaysLessons.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">אין שיעורי חנ״ג היום</p>;
  }

  return (
    <div className="space-y-2">
      {[...todaysLessons].sort((a, b) => a.period - b.period).map(lesson => {
        const cls = classById[lesson.classId];
        const topic = lessonTopics.find(t => t.classId === lesson.classId && t.date === todayIso && Number(t.period) === Number(lesson.period));
        return (
          <div key={lesson.id} className="rounded-2xl bg-card shadow-sm p-3 flex items-center gap-3">
            <div className="text-center shrink-0 w-12">
              <p className="text-sm font-bold">{formatPeriodStart(lesson.period)}</p>
              <p className="text-[10px] text-muted-foreground">שיעור {lesson.period}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm break-words">{cls?.name || lesson.className}</p>
              <p className="text-xs text-muted-foreground break-words">{topic?.topic || 'טרם הוגדר נושא'}</p>
            </div>
            <Link
              to={`/schedule?classId=${lesson.classId}&period=${lesson.period}&date=${todayIso}`}
              className="shrink-0 h-8 px-3 flex items-center gap-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20"
            >
              ניהול שיעור
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}