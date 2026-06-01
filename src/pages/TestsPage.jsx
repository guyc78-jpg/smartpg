import { useParams } from 'react-router-dom';
import { useApp } from '@/store/AppProvider';
import { convertRawToGrade } from '@/lib/gradeCalc';
import Layout from '@/components/app/Layout';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState } from 'react';
import { SEMESTER_LABELS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { isTimeBasedTest, isShortSprintTest, formatLongTime, formatShortTime } from '@/lib/timeFormat';

export default function TestsPage() {
  const { classId } = useParams();
  const { data, setTestResult, setClassTestStatus } = useApp();
  const [semester, setSemester] = useState('A');
  const [selectedTestIdx, setSelectedTestIdx] = useState(0);
  const [listOpen, setListOpen] = useState(false);

  const cls = data.classes.find(c => c.id === classId);
  const students = useMemo(
    () => data.students.filter(s => s.classId === classId).sort((a, b) => a.name.localeCompare(b.name, 'he')),
    [data.students, classId]
  );

  const classTests = useMemo(() => {
    if (!cls) return [];
    const g = cls.genderTrack || 'boys';
    let filtered = data.tests;
    if (cls.gradeLevel) filtered = filtered.filter(t => t.gradeLevel === cls.gradeLevel);
    return filtered.filter(t => (t.genderTrack || 'boys') === g);
  }, [data.tests, cls]);

  const conductedTestIds = useMemo(
    () => data.classTestStatuses.filter(s => s.classId === classId && s.semester === semester && s.status === 'conducted').map(s => s.testId),
    [data.classTestStatuses, classId, semester]
  );

  if (!cls) return <Layout title="כיתה לא נמצאה" backTo="/"><p className="text-center text-muted-foreground py-16">הכיתה לא נמצאה</p></Layout>;

  const currentTest = classTests[selectedTestIdx] ?? null;
  const isTime = currentTest && isTimeBasedTest(currentTest.name);

  const getTestProgress = (testId) =>
    students.filter(s => data.results.some(r => r.studentId === s.id && r.testId === testId && r.semester === semester && r.rawScore !== null)).length;

  const filledCount = currentTest ? getTestProgress(currentTest.id) : 0;

  const handleRawScore = async (studentId, testId, value) => {
    const status = value !== null ? 'completed' : 'pending';
    await setTestResult(studentId, testId, semester, value, status);
  };

  const handleToggleConduct = async (testId) => {
    const current = data.classTestStatuses.find(s => s.classId === classId && s.testId === testId && s.semester === semester);
    const statuses = ['not_conducted', 'conducted', 'not_included'];
    const currentIdx = current ? statuses.indexOf(current.status) : 0;
    const next = statuses[(currentIdx + 1) % statuses.length];
    await setClassTestStatus(classId, testId, semester, next);
  };

  return (
    <Layout title={`מבדקים — ${cls.name}`} backTo={`/class/${classId}`}>
      <div className="max-w-3xl mx-auto space-y-3 p-4" dir="rtl">
        {/* Semester toggle */}
        <div className="flex gap-2">
          {['A', 'B'].map(s => (
            <Button key={s} variant={semester === s ? 'default' : 'outline'} onClick={() => setSemester(s)} className="flex-1 h-10 text-sm font-semibold">
              {SEMESTER_LABELS[s]}
            </Button>
          ))}
        </div>

        {classTests.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">אין מבדקים מוגדרים</p>
        ) : (
          <>
            {/* Test selector */}
            <div className="relative">
              <button onClick={() => setListOpen(o => !o)} className="w-full flex items-center justify-between btn-3d bg-card rounded-xl px-4 py-2 active:scale-[0.98] transition-all">
                <div className="text-right">
                  <div className="font-bold text-sm">{currentTest?.name}</div>
                  <div className="text-[11px] text-muted-foreground">{selectedTestIdx + 1} / {classTests.length}</div>
                </div>
                {listOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {listOpen && (
                <div className="absolute z-30 top-full mt-1 inset-x-0 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
                  <div className="max-h-56 overflow-y-auto py-1">
                    {classTests.map((test, idx) => (
                      <button key={test.id} onClick={() => { setSelectedTestIdx(idx); setListOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2 text-right transition-colors ${idx === selectedTestIdx ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/50'}`}>
                        <span className="text-sm truncate">{test.name}</span>
                        <span className="text-[11px] text-muted-foreground shrink-0 mr-2">{getTestProgress(test.id)}/{students.length}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>{filledCount} / {students.length} תלמידים הוזנו</span>
              {filledCount === students.length && (
                <span className="flex items-center gap-1 text-primary font-medium"><Check className="h-3.5 w-3.5" /> הושלם</span>
              )}
            </div>

            {/* Student list */}
            <div className="space-y-1.5">
              {students.map(student => {
                const result = data.results.find(r => r.studentId === student.id && r.testId === currentTest?.id && r.semester === semester);
                const rawScore = result?.rawScore ?? null;
                const status = result?.status || 'pending';
                const grade = rawScore !== null && currentTest && status === 'completed'
                  ? convertRawToGrade(rawScore, currentTest.conversionTable) : null;
                const finalGrade = grade !== null ? Math.max(grade, data.settings.minCompletedGrade || 56) : null;
                const isEmpty = rawScore === null;

                return (
                  <div key={student.id} className={`card-3d rounded-xl px-3 py-2.5 transition-all ${student.peExempt ? 'opacity-60' : isEmpty ? 'bg-muted/30' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-bold text-[15px] truncate ${isEmpty ? 'text-foreground/80' : ''}`}>{student.name}</span>
                      {student.peExempt ? (
                        <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive">פטור</Badge>
                      ) : (
                        <div className="flex items-center gap-3">
                          {finalGrade !== null && (
                            <div className={`rounded-lg px-2.5 py-0.5 min-w-[44px] text-center ${finalGrade < 55 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                              <span className={`text-sm font-bold ${finalGrade < 55 ? 'text-destructive' : 'text-primary'}`}>{finalGrade}</span>
                            </div>
                          )}
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={rawScore ?? ''}
                            onChange={e => {
                              const val = e.target.value === '' ? null : Number(e.target.value);
                              handleRawScore(student.id, currentTest.id, val);
                            }}
                            className="w-20 h-8 text-center text-sm"
                            placeholder="—"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}