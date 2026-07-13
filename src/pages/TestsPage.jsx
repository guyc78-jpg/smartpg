import { useParams } from 'react-router-dom';
import { useApp } from '@/store/AppProvider';
import { convertRawToGradeDetailed, isTestEligibleForClass } from '@/lib/gradeCalc';
import Layout from '@/components/app/Layout';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState } from 'react';
import { SEMESTER_LABELS, TEST_STATUS_LABELS } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { formatStudentName } from '@/lib/studentName';

const resultStatuses = ['completed', 'not_participated', 'not_completed', 'exempt'];

export default function TestsPage() {
  const { classId } = useParams();
  const { data, setTestResult, setClassTestStatus } = useApp();
  const [semester, setSemester] = useState('A');
  const [selectedTestIdx, setSelectedTestIdx] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const [draftScores, setDraftScores] = useState({});

  const cls = data.classes.find(c => c.id === classId);
  const students = useMemo(
    () => data.students.filter(s => s.classId === classId).sort((a, b) => formatStudentName(a).localeCompare(formatStudentName(b), 'he')),
    [data.students, classId]
  );

  const classTests = useMemo(() => {
    if (!cls) return [];
    return data.tests
      .filter(t => isTestEligibleForClass(t, cls, semester));
  }, [data.tests, cls, semester]);

  if (!cls) return <Layout title="כיתה לא נמצאה" backTo="/"><p className="text-center text-muted-foreground py-16">הכיתה לא נמצאה</p></Layout>;

  const currentIndex = classTests[selectedTestIdx] ? selectedTestIdx : 0;
  const currentTest = classTests[currentIndex] ?? null;

  const getTestProgress = (testId) =>
    students.filter(s => {
      if (s.peExempt) return true;
      const result = data.results.find(r => r.studentId === s.id && r.testId === testId && r.semester === semester);
      return result && result.status !== 'pending';
    }).length;

  const filledCount = currentTest ? getTestProgress(currentTest.id) : 0;

  const updateConductedStatus = async (studentId, testId, nextStatus) => {
    const relevant = students.filter(student => !student.peExempt);
    const filled = relevant.filter(student => {
      if (student.id === studentId) return nextStatus !== 'pending';
      const result = data.results.find(r => r.studentId === student.id && r.testId === testId && r.semester === semester);
      return Boolean(result && result.status !== 'pending');
    }).length;
    const status = filled === 0 ? 'not_conducted' : filled === relevant.length ? 'conducted' : 'partial';
    await setClassTestStatus(classId, testId, semester, status);
  };

  const handleRawScore = async (studentId, testId, value) => {
    if (value === '') {
      await setTestResult(studentId, testId, semester, null, 'pending');
      await updateConductedStatus(studentId, testId, 'pending');
      return;
    }
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) return;
    await setTestResult(studentId, testId, semester, numericValue, 'completed');
    await updateConductedStatus(studentId, testId, 'completed');
  };

  const handleStatus = async (studentId, testId, status, rawScore) => {
    if (status === 'completed' && (rawScore === null || rawScore === undefined)) return;
    await setTestResult(studentId, testId, semester, status === 'completed' ? rawScore : null, status);
    await updateConductedStatus(studentId, testId, status);
  };

  return (
    <Layout title={`מבדקים — ${cls.name}`} backTo={`/class/${classId}`}>
      <div className="max-w-3xl mx-auto space-y-3 p-4" dir="rtl">
        <div className="flex gap-2">
          {['A', 'B'].map(s => (
            <button key={s} type="button" onClick={() => { setSemester(s); setSelectedTestIdx(0); }} className={`flex-1 h-10 text-sm font-semibold rounded-full liquid-chip ${semester === s ? 'liquid-chip-active' : ''}`}>
              {SEMESTER_LABELS[s]}
            </button>
          ))}
        </div>

        {classTests.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">אין מבדקים מוגדרים לכיתה, מגדר ומחצית אלו</p>
        ) : (
          <>
            <div className="relative">
              <button onClick={() => setListOpen(o => !o)} className="w-full flex items-center justify-between btn-3d bg-card rounded-xl px-4 py-2 active:scale-[0.98] transition-all">
                <div className="text-right">
                  <div className="font-bold text-sm">{currentTest?.name}</div>
                  <div className="text-[11px] text-muted-foreground">{currentTest?.unit || 'תוצאה'} • {currentIndex + 1} / {classTests.length}</div>
                </div>
                {listOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {listOpen && (
                <div className="absolute z-30 top-full mt-1 inset-x-0 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
                  <div className="max-h-56 overflow-y-auto py-1">
                    {classTests.map((test, idx) => (
                      <button key={test.id} onClick={() => { setSelectedTestIdx(idx); setListOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2 text-right transition-colors ${idx === currentIndex ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/50'}`}>
                        <span className="text-sm truncate">{test.name}</span>
                        <span className="text-[11px] text-muted-foreground shrink-0 mr-2">{getTestProgress(test.id)}/{students.length}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!currentTest?.conversionTable?.length && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>אין טבלת המרה מתאימה למבדק זה. ניתן לשמור תוצאות, אך הציון דורש הגדרת טבלת המרה.</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>{filledCount} / {students.length} תלמידים הוזנו</span>
              {filledCount === students.length && (
                <span className="flex items-center gap-1 text-primary font-medium"><Check className="h-3.5 w-3.5" /> הושלם</span>
              )}
            </div>

            <div className="space-y-2">
              {students.map(student => {
                const result = data.results.find(r => r.studentId === student.id && r.testId === currentTest?.id && r.semester === semester);
                const rawScore = result?.rawScore ?? null;
                const status = student.peExempt ? 'exempt' : (result?.status || 'pending');
                const detailedGrade = status === 'completed' && rawScore !== null ? convertRawToGradeDetailed(rawScore, currentTest?.conversionTable) : null;
                const finalGrade = status === 'completed' && detailedGrade?.grade !== null && detailedGrade?.grade !== undefined
                  ? Math.max(detailedGrade.grade, data.settings.minCompletedGrade ?? 56)
                  : ['not_completed', 'not_participated'].includes(status)
                    ? (data.settings.penaltyScore ?? 15)
                    : null;
                const needsTable = status === 'completed' && rawScore !== null && detailedGrade?.reason === 'missing_table';
                const redBelow = data.settings.gradeColorThresholds?.redBelow ?? 55;
                const isEmpty = status === 'pending';

                return (
                  <div key={student.id} className={`card-3d rounded-xl px-3 py-2.5 transition-all ${student.peExempt ? 'opacity-60' : isEmpty ? 'bg-muted/30' : ''}`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-bold text-[15px] truncate ${isEmpty ? 'text-foreground/80' : ''}`}>{formatStudentName(student)}</span>
                        {finalGrade !== null ? (
                          <div className={`rounded-lg px-2.5 py-0.5 min-w-[44px] text-center ${finalGrade < redBelow ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                            <span className={`text-sm font-bold ${finalGrade < redBelow ? 'text-destructive' : 'text-primary'}`}>{finalGrade}</span>
                          </div>
                        ) : status === 'exempt' ? (
                          <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">פטור/ה</Badge>
                        ) : needsTable ? (
                          <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-200">דורש טבלה</Badge>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center">
                        <div className="flex gap-1 overflow-x-auto pb-1">
                          {resultStatuses.map(option => (
                            <button
                              key={option}
                              type="button"
                              disabled={(student.peExempt && option !== 'exempt') || (option === 'completed' && rawScore === null)}
                              onClick={() => handleStatus(student.id, currentTest.id, option, rawScore)}
                              className={`h-7 px-2.5 text-[10px] font-medium rounded-full shrink-0 liquid-chip ${status === option ? 'liquid-chip-active' : ''}`}
                            >
                              {TEST_STATUS_LABELS[option]}
                            </button>
                          ))}
                        </div>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          value={draftScores[`${student.id}:${currentTest.id}:${semester}`] ?? rawScore ?? ''}
                          disabled={student.peExempt || ['not_completed', 'not_participated', 'exempt'].includes(status)}
                          onChange={e => setDraftScores(scores => ({ ...scores, [`${student.id}:${currentTest.id}:${semester}`]: e.target.value }))}
                          onBlur={async e => {
                            const key = `${student.id}:${currentTest.id}:${semester}`;
                            await handleRawScore(student.id, currentTest.id, e.target.value);
                            setDraftScores(scores => { const next = { ...scores }; delete next[key]; return next; });
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                          className="w-full sm:w-24 h-8 text-center text-sm"
                          placeholder={currentTest?.unit || 'תוצאה'}
                        />
                      </div>

                      {needsTable && <p className="text-[11px] text-amber-700 dark:text-amber-200">התוצאה נשמרה, אך הציון דורש הגדרת טבלת המרה.</p>}
                      {detailedGrade?.matchType === 'nearest' && <p className="text-[11px] text-muted-foreground">הציון חושב לפי הערך הקרוב ביותר בטבלה.</p>}
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
