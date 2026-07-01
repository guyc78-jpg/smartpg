import { useEffect, useMemo, useState } from 'react';
import { Play, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPeClassIdsForDate, getPeriodsForClassAndDate } from '@/lib/peLessons';

function Field({ label, children }) {
  return <div className="space-y-1.5"><label className="text-sm font-bold block text-right">{label}</label>{children}</div>;
}

export default function StopwatchSetup({ data, initial, onStart }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(initial?.date || today);
  const peClassIds = useMemo(() => getPeClassIdsForDate(data.scheduleLessons, date), [data.scheduleLessons, date]);
  const peClasses = useMemo(() => data.classes.filter(c => peClassIds.includes(c.id)), [data.classes, peClassIds]);
  const [classId, setClassId] = useState(initial?.classId || '');
  const periods = useMemo(() => getPeriodsForClassAndDate(data.scheduleLessons, date, classId), [data.scheduleLessons, date, classId]);
  const [period, setPeriod] = useState(initial?.period ? Number(initial.period) : '');
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!peClasses.some(c => c.id === classId)) setClassId(peClasses[0]?.id || '');
  }, [peClasses, classId]);

  useEffect(() => {
    if (!periods.includes(Number(period))) setPeriod(periods[0] || '');
  }, [periods, period]);

  const cls = data.classes.find(c => c.id === classId);

  const handleStart = () => {
    if (!classId || !period) return;
    onStart({ classId, date, period: Number(period), label: label.trim() });
  };

  return (
    <div className="max-w-[480px] mx-auto px-3 pt-3 pb-6 space-y-4" dir="rtl">
      <section className="rounded-3xl bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-1"><Timer className="w-5 h-5" /><h2 className="text-xl font-black">סטופר חכם</h2></div>
        <p className="text-sm text-primary-foreground/85">בחר כיתה ושיעור חנ״ג ואז מדוד זמן והקפות בשטח.</p>
      </section>

      <section className="rounded-2xl border bg-card p-3 space-y-3">
        <Field label="תאריך"><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-11 rounded-xl" /></Field>
        <Field label="כיתה">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="בחר כיתה" /></SelectTrigger>
            <SelectContent>{peClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          {peClasses.length === 0 && <p className="text-xs text-muted-foreground pt-1">אין שיעורי חנ״ג בתאריך זה.</p>}
        </Field>
        <Field label="שיעור">
          <Select value={period ? String(period) : ''} onValueChange={v => setPeriod(Number(v))}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="בחר שיעור" /></SelectTrigger>
            <SelectContent>{periods.map(p => <SelectItem key={p} value={String(p)}>שיעור {p}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="תיאור מדידה (אופציונלי)"><Input value={label} onChange={e => setLabel(e.target.value)} className="h-11 rounded-xl" placeholder="לדוגמה: חימום, משחק" /></Field>
      </section>

      <Button onClick={handleStart} disabled={!classId || !period} className="w-full h-16 rounded-2xl text-xl font-black btn-3d">
        <Play className="w-5 h-5" /> {cls ? `התחל עבור ${cls.name}` : 'התחל סטופר'}
      </Button>
    </div>
  );
}