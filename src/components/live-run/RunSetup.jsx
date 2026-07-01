import { useEffect, useMemo, useState } from 'react';
import { Play, Timer, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPeClassIdsForDate, getPeriodsForClassAndDate } from '@/lib/peLessons';
import { MEASUREMENT_TYPES } from '@/lib/runMeasurementTypes';
import { compareStudentsByFirstName, displayRunStudentName } from './runUtils';

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
  const [measurementType, setMeasurementType] = useState('distance_1500');

  useEffect(() => {
    if (!peClasses.some(c => c.id === classId)) setClassId(peClasses[0]?.id || '');
  }, [peClasses, classId]);

  useEffect(() => {
    if (!periods.includes(Number(period))) setPeriod(periods[0] || '');
  }, [periods, period]);

  const cls = data.classes.find(c => c.id === classId);
  const students = useMemo(() => data.students.filter(s => s.classId === classId).sort(compareStudentsByFirstName), [data.students, classId]);

  const handleStart = () => {
    if (!cls || !period || students.length === 0) return;
    const type = MEASUREMENT_TYPES.find(t => t.value === measurementType);
    onStart({ classId: cls.id, date, period: Number(period), measurementType, measurementLabel: type?.label || '' }, students);
  };

  return (
    <div className="max-w-[520px] mx-auto px-3 pt-3 pb-24 space-y-4" dir="rtl">
      <section className="rounded-3xl bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-1"><Timer className="w-5 h-5" /><h2 className="text-xl font-black">ריצה חיה</h2></div>
        <p className="text-sm text-primary-foreground/85">בחר כיתה ושיעור חנ״ג, סוג מדידה, והתחל למדוד בזמן אמת.</p>
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

      <section className="space-y-1.5">
        <label className="text-sm font-bold block text-right">סוג מדידה</label>
        <div className="grid grid-cols-3 gap-2">
          {MEASUREMENT_TYPES.map(t => (
            <Button key={t.value} type="button" variant={measurementType === t.value ? 'default' : 'outline'} onClick={() => setMeasurementType(t.value)} className="h-14 rounded-xl font-black text-xs px-1 whitespace-normal">{t.label}</Button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between text-sm font-bold">
          <span className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> תלמידי הכיתה ({students.length})</span>
          {cls && <span className="text-muted-foreground font-medium">{cls.name}</span>}
        </div>
        <div className="rounded-2xl border bg-card overflow-hidden">
          {students.map(student => (
            <div key={student.id} className="h-11 flex items-center px-3 border-b last:border-0 text-sm font-semibold truncate">
              {displayRunStudentName(student)}
            </div>
          ))}
          {!cls && <div className="py-8 text-center text-sm text-muted-foreground">בחר כיתה כדי להציג תלמידים.</div>}
          {cls && students.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">אין תלמידים בכיתה הזו.</div>}
        </div>
      </section>

      <div className="sticky bottom-16 md:bottom-4 z-20 bg-background/80 backdrop-blur pt-2">
        <Button onClick={handleStart} disabled={!cls || !period || students.length === 0} className="w-full h-16 rounded-2xl text-xl font-black btn-3d">
          <Play className="w-5 h-5" /> התחל ריצה חיה
        </Button>
      </div>
    </div>
  );
}