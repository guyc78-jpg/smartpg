import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EditDialog, { Field, fieldClass } from '@/components/app/EditDialog';
import { STATUS_LABELS } from './substituteUtils';

const FREE_TEXT = '__free';

export default function SubstituteFillDialog({ open, onOpenChange, classes, initial, onSave }) {
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState('');
  const [classChoice, setClassChoice] = useState(FREE_TEXT);
  const [freeName, setFreeName] = useState('');
  const [status, setStatus] = useState('not_reported');

  useEffect(() => {
    if (!open) return;
    setDate(initial?.date || new Date().toISOString().slice(0, 10));
    setPeriod(initial?.period ? String(initial.period) : '');
    setClassChoice(FREE_TEXT);
    setFreeName('');
    setStatus('not_reported');
  }, [open, initial]);

  const selectedClass = classes.find(c => c.id === classChoice);
  const className = classChoice === FREE_TEXT ? freeName.trim() : (selectedClass?.name || '');
  const valid = Boolean(date && className);

  const handleSave = async () => {
    await onSave({
      date,
      period: period ? Number(period) : null,
      classId: classChoice === FREE_TEXT ? '' : classChoice,
      className,
      status,
    });
  };

  return (
    <EditDialog open={open} onOpenChange={onOpenChange} title="הוסף מילוי מקום" onSave={handleSave} canSave={valid} saveLabel="שמור מילוי מקום">
      <Field label="תאריך">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className={fieldClass} />
      </Field>
      <Field label="שיעור">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className={fieldClass}><SelectValue placeholder="בחר שיעור (לא חובה)" /></SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(p => <SelectItem key={p} value={String(p)}>שיעור {p}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="כיתה">
        <Select value={classChoice} onValueChange={setClassChoice}>
          <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={FREE_TEXT}>אחר — הקלדה חופשית</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {classChoice === FREE_TEXT && (
          <Input value={freeName} onChange={e => setFreeName(e.target.value)} placeholder="שם הכיתה (למשל ט' 3)" className={`${fieldClass} mt-1.5`} />
        )}
      </Field>
      <Field label="סטטוס">
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <Button key={key} type="button" variant={status === key ? 'default' : 'outline'} onClick={() => setStatus(key)} className="h-10 text-xs font-bold">
              {label}
            </Button>
          ))}
        </div>
      </Field>
    </EditDialog>
  );
}