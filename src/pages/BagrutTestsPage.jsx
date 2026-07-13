import { useParams } from 'react-router-dom';
import { useApp } from '@/store/AppProvider';
import { convertRawToGrade } from '@/lib/gradeCalc';
import Layout from '@/components/app/Layout';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { formatStudentName } from '@/lib/studentName';
import BagrutSummary from '@/components/bagrut/BagrutSummary';
import { toast } from 'sonner';

export default function BagrutTestsPage() {
  const { classId } = useParams();
  const { data, setBagrutResult } = useApp();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const [view, setView] = useState('entry');
  const [draftScores, setDraftScores] = useState({});
  const [savingKeys, setSavingKeys] = useState({});

  const cls = data.classes.find(c => c.id === classId);
  const students = useMemo(
    () => data.students.filter(s => s.classId === classId).sort((a, b) => formatStudentName(a).localeCompare(formatStudentName(b), 'he')),
    [data.students, classId]
  );

  const components = useMemo(
    () => data.bagrutComponents
      .filter(c => c.genderTrack === (cls?.genderTrack || 'boys'))
      .filter(c => !c.classId || c.classId === classId)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    [data.bagrutComponents, cls?.genderTrack, classId]
  );

  const handleRawScore = async (studentId, compId, rawVal) => {
    const comp = components.find(c => c.id === compId);
    if (!comp) return false;
    if (rawVal !== null && rawVal !== '' && (!Number.isFinite(Number(rawVal)) || Number(rawVal) < 0)) return false;
    const key = `${studentId}:${compId}`;
    if (savingKeys[key]) return false;
    setSavingKeys(current => ({ ...current, [key]: true }));
    try {
      if (rawVal === null || rawVal === '') {
        await setBagrutResult(studentId, compId, null, 'missing', '', null);
      } else {
        const grade = convertRawToGrade(rawVal, comp.conversionTable);
        await setBagrutResult(studentId, compId, grade, grade !== null ? 'entered' : 'missing', '', rawVal);
      }
      return true;
    } catch (error) {
      console.error('Failed to save bagrut result', error);
      toast.error('שמירת תוצאת הבגרות נכשלה. הערך נשאר לעריכה ואפשר לנסות שוב.');
      return false;
    } finally {
      setSavingKeys(current => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  if (!cls) return <Layout title="כיתה לא נמצאה" backTo="/"><p className="text-center text-muted-foreground py-16">הכיתה לא נמצאה</p></Layout>;
  if (components.length === 0) return <Layout title={`בגרות חנ״ג — ${cls.name}`} backTo={`/class/${classId}`}><p className="text-center text-muted-foreground py-16">לא הוגדרו רכיבי בגרות</p></Layout>;

  const redBelow = data.settings.gradeColorThresholds?.redBelow ?? 55;
  const currentComp = components[selectedIdx] ?? components[0];
  const filledCount = students.filter(s => s.peExempt || data.bagrutResults.some(r => r.studentId === s.id && r.componentId === currentComp?.id && r.status === 'entered' && r.score !== null)).length;

  return (
    <Layout title={`בגרות חנ״ג — ${cls.name}`} backTo={`/class/${classId}`}>
      <div className="max-w-3xl mx-auto space-y-3 p-4" dir="rtl">
        {/* View tabs */}
        <div className="flex justify-start gap-1.5">
          {[['entry', 'הזנת ציונים'], ['summary', 'סיכום כיתתי']].map(([key, label]) => (
            <button key={key} type="button" aria-pressed={view === key} onClick={() => setView(key)} className={`liquid-chip rounded-full px-4 py-1.5 text-xs ${view === key ? 'liquid-chip-active' : ''}`}>{label}</button>
          ))}
        </div>

        {view === 'summary' ? (
          <BagrutSummary cls={cls} students={students} components={components} bagrutResults={data.bagrutResults} redBelow={redBelow} />
        ) : (
        <>
        {/* Component selector */}
        <div className="relative">
          <button type="button" aria-expanded={listOpen} aria-controls="bagrut-component-options" onClick={() => setListOpen(o => !o)} className="w-full flex items-center justify-between btn-3d bg-card rounded-xl px-4 py-2">
            <div className="text-right">
              <div className="font-bold text-sm">{currentComp?.name}</div>
              <div className="text-[11px] text-muted-foreground">{selectedIdx + 1} / {components.length}</div>
            </div>
            {listOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {listOpen && (
            <div id="bagrut-component-options" role="group" aria-label="בחירת רכיב בגרות" className="absolute z-30 top-full mt-1 inset-x-0 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
              <div className="max-h-56 overflow-y-auto py-1">
                {components.map((comp, idx) => (
                  <button key={comp.id} type="button" aria-pressed={idx === selectedIdx} onClick={() => { setSelectedIdx(idx); setListOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2 text-right ${idx === selectedIdx ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/50'}`}>
                    <span className="text-sm">{comp.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>{filledCount} / {students.length} תלמידים הוזנו</span>
          {filledCount === students.length && <span className="flex items-center gap-1 text-primary font-medium"><Check className="h-3.5 w-3.5" /> הושלם</span>}
        </div>

        <div className="space-y-1.5">
          {students.map(student => {
            const result = data.bagrutResults.find(r => r.studentId === student.id && r.componentId === currentComp?.id);
            const rawScore = result?.rawScore ?? null;
            const grade = result?.score ?? null;
            const resultKey = `${student.id}:${currentComp.id}`;
            const isSaving = Boolean(savingKeys[resultKey]);

            return (
              <div key={student.id} className={`card-3d rounded-xl px-3 py-2.5 ${student.peExempt ? 'opacity-60' : rawScore === null ? 'bg-muted/30' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[15px] truncate">{formatStudentName(student)}</span>
                  {student.peExempt ? (
                    <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive">פטור</Badge>
                  ) : (
                    <div className="flex items-center gap-3">
                      {grade !== null && (
                        <div className={`rounded-lg px-2.5 py-0.5 min-w-[44px] text-center ${grade < redBelow ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                          <span className={`text-sm font-bold ${grade < redBelow ? 'text-destructive' : 'text-primary'}`}>{grade}</span>
                        </div>
                      )}
                      <div className="relative w-20">
                        <Input
                          id={`bagrut-score-${student.id}`}
                          aria-label={`תוצאה עבור ${formatStudentName(student)} ברכיב ${currentComp?.name || ''}`}
                          aria-busy={isSaving}
                          type="number"
                          inputMode="decimal"
                          value={draftScores[resultKey] ?? rawScore ?? ''}
                          min="0"
                          disabled={isSaving}
                          onChange={e => setDraftScores(scores => ({ ...scores, [resultKey]: e.target.value }))}
                          onBlur={async e => {
                            const saved = await handleRawScore(student.id, currentComp.id, e.target.value);
                            if (saved) setDraftScores(scores => { const next = { ...scores }; delete next[resultKey]; return next; });
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                          className="w-full h-8 text-center text-sm"
                          placeholder="—"
                        />
                        {isSaving && <Loader2 className="pointer-events-none absolute left-2 top-2 h-4 w-4 animate-spin text-primary" aria-hidden="true" />}
                      </div>
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
