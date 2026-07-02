import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, ShieldOff } from 'lucide-react';
import StudentGradeBreakdown from '@/components/grades/StudentGradeBreakdown';
import { formatStudentName } from '@/lib/studentName';

const GENDER_LABELS = { boys: 'בן', girls: 'בת', other: 'אחר' };

export default function StudentCard({ student, classId, displayGrade, annual, viewMode, progress, isLow, highlighted, onEdit, onDelete }) {
  return (
    <Card
      id={`student-${student.id}`}
      dir="rtl"
      className={`card-3d rounded-2xl p-5 space-y-4 transition-shadow ${student.peExempt ? 'opacity-75' : ''} ${highlighted ? 'ring-2 ring-primary shadow-lg' : ''}`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Grade — prominent visual focus */}
        <div className={`shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${
          student.peExempt ? 'bg-muted/60' : displayGrade === null ? 'bg-muted/60' : isLow ? 'bg-destructive/10' : 'bg-primary/10'
        }`}>
          <span className={`text-2xl font-bold leading-none ${
            student.peExempt || displayGrade === null ? 'text-muted-foreground' : isLow ? 'text-destructive' : 'text-primary'
          }`}>
            {student.peExempt ? '—' : displayGrade ?? '—'}
          </span>
          <span className="text-[9px] text-muted-foreground mt-1">ציון</span>
        </div>

        <div className="min-w-0 flex-1 text-right">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/class/${classId}/student/${student.id}`}>
              <h3 className="font-bold text-base truncate hover:text-primary transition-colors">{formatStudentName(student)}</h3>
            </Link>
            {student.peExempt && (
              <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive bg-destructive/5">
                <ShieldOff className="w-2.5 h-2.5 ml-0.5" />פטור
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5 text-xs text-muted-foreground">
            {student.gender && <span>{GENDER_LABELS[student.gender] || student.gender}</span>}
            {student.studyGroup && <span>• {student.studyGroup}</span>}
            <span>• מבדקים {progress}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="עריכת תלמיד" onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="מחיקת תלמיד" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
          </Button>
        </div>
      </div>

      <StudentGradeBreakdown annual={annual} viewMode={viewMode} />

      {(student.medicalLimitations || student.peNotes) && (
        <div className="space-y-1 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
          {student.medicalLimitations && <p><span className="font-semibold text-foreground">רפואי:</span> {student.medicalLimitations}</p>}
          {student.peNotes && <p><span className="font-semibold text-foreground">מקצועי:</span> {student.peNotes}</p>}
        </div>
      )}
    </Card>
  );
}