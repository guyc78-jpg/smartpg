import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, ShieldOff, HeartPulse, MessageCircle } from 'lucide-react';
import StudentGradeBreakdown from '@/components/grades/StudentGradeBreakdown';
import { formatStudentName } from '@/lib/studentName';

const GENDER_LABELS = { boys: 'בן', girls: 'בת', other: 'אחר' };

export default function StudentCard({ student, classId, displayGrade, annual, viewMode, progress, isLow, highlighted, onEdit, onDelete, onWhatsApp }) {
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
              <Badge className="text-[10px] bg-destructive text-destructive-foreground hover:bg-destructive">
                <ShieldOff className="w-3 h-3 ml-1" />פטור רפואי
              </Badge>
            )}
            {!student.peExempt && student.medicalLimitations && (
              <Badge variant="outline" className="text-[10px] border-warning/60 text-warning bg-warning/10">
                <HeartPulse className="w-3 h-3 ml-1" />מגבלה רפואית
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
          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400" aria-label="שליחת WhatsApp למחנך/ת" title="WhatsApp למחנך/ת" onClick={onWhatsApp}>
            <MessageCircle className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="עריכת תלמיד" onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="מחיקת תלמיד" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
          </Button>
        </div>
      </div>

      <StudentGradeBreakdown annual={annual} viewMode={viewMode} />

      {student.peNotes && (
        <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground text-right">
          <span className="font-semibold text-foreground">מקצועי:</span> {student.peNotes}
        </div>
      )}
    </Card>
  );
}
