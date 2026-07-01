import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/store/AppProvider';
import { calculateAnnualGrade } from '@/lib/gradeCalc';
import { formatStudentName } from '@/lib/studentName';

export default function RiskAlertsCard() {
  const { data } = useApp();
  const redBelow = data.settings.gradeColorThresholds?.redBelow ?? 55;

  const atRiskStudents = useMemo(() => {
    const results = [];
    for (const cls of data.classes) {
      if (cls.status === 'archived') continue;
      const classStudents = data.students.filter(s => s.classId === cls.id);
      if (classStudents.length === 0) continue;
      const gender = cls.genderTrack || 'boys';
      let classTests = data.tests;
      if (cls.gradeLevel) classTests = classTests.filter(t => t.gradeLevel === cls.gradeLevel);
      classTests = classTests.filter(t => (t.genderTrack || 'boys') === gender);
      const ctsA = data.classTestStatuses.filter(s => s.classId === cls.id && s.semester === 'A' && s.status === 'conducted').map(s => s.testId);
      const ctsB = data.classTestStatuses.filter(s => s.classId === cls.id && s.semester === 'B' && s.status === 'conducted').map(s => s.testId);

      for (const student of classStudents) {
        if (student.peExempt) continue;
        const annual = calculateAnnualGrade(student.id, classTests, data.results, data.behaviorGrades, data.settings, ctsA, ctsB, false);
        const missingCount = (annual.semA?.missingTests?.length || 0) + (annual.semB?.missingTests?.length || 0);
        if ((annual.annualGrade !== null && annual.annualGrade < redBelow) || missingCount > 0) {
          results.push({ student, cls, grade: annual.annualGrade, missingCount });
        }
      }
    }
    return results.sort((a, b) => (a.grade ?? 0) - (b.grade ?? 0)).slice(0, 8);
  }, [data, redBelow]);

  if (atRiskStudents.length === 0) return null;

  return (
    <Card className="card-3d rounded-2xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <span className="font-bold text-sm">תלמידים במעקב</span>
        <Badge variant="secondary" className="text-[10px]">{atRiskStudents.length}</Badge>
      </div>
      <div className="space-y-1">
        {atRiskStudents.map(({ student, cls, grade, missingCount }) => (
          <Link
            key={student.id}
            to={`/class/${cls.id}/student/${student.id}`}
            className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-2 py-1.5 text-xs hover:bg-muted/50 transition-colors"
          >
            <div className="min-w-0">
              <div className="font-medium truncate">{formatStudentName(student)}</div>
              <div className="text-muted-foreground truncate">{cls.name}</div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {missingCount > 0 && (
                <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700 dark:text-amber-200">{missingCount} חסרים</Badge>
              )}
              {grade !== null && (
                <span className={`font-bold ${grade < redBelow ? 'text-destructive' : 'text-primary'}`}>{grade}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}