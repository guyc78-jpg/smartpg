import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EditDialog, { Field, fieldClass } from '@/components/app/EditDialog';
import { formatPeriodRange } from '@/lib/periodTimes';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function AssignLessonDialog({ open, onOpenChange, slot, classes, onSave, onDelete }) {
  const [classId, setClassId] = useState('');

  useEffect(() => {
    if (open) setClassId(slot?.lesson?.classId || '');
  }, [open, slot]);

  if (!slot) return null;

  return (
    <EditDialog
      open={open}
      onOpenChange={onOpenChange}
      title={slot.lesson ? 'עריכת שיעור במערכת' : 'שיבוץ שיעור'}
      onSave={async () => { await onSave(classId); }}
      canSave={!!classId}
      saveLabel={slot.lesson ? 'עדכן שיעור' : 'שבץ שיעור'}
      onDelete={slot.lesson ? onDelete : undefined}
    >
      <div className="rounded-xl bg-muted/50 p-3 text-sm font-semibold flex items-center justify-between text-foreground">
        <span>יום {DAY_NAMES[slot.day]} · שעה {slot.period}</span>
        <span className="font-mono text-muted-foreground" dir="ltr">{formatPeriodRange(slot.period, slot.day)}</span>
      </div>
      <Field label="כיתה">
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger className={fieldClass}><SelectValue placeholder="בחר כיתה" /></SelectTrigger>
          <SelectContent>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
    </EditDialog>
  );
}