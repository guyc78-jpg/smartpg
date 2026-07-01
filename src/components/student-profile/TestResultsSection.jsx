import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { convertRawToGrade } from '@/lib/gradeCalc';
import { SEMESTER_LABELS, TEST_STATUS_LABELS } from '@/lib/types';

export default function TestResultsSection({ student, tests, results }) {
  const bySemester = useMemo(() => {
    const semesters = { A: [], B: [] };
    for (const test of tests) {
      for (const sem of ['A', 'B']) {
        const result = results.find(r => r.studentId === student.id && r.testId === test.id && r.semester === sem);
        if (!result) continue;
        const grade = result.status === 'completed' && result.rawScore !== null
          ? convertRawToGrade(result.rawScore, test.conversionTable)
          : null;
        semesters[sem].push({ test, result, grade });
      }
    }
    return semesters;
  }, [student.id, tests, results]);

  return (
    <Card className="card-3d rounded-2xl p-3 space-y-3">
      <div className="font-bold text-sm">היסטוריית מבדקים</div>
      {['A', 'B'].map(sem => (
        <div key={sem} className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground">{SEMESTER_LABELS[sem]}</div>
          {bySemester[sem].length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-1">אין תוצאות</p>
          ) : (
            bySemester[sem].map(({ test, result, grade }) => (
              <div key={`${test.id}-${result.semester}`} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-2 py-1.5 text-xs">
                <div className="min-w-0">
                  <div className="font-medium truncate">{test.name}</div>
                  <div className="text-muted-foreground">{TEST_STATUS_LABELS[result.status] || result.status}</div>
                </div>
                <div className="shrink-0 text-left">
                  {result.rawScore !== null && <div className="text-muted-foreground">{result.rawScore} {test.unit}</div>}
                  {grade !== null && <div className="font-bold text-primary">{grade}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      ))}
    </Card>
  );
}