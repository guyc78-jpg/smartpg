import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { convertRawToGrade } from '@/lib/gradeCalc';

function gradeFor(results, studentId, testId, semester, test, minGrade) {
  const r = results.find(x => x.studentId === studentId && x.testId === testId && x.semester === semester && x.status === 'completed' && x.rawScore != null);
  if (!r) return null;
  const g = convertRawToGrade(r.rawScore, test.conversionTable);
  return g === null ? null : Math.max(g, minGrade);
}

export default function ClassComparisonSection({ cls, student, classTests, conductedTestIdsA, conductedTestIdsB }) {
  const { data } = useApp();
  const minGrade = data.settings.minCompletedGrade ?? 56;

  const rows = useMemo(() => {
    const classStudents = data.students.filter(s => s.classId === cls.id && !s.peExempt);
    const out = [];
    for (const [semester, ids] of [['A', conductedTestIdsA], ['B', conductedTestIdsB]]) {
      for (const testId of ids) {
        const test = classTests.find(t => t.id === testId);
        if (!test) continue;
        const my = gradeFor(data.results, student.id, testId, semester, test, minGrade);
        if (my === null) continue;
        const grades = classStudents
          .map(s => gradeFor(data.results, s.id, testId, semester, test, minGrade))
          .filter(g => g !== null);
        if (grades.length === 0) continue;
        const avg = Math.round(grades.reduce((a, b) => a + b, 0) / grades.length);
        out.push({ key: `${testId}_${semester}`, name: test.name, semester, my, avg, delta: my - avg });
      }
    }
    return out;
  }, [data.students, data.results, cls.id, student.id, classTests, conductedTestIdsA, conductedTestIdsB, minGrade]);

  if (rows.length === 0) return null;

  return (
    <Card className="card-3d rounded-2xl p-3 space-y-2" dir="rtl">
      <div className="font-bold text-sm">השוואה לממוצע הכיתה</div>
      <div className="space-y-1">
        {rows.map(row => (
          <div key={row.key} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-2 py-1.5 text-xs">
            <div className="min-w-0 text-right">
              <div className="font-medium truncate">{row.name}</div>
              <div className="text-muted-foreground">מחצית {row.semester === 'A' ? 'א׳' : 'ב׳'}</div>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <div className="text-center">
                <div className="font-bold text-primary">{row.my}</div>
                <div className="text-[9px] text-muted-foreground">תלמיד</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-muted-foreground">{row.avg}</div>
                <div className="text-[9px] text-muted-foreground">ממוצע</div>
              </div>
              <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 font-bold min-w-[52px] justify-center ${
                row.delta > 0 ? 'bg-primary/10 text-primary' : row.delta < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
              }`}>
                {row.delta > 0 ? <TrendingUp className="w-3 h-3" /> : row.delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {row.delta > 0 ? `+${row.delta}` : row.delta}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}