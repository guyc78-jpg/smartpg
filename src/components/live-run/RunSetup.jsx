import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Calendar, Check, ClipboardList, Clock, Info, Lock, Pencil, Play, Ruler, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPeClassIdsForDate, getPeriodsForClassAndDate } from '@/lib/peLessons';
import { displayRunStudentName } from './runUtils';
import { toLocalISODate } from '@/lib/dateTime';
import { isTestEligibleForClass } from '@/lib/gradeCalc';
import { inferRunDistance, isEligibleRunStudent, isLiveRunCompatibleTest } from './runSetupUtils';

function FieldCard({ label, icon: Icon, children, className = '' }) {
  return (
    <div className={`min-w-0 max-w-full box-border overflow-hidden rounded-2xl border border-border glass-surface p-2.5 text-right transition-colors ${className}`}>
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <span className="text-[11px] font-bold text-muted-foreground">{label}</span>
        <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </span>
      </div>
      {children}
    </div>
  );
}

function CardTitle({ title, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-base font-black text-right">{title}</h3>
      <span className="w-9 h-9 rounded-xl glass-surface flex items-center justify-center text-primary shrink-0">
        <Icon className="w-[18px] h-[18px]" />
      </span>
    </div>
  );
}

export default function RunSetup({ data, initial, onStart }) {
  const today = toLocalISODate();
  const [date, setDate] = useState(initial?.date || today);
  const peClassIds = useMemo(() => getPeClassIdsForDate(data.scheduleLessons, date), [data.scheduleLessons, date]);
  const allActiveClasses = useMemo(() => data.classes.filter(c => (c.status || 'active') === 'active'), [data.classes]);
  const scheduledClasses = useMemo(() => allActiveClasses.filter(c => peClassIds.includes(c.id)), [allActiveClasses, peClassIds]);
  const peClasses = scheduledClasses.length > 0 ? scheduledClasses : allActiveClasses;
  const locked = Boolean(initial?.lock && initial?.classId && allActiveClasses.some(c => c.id === initial.classId));
  const [classId, setClassId] = useState(initial?.classId || '');
  const scheduledPeriods = useMemo(() => getPeriodsForClassAndDate(data.scheduleLessons, date, classId), [data.scheduleLessons, date, classId]);
  const periods = useMemo(() => scheduledPeriods.length > 0 ? scheduledPeriods : [1, 2, 3, 4, 5, 6, 7, 8], [scheduledPeriods]);
  const [period, setPeriod] = useState(initial?.period ? Number(initial.period) : '');

  const [testId, setTestId] = useState('none');
  const [semester, setSemester] = useState('A');
  const [distance, setDistance] = useState(1000);
  const [trackLength, setTrackLength] = useState(() => Number(localStorage.getItem('pe_track_length')) || 250);

  useEffect(() => {
    if (locked) return;
    if (!peClasses.some(c => c.id === classId)) setClassId(peClasses[0]?.id || '');
  }, [peClasses, classId, locked]);

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
  const eligibleStudents = useMemo(() => students.filter(isEligibleRunStudent), [students]);
  const studentIdsKey = useMemo(() => eligibleStudents.map(student => student.id).join('|'), [eligibleStudents]);

  const [selectedIds, setSelectedIds] = useState([]);
  useEffect(() => {
    setSelectedIds(studentIdsKey ? studentIdsKey.split('|') : []);
  }, [classId, studentIdsKey]);

  const allSelected = eligibleStudents.length > 0 && selectedIds.length === eligibleStudents.length;
  const toggleStudent = (student) => {
    if (!isEligibleRunStudent(student)) return;
    setSelectedIds(prev => prev.includes(student.id) ? prev.filter(x => x !== student.id) : [...prev, student.id]);
  };
  const toggleAll = () => setSelectedIds(allSelected ? [] : eligibleStudents.map(s => s.id));

  const relevantTests = useMemo(() => {
    if (!cls) return [];
    return data.tests
      .filter(test => isLiveRunCompatibleTest(test) && isTestEligibleForClass(test, cls))
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'he', { numeric: true }));
  }, [data.tests, cls]);

  useEffect(() => {
    if (testId !== 'none' && !relevantTests.some(t => t.id === testId)) setTestId('none');
  }, [relevantTests, testId]);

  const handleTestChange = (value) => {
    setTestId(value);
    const test = data.tests.find(t => t.id === value);
    if (test?.semester) setSemester(test.semester);
    const inferredDistance = inferRunDistance(test);
    if (inferredDistance) setDistance(inferredDistance);
  };

  const totalLaps = Number(distance) > 0 && Number(trackLength) > 0
    ? Math.max(0.5, Math.round((Number(distance) / Number(trackLength)) * 2) / 2)
    : 0;

  const selectedStudents = eligibleStudents.filter(s => selectedIds.includes(s.id));
  const selectedTest = testId !== 'none' ? data.tests.find(t => t.id === testId) : null;
  const selectedTestHasConversion = !selectedTest || (Array.isArray(selectedTest.conversionTable) && selectedTest.conversionTable.length > 0);
  const canStart = Boolean(cls && period && selectedStudents.length > 0 && totalLaps > 0 && selectedTestHasConversion);

  const handleStart = () => {
    if (!canStart) return;
    localStorage.setItem('pe_track_length', String(trackLength));
    const test = selectedTest;
    const measurementType = { 1500: 'distance_1500', 2000: 'distance_2000', 60: 'sprint_60', 80: 'sprint_80', 100: 'sprint_100' }[Number(distance)] || 'free';
    onStart({
      classId: cls.id, date, period: Number(period), measurementType,
      measurementLabel: test ? test.name : `ריצת ${distance} מ'`,
      testId: test?.id || '', testName: test?.name || '', semester,
      distance: Number(distance), trackLength: Number(trackLength), totalLaps,
    }, selectedStudents);
  };

  return (
    <div className="w-full max-w-[520px] mx-auto px-3 pt-2 pb-44 space-y-2.5 overflow-x-hidden" dir="rtl">
      {/* Intro card */}
      <section className="card-3d rounded-3xl p-3.5 flex items-center justify-between gap-3 border-primary/20" style={{ background: 'hsl(var(--card))' }}>
        <div className="min-w-0 text-right">
          <h2 className="text-base font-black">ריצה חיה</h2>
          <p className="text-xs text-muted-foreground leading-snug">בחר כיתה, מבדק ומסלול — ומדוד סיבובים, זמנים וציונים בזמן אמת.</p>
        </div>
        <span className="w-10 h-10 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shrink-0 shadow-lg">
          <Zap className="w-5 h-5" />
        </span>
      </section>

      {/* Run details */}
      <section className="card-3d rounded-3xl p-3 space-y-2.5">
        <CardTitle title="פרטי ריצה" icon={ClipboardList} />
        <div className="grid grid-cols-2 gap-2">
          <FieldCard label="כיתה" icon={BookOpen}>
            {locked ? (
              <div className="h-10 rounded-xl liquid-field flex items-center justify-between px-3 text-sm font-bold" dir="rtl">
                <span className="truncate">{cls?.name || ''}</span>
                <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </div>
            ) : (
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="h-10 rounded-xl text-sm font-bold"><SelectValue placeholder="בחר כיתה" /></SelectTrigger>
                <SelectContent>{peClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </FieldCard>
          <FieldCard label="תאריך" icon={Calendar}>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              dir="rtl"
              className="h-10 w-full min-w-0 max-w-full box-border appearance-none rounded-xl text-sm font-bold text-right [&::-webkit-date-and-time-value]:text-right"
            />
          </FieldCard>
        </div>
        <FieldCard label="שיעור" icon={Clock}>
          <Select value={period ? String(period) : ''} onValueChange={v => setPeriod(Number(v))}>
            <SelectTrigger className="h-10 rounded-xl text-sm font-bold"><SelectValue placeholder="בחר שיעור" /></SelectTrigger>
            <SelectContent>{periods.map(p => <SelectItem key={p} value={String(p)}>שיעור {p}</SelectItem>)}</SelectContent>
          </Select>
        </FieldCard>
        <FieldCard label="מבדק (לחישוב ציון אוטומטי)" icon={ClipboardList}>
          <Select value={testId} onValueChange={handleTestChange}>
            <SelectTrigger className="h-10 rounded-xl text-sm font-bold"><SelectValue placeholder="בחר מבדק" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">ללא מבדק — מדידה בלבד</SelectItem>
              {relevantTests.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {relevantTests.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">לא נמצאו מבדקי ריצה המתאימים לכיתה. עדיין ניתן לבצע מדידה בלבד.</p>
          )}
          {selectedTest && selectedTestHasConversion && (
            <p className="mt-2 text-xs text-primary">הזמנים של תלמידים שיסיימו יומרו לציונים ויישמרו במבדק.</p>
          )}
          {selectedTest && !selectedTestHasConversion && (
            <p className="mt-2 text-xs text-destructive">למבדק אין טבלת המרה לציון. יש להוסיף טבלה או לבחור מדידה בלבד.</p>
          )}
        </FieldCard>
        {testId !== 'none' && (
          <FieldCard label="מחצית" icon={Check}>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" disabled={Boolean(data.tests.find(t => t.id === testId)?.semester && data.tests.find(t => t.id === testId)?.semester !== 'A')} variant={semester === 'A' ? 'default' : 'outline'} onClick={() => setSemester('A')} className="h-9 rounded-xl font-bold text-sm">מחצית א'</Button>
              <Button type="button" disabled={Boolean(data.tests.find(t => t.id === testId)?.semester && data.tests.find(t => t.id === testId)?.semester !== 'B')} variant={semester === 'B' ? 'default' : 'outline'} onClick={() => setSemester('B')} className="h-9 rounded-xl font-bold text-sm">מחצית ב'</Button>
            </div>
          </FieldCard>
        )}
        {peClasses.length === 0 && <p className="text-xs text-muted-foreground text-center">אין כיתות פעילות להצגה.</p>}
      </section>

      {/* Distances */}
      <section className="card-3d rounded-3xl p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <FieldCard label="מרחק ריצה (מ')" icon={Ruler}>
            <Input type="number" min="1" value={distance} onChange={e => setDistance(e.target.value)} className="h-10 rounded-xl text-center font-bold" />
          </FieldCard>
          <FieldCard label="אורך הקפה במגרש (מ')" icon={Pencil}>
            <Input type="number" min="1" value={trackLength} onChange={e => setTrackLength(e.target.value)} className="h-10 rounded-xl text-center font-bold" />
          </FieldCard>
        </div>
        <div className="rounded-xl bg-primary/10 border border-primary/15 px-3 py-2 flex items-center justify-center gap-1.5 text-sm font-black text-primary">
          <Info className="w-3.5 h-3.5" />
          {totalLaps > 0 ? `${totalLaps} סיבובים לריצה` : 'הזן מרחק ואורך הקפה'}
        </div>
      </section>

      {/* Students */}
      <section className="card-3d rounded-3xl p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-base font-black">תלמידים <span className="text-xs font-bold text-muted-foreground">({selectedIds.length}/{eligibleStudents.length})</span></h3>
            {eligibleStudents.length > 0 && (
              <button type="button" onClick={toggleAll} className="text-xs font-semibold text-primary hover:underline shrink-0">
                {allSelected ? 'נקה הכל' : 'בחר הכל'}
              </button>
            )}
          </div>
          <span className="w-9 h-9 rounded-xl glass-surface flex items-center justify-center text-primary shrink-0">
            <Users className="w-[18px] h-[18px]" />
          </span>
        </div>
        <div className="rounded-2xl overflow-hidden border border-border/50">
          {students.map(student => {
            const checked = selectedIds.includes(student.id);
            const eligible = isEligibleRunStudent(student);
            return (
              <button
                type="button"
                key={student.id}
                onClick={() => toggleStudent(student)}
                disabled={!eligible}
                aria-describedby={!eligible ? `run-exempt-${student.id}` : undefined}
                className={`w-full min-h-11 flex items-center justify-between gap-2 px-3 border-b border-border/40 last:border-0 text-right transition-colors ${eligible ? 'hover:bg-muted/40' : 'cursor-not-allowed bg-muted/25 opacity-65'}`}
              >
                <span className="min-w-0 text-right">
                  <span className={`block text-sm font-semibold truncate ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {displayRunStudentName(student)}
                  </span>
                  {!eligible && <span id={`run-exempt-${student.id}`} className="block text-[10px] font-semibold text-destructive">פטור רפואי · לא ניתן לבחור</span>}
                </span>
                <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${checked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 bg-transparent'}`}>
                  {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
          {!cls && <div className="py-8 text-center text-sm text-muted-foreground">בחר כיתה כדי להציג תלמידים.</div>}
          {cls && students.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">אין תלמידים בכיתה הזו.</div>}
        </div>
      </section>

      <div className="fixed inset-x-0 z-20 px-3 max-w-[520px] mx-auto" style={{ bottom: 'calc(var(--safe-area-bottom) + 5rem)' }}>
        <Button onClick={handleStart} disabled={!canStart} className="w-full h-14 rounded-2xl text-lg font-black btn-3d">
          <Play className="w-5 h-5" /> התחל ריצה חיה
        </Button>
      </div>
    </div>
  );
}
