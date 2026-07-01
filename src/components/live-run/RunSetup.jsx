import { useEffect, useMemo, useState } from 'react';
import { Calendar, Check, MapPin, Play, Route, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENDER_TRACK_LABELS, GRADE_LEVELS, SEMESTER_LABELS, TEST_TYPES } from '@/lib/types';
import { compareStudentsByFirstName, displayRunStudentName } from './runUtils';

function Field({ label, children }) {
  return <div className="space-y-1.5"><label className="text-sm font-bold text-foreground block text-right">{label}</label>{children}</div>;
}

const COMMON_DISTANCES = ['60', '1000', '2000'];

export default function RunSetup({ data, onStart }) {
  const today = new Date().toISOString().slice(0, 10);
  const [gradeLevel, setGradeLevel] = useState('all');
  const classesByGrade = useMemo(() => data.classes.filter(c => (c.status || 'active') === 'active' && (gradeLevel === 'all' || c.gradeLevel === gradeLevel)), [data.classes, gradeLevel]);
  const [classId, setClassId] = useState(classesByGrade[0]?.id || '');
  const cls = data.classes.find(c => c.id === classId);
  const [testId, setTestId] = useState('');
  const [date, setDate] = useState(today);
  const [semester, setSemester] = useState('A');
  const [routeName, setRouteName] = useState('מסלול בית הספר');
  const [distance, setDistance] = useState('1000');
  const [lapsRequired, setLapsRequired] = useState(1);

  useEffect(() => {
    if (!classesByGrade.some(c => c.id === classId)) setClassId(classesByGrade[0]?.id || '');
  }, [classesByGrade, classId]);

  const classTests = useMemo(() => {
    if (!cls) return [];
    return data.tests
      .filter(t => (!cls.gradeLevel || t.gradeLevel === cls.gradeLevel) && (t.genderTrack || 'boys') === (cls.genderTrack || 'boys'))
      .filter(t => ['running', 'agility', 'other'].includes(t.testType || 'other'));
  }, [data.tests, cls]);

  useEffect(() => {
    const match = classTests.find(t => (t.name || '').includes(distance));
    if (match && testId !== match.id) setTestId(match.id);
    if (!match && !classTests.some(t => t.id === testId)) setTestId(classTests[0]?.id || '');
  }, [classTests, distance, testId]);

  const students = useMemo(() => data.students.filter(s => s.classId === classId).sort(compareStudentsByFirstName), [data.students, classId]);

  const handleStart = () => {
    if (!cls || !testId || students.length === 0) return;
    const selectedTest = data.tests.find(t => t.id === testId);
    onStart({
      gradeLevel: cls.gradeLevel || gradeLevel,
      classId: cls.id,
      testId,
      testName: selectedTest?.name || 'מבדק זמן',
      date,
      semester,
      routeName,
      distance,
      lapsRequired: Number(lapsRequired || 1),
    }, students);
  };

  return (
    <div className="max-w-[520px] mx-auto px-3 pt-3 pb-24 space-y-4" dir="rtl">
      <section className="rounded-3xl bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-1"><Route className="w-5 h-5" /><h2 className="text-xl font-black">סטופר חכם לריצות</h2></div>
        <p className="text-sm text-primary-foreground/85">בחר כיתה ומבדק, ואז מדוד סיבובים וזמני סיום בזמן אמת.</p>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Field label="שכבה">
          <Select value={gradeLevel} onValueChange={setGradeLevel}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">כל השכבות</SelectItem>{GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>שכבה {g}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="כיתה">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="בחר כיתה" /></SelectTrigger>
            <SelectContent>{classesByGrade.map(c => <SelectItem key={c.id} value={c.id}>{c.name} · {GENDER_TRACK_LABELS[c.genderTrack] || ''}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {COMMON_DISTANCES.map(value => (
          <Button key={value} variant={distance === value ? 'default' : 'outline'} onClick={() => setDistance(value)} className="h-12 rounded-xl font-black">{value} מ׳</Button>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="מבדק">
          <Select value={testId} onValueChange={setTestId}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="בחר מבדק" /></SelectTrigger>
            <SelectContent className="max-h-80">{classTests.map(t => <SelectItem key={t.id} value={t.id}>{t.name} · {TEST_TYPES[t.testType] || 'מבדק'}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="תאריך"><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-11 rounded-xl" /></Field>
        <Field label="מחצית">
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(SEMESTER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="מספר סיבובים"><Input type="number" min="1" step="0.5" value={lapsRequired} onChange={e => setLapsRequired(e.target.value)} className="h-11 rounded-xl text-center" /></Field>
        <Field label="מסלול"><Input value={routeName} onChange={e => setRouteName(e.target.value)} className="h-11 rounded-xl" placeholder="שם מסלול" /></Field>
        <Field label="מרחק במטרים"><Input type="number" min="1" value={distance} onChange={e => setDistance(e.target.value)} className="h-11 rounded-xl text-center" /></Field>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between text-sm font-bold">
          <span className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> תלמידי הכיתה ({students.length})</span>
          {cls && <span className="text-muted-foreground font-medium">{cls.name}</span>}
        </div>
        <div className="rounded-2xl border bg-card overflow-hidden">
          {students.map(student => (
            <div key={student.id} className="h-11 flex items-center justify-between px-3 border-b last:border-0 text-sm">
              <Check className="w-4 h-4 text-primary" />
              <span className="font-semibold truncate">{displayRunStudentName(student)}</span>
            </div>
          ))}
          {!cls && <div className="py-8 text-center text-sm text-muted-foreground">בחר כיתה כדי להציג תלמידים.</div>}
          {cls && students.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">אין תלמידים בכיתה הזו. הוסף תלמידים בכרטיס הכיתה לפני מדידה.</div>}
          {cls && classTests.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground border-t">אין מבדקי זמן מתאימים לכיתה. הוסף מבדק ריצה במודול המבדקים.</div>}
        </div>
      </section>

      <div className="sticky bottom-16 md:bottom-4 z-20 bg-background/80 backdrop-blur pt-2">
        <Button onClick={handleStart} disabled={!cls || !testId || students.length === 0} className="w-full h-16 rounded-2xl text-xl font-black btn-3d">
          <Play className="w-5 h-5" /> התחל ריצה חיה
        </Button>
      </div>
    </div>
  );
}