import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { periodsForDay, formatPeriodRange } from '@/lib/periodTimes';

const NO_CLASS = '__none';
const OTHER_CLASS = '__other';

const GRADE_ORDER = ['ז', 'ח', 'ט', 'י', 'יא', 'יב'];
function gradeRank(cls) {
  const source = (cls.grade_level || cls.name || '').replace(/["'׳״]/g, '');
  // Match longest grades first so י"א/י"ב don't match as י
  for (let i = GRADE_ORDER.length - 1; i >= 0; i--) {
    if (source.startsWith(GRADE_ORDER[i])) return i;
  }
  return GRADE_ORDER.length;
}
function classNumber(cls) {
  const m = (cls.name || '').match(/\d+/);
  return m ? Number(m[0]) : 0;
}
function sortClasses(classes) {
  return [...classes].sort((a, b) =>
    gradeRank(a) - gradeRank(b) || classNumber(a) - classNumber(b) || (a.name || '').localeCompare(b.name || '', 'he')
  );
}

function FieldLabel({ children }) {
  return <p className="text-xs font-bold text-muted-foreground mb-1.5 text-right">{children}</p>;
}

function TogglePair({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-1.5" dir="rtl">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`liquid-chip h-10 rounded-xl text-xs font-bold ${value === opt.value ? 'liquid-chip-active' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function QuickSubstituteFillDialog({ open, onOpenChange, classes, date, dateLabel, day, initialPeriod, defaultSubject, onSaved }) {
  const [classId, setClassId] = useState(NO_CLASS);
  const [customClassName, setCustomClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [period, setPeriod] = useState('');
  const [reported, setReported] = useState(false);
  const [paid, setPaid] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setClassId(NO_CLASS);
    setCustomClassName('');
    setSubject(defaultSubject || '');
    setLocation('');
    setPeriod(initialPeriod ? String(initialPeriod) : '');
    setReported(false);
    setPaid(false);
    setNotes('');
    setSaving(false);
  }, [open, initialPeriod, defaultSubject]);

  const selectedClass = classes.find(c => c.id === classId);
  const isOther = classId === OTHER_CLASS;
  const finalClassName = selectedClass?.name || (isOther ? customClassName.trim() : '');
  const canSave = Boolean(finalClassName || subject.trim());

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await base44.entities.SubstituteFill.create({
        date,
        period: period ? Number(period) : null,
        class_id: selectedClass ? selectedClass.id : '',
        class_name: finalClassName || subject.trim(),
        subject: subject.trim(),
        location: location.trim(),
        status: paid ? 'paid' : reported ? 'reported' : 'not_reported',
        notes: notes.trim(),
      });
      await onSaved?.();
      toast.success('מילוי המקום נוסף');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save substitute fill', error);
      toast.error('שמירת מילוי המקום נכשלה. בדוק את החיבור ונסה שוב.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto rounded-3xl p-0" dir="rtl">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-border/40 text-right">
          <h2 className="text-base font-black text-foreground">הוספת מילוי מקום</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dateLabel}{period ? ` · שיעור ${period}` : ''}
          </p>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <FieldLabel>כיתה</FieldLabel>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="liquid-field h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CLASS}>— ללא כיתה —</SelectItem>
                <SelectItem value={OTHER_CLASS}>כיתה אחרת (הקלדה חופשית)</SelectItem>
                {sortClasses(classes).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {isOther && (
              <Input
                value={customClassName}
                onChange={e => setCustomClassName(e.target.value)}
                placeholder="שם הכיתה, למשל ז'3"
                className="liquid-field h-11 rounded-xl text-right mt-2"
                autoFocus
              />
            )}
          </div>

          <div>
            <FieldLabel>נושא שיעור</FieldLabel>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="למשל תפקיד, פרטני..." className="liquid-field h-11 rounded-xl text-right" />
          </div>

          <div>
            <FieldLabel>מיקום</FieldLabel>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="אולם, מגרש..." className="liquid-field h-11 rounded-xl text-right" />
          </div>

          <div>
            <FieldLabel>שעת מערכת</FieldLabel>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="liquid-field h-11 rounded-xl"><SelectValue placeholder="בחר שיעור (לא חובה)" /></SelectTrigger>
              <SelectContent>
                {periodsForDay(day ?? new Date(date + 'T00:00:00').getDay()).map(p => (
                  <SelectItem key={p} value={String(p)}>שיעור {p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {period && (
              <p className="text-[11px] text-muted-foreground mt-1 text-right">
                שעה: <span dir="ltr">{formatPeriodRange(Number(period), day ?? new Date(date + 'T00:00:00').getDay())}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>דיווח</FieldLabel>
              <TogglePair
                options={[{ value: true, label: 'דווח' }, { value: false, label: 'לא דווח' }]}
                value={reported}
                onChange={setReported}
              />
            </div>
            <div>
              <FieldLabel>תשלום</FieldLabel>
              <TogglePair
                options={[{ value: true, label: 'שולם' }, { value: false, label: 'לא שולם' }]}
                value={paid}
                onChange={setPaid}
              />
            </div>
          </div>

          <div>
            <FieldLabel>הערה</FieldLabel>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="הערות (אופציונלי)" className="liquid-field rounded-xl min-h-[70px] text-right" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border/40">
          <Button onClick={handleSave} disabled={!canSave || saving} className="h-11 px-8 rounded-xl font-black">
            {saving ? 'שומר...' : 'שמור'}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-11 rounded-xl font-bold text-muted-foreground">
            ביטול
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
