import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EditDialog, { Field, fieldClass } from '@/components/app/EditDialog';
import { formatPeriodRange } from '@/lib/periodTimes';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function AssignLessonDialog({ open, onOpenChange, slot, classes, onSave, onDelete }) {
  const [classId, setClassId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const lessonOptions = slot?.lesson?.groupedLessons || (slot?.lesson ? [slot.lesson] : []);
  const selectedLesson = lessonOptions.find(lesson => lesson.id === lessonId) || lessonOptions[0] || null;

  useEffect(() => {
    if (!open) return;
    const firstLesson = slot?.lesson?.groupedLessons?.[0] || slot?.lesson || null;
    setLessonId(firstLesson?.id || '');
    setClassId(firstLesson?.classId || '');
  }, [open, slot]);

  const handleLessonChange = (value) => {
    setLessonId(value);
    const lesson = lessonOptions.find(item => item.id === value);
    setClassId(lesson?.classId || '');
  };

  if (!slot) return null;

  return (
    <EditDialog
      open={open}
      onOpenChange={onOpenChange}
      title={slot.lesson ? 'עריכת שיעור במערכת' : 'שיבוץ שיעור'}
      onSave={async () => { await onSave(classId, selectedLesson); }}
      canSave={!!classId}
      saveLabel={slot.lesson ? 'עדכן שיעור' : 'שבץ שיעור'}
      onDelete={slot.lesson ? () => onDelete(selectedLesson) : undefined}
    >
      <div className="rounded-xl bg-muted/50 p-3 text-sm font-semibold flex items-center justify-between text-foreground">
        <span>יום {DAY_NAMES[slot.day]} · שעה {slot.period}</span>
        <span className="font-mono text-muted-foreground" dir="ltr">{formatPeriodRange(slot.period, slot.day)}</span>
      </div>
      {lessonOptions.length > 1 && (
        <Field label="כיתה מתוך השיעור המשותף">
          <Select value={lessonId} onValueChange={handleLessonChange}>
            <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
            <SelectContent>
              {lessonOptions.map(lesson => {
                const name = classes.find(item => item.id === lesson.classId)?.name || lesson.className || '';
                return <SelectItem key={lesson.id} value={lesson.id}>{name}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </Field>
      )}
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
