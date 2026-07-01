import { Badge } from '@/components/ui/badge';
import { SEMESTER_LABELS } from '@/lib/types';

function GradeValue({ value, mutedLabel = '—' }) {
  return <span className="text-sm font-bold text-primary">{value ?? mutedLabel}</span>;
}

function SummaryBox({ label, value, mutedLabel }) {
  return (
    <div className="rounded-xl bg-background/70 border border-border/60 p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <GradeValue value={value} mutedLabel={mutedLabel} />
    </div>
  );
}

function SemesterDetails({ semesterData, label }) {
  const hasMissing = semesterData.missingTests?.length > 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold">{label}</h4>
        <Badge variant="secondary" className="text-[10px]">{semesterData.conductedCount || 0} מבדקים נכללים</Badge>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <SummaryBox label="ממוצע מבדקים" value={semesterData.testsAvg} mutedLabel={hasMissing ? 'חסרים נתונים' : '—'} />
        <SummaryBox label="ציון מחצית" value={semesterData.semesterFinalGrade} mutedLabel={hasMissing ? 'חסרים נתונים' : '—'} />
        <SummaryBox label="התנהגות" value={semesterData.behaviorGrade} />
      </div>

      {hasMissing && (
        <div className="rounded-xl bg-muted/40 p-2 text-[11px] text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">מבדקים שטרם הוזן להם ציון:</p>
          <p>{semesterData.missingTests.join(', ')}</p>
        </div>
      )}
    </div>
  );
}

export default function StudentGradeBreakdown({ annual, viewMode }) {
  if (!annual) return null;

  if (viewMode === 'annual') {
    return (
      <div className="rounded-2xl bg-muted/20 border border-border/60 p-2.5 space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          <SummaryBox label="מחצית א׳" value={annual.semA?.semesterFinalGrade} />
          <SummaryBox label="מחצית ב׳" value={annual.semB?.semesterFinalGrade} />
          <SummaryBox label="ציון שנתי" value={annual.annualGrade} />
        </div>
        <SemesterDetails semesterData={annual.semA} label={SEMESTER_LABELS.A} />
        <SemesterDetails semesterData={annual.semB} label={SEMESTER_LABELS.B} />
      </div>
    );
  }

  const semesterData = viewMode === 'A' ? annual.semA : annual.semB;
  return (
    <div className="rounded-2xl bg-muted/20 border border-border/60 p-2.5">
      <SemesterDetails semesterData={semesterData} label={SEMESTER_LABELS[viewMode]} />
    </div>
  );
}