import { useMemo, useState } from 'react';
import { useApp } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import MissingClassCard from '@/components/missing/MissingClassCard';
import { CheckCircle2 } from 'lucide-react';

function hasValidResult(results, studentId, testId, semester) {
  return results.some(r => {
    if (r.studentId !== studentId || r.testId !== testId || r.semester !== semester) return false;
    if (r.status === 'pending') return false;
    if (r.status === 'completed' && (r.rawScore === null || r.rawScore === undefined)) return false;
    return true;
  });
}

export default function MissingGradesPage() {
  const { data } = useApp();
  const [semester, setSemester] = useState(() => localStorage.getItem('defaultSemester') || 'A');

  const classCards = useMemo(() => {
    const activeClasses = data.classes.filter(c => (c.status || 'active') === 'active');
    const cards = [];
    for (const cls of activeClasses) {
      const conductedIds = data.classTestStatuses
        .filter(s => s.classId === cls.id && s.semester === semester && s.status === 'conducted')
        .map(s => s.testId);
      if (conductedIds.length === 0) continue;
      const students = data.students.filter(s => s.classId === cls.id && !s.peExempt);
      const testGroups = [];
      for (const testId of conductedIds) {
        const test = data.tests.find(t => t.id === testId);
        if (!test) continue;
        const missingStudents = students.filter(s => !hasValidResult(data.results, s.id, testId, semester));
        if (missingStudents.length > 0) testGroups.push({ test, students: missingStudents });
      }
      if (testGroups.length > 0) {
        cards.push({
          cls,
          testGroups,
          totalMissing: testGroups.reduce((sum, g) => sum + g.students.length, 0),
        });
      }
    }
    return cards.sort((a, b) => b.totalMissing - a.totalMissing);
  }, [data.classes, data.classTestStatuses, data.students, data.tests, data.results, semester]);

  const totalMissing = classCards.reduce((sum, c) => sum + c.totalMissing, 0);

  return (
    <Layout title="השלמות וחוסרים" backTo="/">
      <div className="max-w-xl mx-auto p-4 space-y-3" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-2 rounded-xl bg-muted/60 p-1 gap-1 flex-1">
            {[{ key: 'A', label: 'מחצית א׳' }, { key: 'B', label: 'מחצית ב׳' }].map(s => (
              <button
                key={s.key}
                onClick={() => setSemester(s.key)}
                className={`h-9 rounded-lg text-xs font-bold transition-all ${semester === s.key ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <span className="shrink-0 rounded-full bg-destructive/10 text-destructive px-3 py-1.5 text-xs font-black">
            {totalMissing} חוסרים
          </span>
        </div>

        {classCards.length === 0 ? (
          <div className="rounded-2xl card-3d py-12 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-primary/50" />
            <p className="text-sm font-bold text-muted-foreground">אין חוסרים — כל התוצאות במבדקים שנערכו הוזנו</p>
          </div>
        ) : (
          <div className="space-y-2">
            {classCards.map(card => (
              <MissingClassCard key={card.cls.id} cls={card.cls} testGroups={card.testGroups} totalMissing={card.totalMissing} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}