import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, ClipboardList, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/store/AppProvider';
import { calculateAnnualGrade, isTestEligibleForClass } from '@/lib/gradeCalc';
import { formatStudentName } from '@/lib/studentName';

const DISPLAY_LIMIT = 5;

export default function RiskAlertsCard() {
  const { data } = useApp();

  const atRiskStudents = useMemo(() => {
    const settings = data.settings || {};
    const redBelow = settings.gradeColorThresholds?.redBelow ?? 55;
    const alerts = [];
    const tests = data.tests || [];
    const studentsByClass = new Map();
    const resultsByStudent = new Map();
    const behaviorByStudent = new Map();

    for (const student of data.students || []) {
      if (!studentsByClass.has(student.classId)) studentsByClass.set(student.classId, []);
      studentsByClass.get(student.classId).push(student);
    }
    for (const result of data.results || []) {
      if (!resultsByStudent.has(result.studentId)) resultsByStudent.set(result.studentId, []);
      resultsByStudent.get(result.studentId).push(result);
    }
    for (const behavior of data.behaviorGrades || []) {
      if (!behaviorByStudent.has(behavior.studentId)) behaviorByStudent.set(behavior.studentId, []);
      behaviorByStudent.get(behavior.studentId).push(behavior);
    }

    for (const cls of data.classes || []) {
      if ((cls.status || 'active') !== 'active') continue;
      const classStudents = studentsByClass.get(cls.id) || [];
      if (classStudents.length === 0) continue;

      const classTests = tests.filter(test => isTestEligibleForClass(test, cls));
      const eligibleA = new Set(classTests.filter(test => isTestEligibleForClass(test, cls, 'A')).map(test => test.id));
      const eligibleB = new Set(classTests.filter(test => isTestEligibleForClass(test, cls, 'B')).map(test => test.id));
      const ctsA = [];
      const ctsB = [];

      for (const status of data.classTestStatuses || []) {
        if (status.classId !== cls.id || status.status !== 'conducted') continue;
        if (status.semester === 'A' && eligibleA.has(status.testId)) ctsA.push(status.testId);
        if (status.semester === 'B' && eligibleB.has(status.testId)) ctsB.push(status.testId);
      }

      for (const student of classStudents) {
        if (student.peExempt) continue;
        const annual = calculateAnnualGrade(
          student.id,
          classTests,
          resultsByStudent.get(student.id) || [],
          behaviorByStudent.get(student.id) || [],
          settings,
          ctsA,
          ctsB,
          student.peExempt,
        );
        const missingCount = (annual.semA?.missingTests?.length || 0) + (annual.semB?.missingTests?.length || 0);
        const declineDrop = annual.semA?.semesterFinalGrade != null && annual.semB?.semesterFinalGrade != null
          ? annual.semA.semesterFinalGrade - annual.semB.semesterFinalGrade
          : 0;
        const declining = declineDrop >= 8;
        if ((annual.annualGrade !== null && annual.annualGrade < redBelow) || missingCount > 0 || declining) {
          alerts.push({ student, cls, grade: annual.annualGrade, missingCount, declining, declineDrop, redBelow });
        }
      }
    }

    return alerts.sort((a, b) => {
      const aBelow = a.grade !== null && a.grade < a.redBelow;
      const bBelow = b.grade !== null && b.grade < b.redBelow;
      if (aBelow !== bBelow) return aBelow ? -1 : 1;
      if (aBelow && bBelow && a.grade !== b.grade) return a.grade - b.grade;
      if (a.missingCount !== b.missingCount) return b.missingCount - a.missingCount;
      if (a.declineDrop !== b.declineDrop) return b.declineDrop - a.declineDrop;
      return formatStudentName(a.student).localeCompare(formatStudentName(b.student), 'he');
    });
  }, [data]);

  if (atRiskStudents.length === 0) return null;

  const visibleAlerts = atRiskStudents.slice(0, DISPLAY_LIMIT);
  const hiddenCount = atRiskStudents.length - visibleAlerts.length;
  const studentsWithMissingGrades = atRiskStudents.filter(alert => alert.missingCount > 0).length;

  return (
    <Card className="card-3d rounded-2xl overflow-hidden" dir="rtl">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 border-b border-border/40">
        <div className="min-w-0 flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-warning/10 text-warning">
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold text-sm text-foreground">תלמידים במעקב</h2>
            <p className="text-[10px] text-muted-foreground truncate">ציונים נמוכים, חוסרים או ירידה בין מחציות</p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 min-w-7 justify-center text-[10px]" aria-label={`${atRiskStudents.length} תלמידים במעקב`}>
          {atRiskStudents.length}
        </Badge>
      </div>

      <div className="divide-y divide-border/35">
        {visibleAlerts.map(({ student, cls, grade, missingCount, declining, declineDrop, redBelow }) => (
          <Link
            key={student.id}
            to={`/class/${cls.id}/student/${student.id}`}
            aria-label={`פתיחת הפרופיל של ${formatStudentName(student)} מכיתה ${cls.name}`}
            className="group flex min-h-12 items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="font-bold truncate text-foreground">{formatStudentName(student)}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">{cls.name}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {grade !== null && grade < redBelow && (
                  <Badge variant="outline" className="h-5 border-destructive/35 bg-destructive/5 px-1.5 text-[9px] text-destructive">
                    ציון {grade}
                  </Badge>
                )}
                {missingCount > 0 && (
                  <Badge variant="outline" className="h-5 border-warning/40 bg-warning/5 px-1.5 text-[9px] text-warning">
                    {missingCount} חסרים
                  </Badge>
                )}
                {declining && (
                  <Badge variant="outline" className="h-5 gap-0.5 border-destructive/30 px-1.5 text-[9px] text-destructive">
                    <TrendingDown className="w-2.5 h-2.5" aria-hidden="true" />
                    ירידה {declineDrop}
                  </Badge>
                )}
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-bold text-primary opacity-80 group-hover:opacity-100">לפרופיל</span>
            <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-primary transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <div className="flex min-h-10 items-center justify-between gap-2 border-t border-border/40 bg-muted/15 px-3 py-1.5">
        {studentsWithMissingGrades > 0 ? (
          <Link
            to="/missing-grades"
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-1 text-xs font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />
            לכל ההשלמות והחוסרים
          </Link>
        ) : <span />}
        {hiddenCount > 0 && (
          <span className="shrink-0 text-[10px] text-muted-foreground">ועוד {hiddenCount} במעקב</span>
        )}
      </div>
    </Card>
  );
}
