import { useEffect, useMemo, useState } from 'react';
import { Check, Play, Timer, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPeClassIdsForDate, getPeriodsForClassAndDate } from '@/lib/peLessons';
import { displayRunStudentName } from './runUtils';

function Field({ label, children }) {
  return <div className="space-y-1.5"><label className="text-sm font-bold block text-right">{label}</label>{children}</div>;
}

export default function RunSetup({ data, initial, onStart }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(initial?.date || today);
  const peClassIds = useMemo(() => getPeClassIdsForDate(data.scheduleLessons, date), [data.scheduleLessons, date]);
  const scheduledClasses = useMemo(() => data.classes.filter(c => peClassIds.includes(c.id)), [data.classes, peClassIds]);
  const allActiveClasses = useMemo(() => data.classes.filter(c => (c.status || 'active') === 'active'), [data.classes]);
  const peClasses = scheduledClasses.length > 0 ? scheduledClasses : allActiveClasses;
  const [classId, setClassId] = useState(initial?.classId || '');
  const scheduledPeriods = useMemo(() => getPeriodsForClassAndDate(data.scheduleLessons, date, classId), [data.scheduleLessons, date, classId]);
  const periods = scheduledPeriods.length > 0 ? scheduledPeriods : [1, 2, 3, 4, 5, 6, 7, 8];
  const [period, setPeriod] = useState(initial?.period ? Number(initial.period) : '');

  const [testId, setTestId] = useState('none');
  const [semester, setSemester] = useState('A');
  const [distance, setDistance] = useState(1000);
  const [trackLength, setTrackLength] = useState(() => Number(localStorage.getItem('pe_track_length')) || 250);

  useEffect(() => {
    if (!peClasses.some(c => c.id === classId)) setClassId(peClasses[0]?.id || '');
  }, [peClasses, classId]);

  useEffect(() => {
    if (!periods.includes(Number(period))) setPeriod(periods[0] || '');
  }, [periods, period]);

  const cls = data.classes.find(c => c.id === classId);
  const students = useMemo(
    () => data.students
      .filter(s => s.classId === classId)
      .sort((a, b) => displayRunStudentName(a).localeCompare(displayRunStudentName(b), 'he')),
    [data.students, classId]
  );

  const [selectedIds, setSelectedIds] = useState([]);
  useEffect(() => {
    setSelectedIds(students.map(s => s.id));
  }, [classId, students.length]);

  const allSelected = students.length > 0 && selectedIds.length === students.length;
  const toggleStudent = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(allSelected ? [] : students.map(s => s.id));

  const relevantTests = useMemo(() => {
    if (!cls) return [];
    const matches = data.tests.filter(t => t.classId === cls.id || (!t.classId && t.gradeLevel === cls.gradeLevel && (t.genderTrack || 'boys') === (cls.genderTrack || 'boys')));
    return matches.length > 0 ? matches : data.tests;
  }, [data.tests, cls]);

  useEffect(() => {
    if (testId !== 'none' && !relevantTests.some(t => t.id === testId)) setTestId('none');
  }, [relevantTests, testId]);

  const handleTestChange = (value) => {
    setTestId(value);
    const test = data.tests.find(t => t.id === value);
    if (test?.semester) setSemester(test.semester);
  };

  const totalLaps = Number(distance) > 0 && Number(trackLength) > 0
    ? Math.max(0.5, Math.round((Number(distance) / Number(trackLength)) * 2) / 2)
    : 0;

  const selectedStudents = students.filter(s => selectedIds.includes(s.id));

  const handleStart = () => {
    if (!cls || !period || selectedStudents.length === 0 || totalLaps <= 0) return;
    localStorage.setItem('pe_track_length', String(trackLength));
    const test = testId !== 'none' ? data.tests.find(t => t.id === testId) : null;
    const measurementType = { 1500: 'distance_1500', 2000: 'distance_2000', 60: 'sprint_60', 80: 'sprint_80', 100: 'sprint_100' }[Number(distance)] || 'free';
    onStart({
      classId: cls.id, date, period: Number(period), measurementType,
      measurementLabel: test ? test.name : `ריצת ${distance} מ'`,
      testId: test?.id || '', testName: test?.name || '', semester,
      distance: Number(distance), trackLength: Number(trackLength), totalLaps,
    }, selectedStudents);
  };

  return (
    <div className="max-w-[520px] mx-auto px-3 pt-3 pb-24 space-y-4" dir="rtl">
      <section className="rounded-3xl bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-1"><Timer className="w-5 h-5" /><h2 className="text-xl font-black">ריצה חיה</h2></div>
        <p className="text-sm text-primary-foreground/85">בחר כיתה, מבדק ומסלול — ומדוד סיבובים, זמנים וציונים בזמן אמת.</p>
      </section>

      <section className="rounded-2xl border bg-card p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="תאריך"><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-11 rounded-xl" /></Field>
        <Field label="כיתה">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="בחר כיתה" /></SelectTrigger>
            <SelectContent>{peClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="שיעור">
          <Select value={period ? String(period) : ''} onValueChange={v => setPeriod(Number(v))}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="בחר שיעור" /></SelectTrigger>
            <SelectContent>{periods.map(p => <SelectItem key={p} value={String(p)}>שיעור {p}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </section>
      {peClasses.length === 0 && <p className="text-xs text-muted-foreground text-center">אין כיתות פעילות להצגה.</p>}

      <section className="rounded-2xl border bg-card p-3 space-y-3">
        <Field label="מבדק (לחישוב ציון אוטומטי)">
          <Select value={testId} onValueChange={handleTestChange}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="בחר מבדק" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">ללא מבדק — מדידה בלבד</SelectItem>
              {relevantTests.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        {testId !== 'none' && (
          <Field label="מחצית">
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={semester === 'A' ? 'default' : 'outline'} onClick={() => setSemester('A')} className="h-10 rounded-xl font-bold">מחצית א'</Button>
              <Button type="button" variant={semester === 'B' ? 'default' : 'outline'} onClick={() => setSemester('B')} className="h-10 rounded-xl font-bold">מחצית ב'</Button>
            </div>
          </Field>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-3 grid grid-cols-2 gap-3">
        <Field label="מרחק ריצה (מ')"><Input type="number" min="1" value={distance} onChange={e => setDistance(e.target.value)} className="h-11 rounded-xl text-center font-bold" /></Field>
        <Field label="אורך הקפה במגרש (מ')"><Input type="number" min="1" value={trackLength} onChange={e => setTrackLength(e.target.value)} className="h-11 rounded-xl text-center font-bold" /></Field>
        <div className="col-span-2 rounded-xl bg-primary/5 p-2.5 text-center text-sm font-black text-primary">
          {totalLaps > 0 ? `${totalLaps} סיבובים לריצה` : 'הזן מרחק ואורך הקפה'}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between text-sm font-bold">
          <span className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> תלמידים משתתפים ({selectedIds.length}/{students.length})</span>
          {students.length > 0 && (
            <button type="button" onClick={toggleAll} className="text-xs font-semibold text-primary hover:underline">
              {allSelected ? 'נקה הכל' : 'בחר הכל'}
            </button>
          )}
        </div>
        <div className="rounded-2xl border bg-card overflow-hidden">
          {students.map(student => {
            const checked = selectedIds.includes(student.id);
            return (
              <button
                type="button"
                key={student.id}
                onClick={() => toggleStudent(student.id)}
                className="w-full h-11 flex items-center justify-between gap-2 px-3 border-b last:border-0 text-right hover:bg-muted/40 transition-colors"
              >
                <span className={`text-sm font-semibold truncate ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {displayRunStudentName(student)}
                </span>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${checked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 bg-transparent'}`}>
                  {checked && <Check className="w-4 h-4" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
          {!cls && <div className="py-8 text-center text-sm text-muted-foreground">בחר כיתה כדי להציג תלמידים.</div>}
          {cls && students.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">אין תלמידים בכיתה הזו.</div>}
        </div>
      </section>

      <div className="sticky bottom-16 md:bottom-4 z-20 bg-background/80 backdrop-blur pt-2">
        <Button onClick={handleStart} disabled={!cls || !period || selectedStudents.length === 0 || totalLaps <= 0} className="w-full h-16 rounded-2xl text-xl font-black btn-3d">
          <Play className="w-5 h-5" /> התחל ריצה חיה
        </Button>
      </div>
    </div>
  );
}