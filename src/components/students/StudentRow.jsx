import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ShieldOff, HeartPulse } from 'lucide-react';
import { formatStudentName } from '@/lib/studentName';

export default function StudentRow({ student, classId, displayGrade, isLow, highlighted }) {
  return (
    <Link
      id={`student-${student.id}`}
      to={`/class/${classId}/student/${student.id}`}
      dir="rtl"
      className={`flex items-center gap-2.5 px-3.5 py-3 transition-colors hover:bg-primary/5 active:bg-primary/10 ${
        highlighted ? 'bg-primary/10 ring-2 ring-primary ring-inset rounded-xl' : ''
      }`}
    >
      <span className="font-semibold text-sm text-foreground truncate">{formatStudentName(student)}</span>

      {student.peExempt && (
        <Badge className="shrink-0 text-[10px] px-1.5 py-0 h-5 bg-destructive text-destructive-foreground hover:bg-destructive">
          <ShieldOff className="w-2.5 h-2.5 ml-0.5" />פטור רפואי
        </Badge>
      )}
      {!student.peExempt && student.medicalLimitations && (
        <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 h-5 border-warning/60 text-warning bg-warning/10">
          <HeartPulse className="w-2.5 h-2.5 ml-0.5" />מגבלה
        </Badge>
      )}

      <span className="flex-1" />

      {!student.peExempt && displayGrade !== null && (
        <span className={`shrink-0 text-sm font-bold tabular-nums ${isLow ? 'text-destructive' : 'text-primary'}`}>
          {displayGrade}
        </span>
      )}

      <ChevronLeft className="w-4 h-4 shrink-0 text-muted-foreground/60" />
    </Link>
  );
}