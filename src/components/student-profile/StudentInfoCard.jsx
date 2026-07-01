import { ShieldOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const GENDER_LABELS = { boys: 'בן', girls: 'בת', other: 'אחר' };

export default function StudentInfoCard({ student, cls }) {
  return (
    <Card className="card-3d rounded-2xl p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="font-bold text-base">
          {student.name || [student.lastName, student.firstName].filter(Boolean).join(' ')}
        </h2>
        {student.peExempt && (
          <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive bg-destructive/5">
            <ShieldOff className="w-2.5 h-2.5 ml-0.5" />פטור
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
        {student.gender && <span>{GENDER_LABELS[student.gender] || student.gender}</span>}
        {student.studyGroup && <span>• קבוצה: {student.studyGroup}</span>}
        <span>• {cls.name}</span>
      </div>
      {(student.medicalLimitations || student.peNotes) && (
        <div className="space-y-1 rounded-xl bg-muted/40 p-2 text-xs">
          {student.medicalLimitations && (
            <p><span className="font-semibold text-foreground">רפואי:</span> {student.medicalLimitations}</p>
          )}
          {student.peNotes && (
            <p><span className="font-semibold text-foreground">מקצועי:</span> {student.peNotes}</p>
          )}
        </div>
      )}
    </Card>
  );
}