import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SEMESTER_LABELS } from '@/lib/types';
import { compareStudentsByLastName } from './runUtils';

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="text-[15px] font-bold text-foreground block text-right">{label}</label>
      {children}
    </div>
  );
}

export default function RunSetup({ data, onStart }) {
  const today = new Date().toISOString().slice(0, 10);
  const [classId, setClassId] = useState(data.classes[0]?.id || '');
  const cls = data.classes.find(c => c.id === classId);
  const classTests = useMemo(() => {
    if (!cls) return [];
    return data.tests.filter(t => (!cls.gradeLevel || t.gradeLevel === cls.gradeLevel) && (t.genderTrack || 'boys') === (cls.genderTrack || 'boys'));
  }, [data.tests, cls]);
  const [testId, setTestId] = useState('');
  const [semester, setSemester] = useState('B');
  const [lapsRequired, setLapsRequired] = useState(5);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (!testId && classTests[0]?.id) setTestId(classTests[0].id);
    if (testId && !classTests.some(t => t.id === testId)) setTestId(classTests[0]?.id || '');
  }, [classTests, testId]);

  const students = useMemo(
    () => data.students.filter(s => s.classId === classId && !s.peExempt).sort(compareStudentsByLastName),
    [data.students, classId]
  );

  const selectedSet = new Set(selected);
  const allSelected = students.length > 0 && selected.length === students.length;

  const toggleStudent = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => setSelected(allSelected ? [] : students.map(s => s.id));

  const handleStart = () => {
    const chosen = students.filter(s => selectedSet.has(s.id));
    if (!cls || !testId || chosen.length === 0) return;
    onStart({
      classId: cls.id,
      testId,
      date: today,
      routeName: cls.name,
      distance: data.tests.find(t => t.id === testId)?.name || 'ריצה',
      lapsRequired: Number(lapsRequired || 1),
      semester,
    }, chosen);
  };

  return (
    <div className="max-w-[460px] mx-auto px-5 pt-4 pb-24 space-y-6" dir="rtl">
      <Field label="כיתה">
        <Select value={classId} onValueChange={(value) => { setClassId(value); setSelected([]); }}>
          <SelectTrigger className="h-11 rounded-xl bg-background border-border text-right flex-row-reverse">
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="בחר כיתה" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-xl">
            {data.classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field label="מבדק יעד">
        <Select value={testId} onValueChange={setTestId}>
          <SelectTrigger className="h-11 rounded-xl bg-background border-border text-right flex-row-reverse">
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="בחר מבדק" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-xl max-h-80">
            {classTests.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field label="מחצית">
        <Select value={semester} onValueChange={setSemester}>
          <SelectTrigger className="h-11 rounded-xl bg-background border-border text-right flex-row-reverse">
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-xl">
            {Object.entries(SEMESTER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[15px]">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="w-3.5 h-3.5" /></span>
            מעקב סיבובים
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <span>מספר סיבובים:</span>
          <Select value={String(lapsRequired)} onValueChange={(v) => setLapsRequired(Number(v))}>
            <SelectTrigger className="w-28 h-12 rounded-xl bg-background flex-row-reverse">
              <ChevronDown className="h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,4.5,5,6,7,8,10].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {cls && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>תלמידים משתתפים ({selected.length}/{students.length})</span>
            <button onClick={toggleAll} className="text-primary">{allSelected ? 'נקה הכל' : 'בחר הכל'}</button>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {students.map(student => {
              const checked = selectedSet.has(student.id);
              return (
                <button key={student.id} onClick={() => toggleStudent(student.id)} className="w-full h-[52px] flex items-center justify-between px-4 py-3 border-b border-border last:border-0 text-right hover:bg-muted/40 transition-colors">
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${checked ? 'bg-primary border-primary text-primary-foreground' : 'border-primary'}`}>
                    {checked && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span className="font-medium">{student.name}</span>
                </button>
              );
            })}
            {students.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">אין תלמידים בכיתה הזו</div>}
          </div>
        </div>
      )}

      <div className="sticky bottom-16 md:bottom-4 z-20">
        <Button onClick={handleStart} disabled={!cls || !testId || selected.length === 0} className="w-full h-16 rounded-xl text-xl font-bold btn-3d shadow-lg">
          <Play className="w-5 h-5" /> התחל ריצה ({selected.length} תלמידים)
        </Button>
      </div>
    </div>
  );
}