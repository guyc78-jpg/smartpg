import { Link } from 'react-router-dom';
import { Edit2, Timer, Activity, ChevronLeft } from 'lucide-react';
import { formatPeriodStart } from '@/lib/periodTimes';

export default function DailyPeSchedule({ lessons, classById, lessonTopics, dateIso }) {
  if (!lessons || lessons.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">אין שיעורי חנ״ג היום</p>;
  }

  return (
    <div className="space-y-2">
      {[...lessons].sort((a, b) => a.period - b.period).map(lesson => {
        const cls = classById[lesson.classId];
        const topic = (lessonTopics || []).find(t => t.classId === lesson.classId && t.date === dateIso && Number(t.period) === Number(lesson.period));
        const editUrl = `/lesson-edit?classId=${lesson.classId}&period=${lesson.period}&date=${dateIso}`;
        const manageUrl = `/lesson-manage?classId=${lesson.classId}&period=${lesson.period}&date=${dateIso}`;

        return (
          <div key={lesson.id} className="rounded-2xl bg-card shadow-sm p-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-center shrink-0 w-12">
                <p className="text-sm font-bold">{formatPeriodStart(lesson.period)}</p>
                <p className="text-[10px] text-muted-foreground">שיעור {lesson.period}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm break-words">{cls?.name || lesson.className}</p>
                <p className="text-xs text-muted-foreground break-words">{topic?.topic || 'טרם הוגדר נושא'}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <Link to={editUrl} className="h-9 flex flex-col items-center justify-center gap-0.5 rounded-lg bg-secondary text-secondary-foreground text-[10px] font-semibold hover:bg-secondary/70">
                <Edit2 className="w-3.5 h-3.5" />
                עריכה
              </Link>
              <Link to={`/stopwatch?classId=${lesson.classId}&period=${lesson.period}&date=${dateIso}`} className="h-9 flex flex-col items-center justify-center gap-0.5 rounded-lg bg-secondary text-secondary-foreground text-[10px] font-semibold hover:bg-secondary/70">
                <Timer className="w-3.5 h-3.5" />
                סטופר
              </Link>
              <Link to={`/live-run?classId=${lesson.classId}&period=${lesson.period}&date=${dateIso}`} className="h-9 flex flex-col items-center justify-center gap-0.5 rounded-lg bg-secondary text-secondary-foreground text-[10px] font-semibold hover:bg-secondary/70">
                <Activity className="w-3.5 h-3.5" />
                ריצה חיה
              </Link>
              <Link to={manageUrl} className="h-9 flex flex-col items-center justify-center gap-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold hover:bg-primary/20">
                <ChevronLeft className="w-3.5 h-3.5" />
                ניהול שיעור
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}