import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EditDialog, { Field, fieldClass, textareaClass } from '@/components/app/EditDialog';
import { buildStudentName } from '@/lib/studentName';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  gender: 'boys',
  classId: '',
  studyGroup: '',
  peExempt: false,
  medicalLimitations: '',
  peNotes: '',
};

export default function StudentFormDialog({ open, onOpenChange, student, classes, defaultClassId, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    const nameParts = (student?.name || '').trim().split(/\s+/).filter(Boolean);
    const fallbackLastName = nameParts.length > 1 ? nameParts[0] : '';
    const fallbackFirstName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : (student?.name || '');
    setForm({
      firstName: student?.firstName || fallbackFirstName,
      lastName: student?.lastName || fallbackLastName,
      gender: student?.gender || 'boys',
      classId: student?.classId || defaultClassId || '',
      studyGroup: student?.studyGroup || student?.subClassName || '',
      peExempt: student?.peExempt || false,
      medicalLimitations: student?.medicalLimitations || '',
      peNotes: student?.peNotes || '',
    });
  }, [open, student, defaultClassId]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const canSave = Boolean((form.firstName.trim() || form.lastName.trim()) && form.classId);

  const handleSave = async () => {
    await onSave({
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      studyGroup: form.studyGroup.trim(),
      name: buildStudentName(form.firstName.trim(), form.lastName.trim()),
    });
  };

  return (
    <EditDialog open={open} onOpenChange={onOpenChange} title={student ? 'עריכת תלמיד' : 'תלמיד חדש'} onSave={handleSave} canSave={canSave}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="שם משפחה">
          <Input value={form.lastName} onChange={e => update('lastName', e.target.value)} className={fieldClass} autoFocus />
        </Field>
        <Field label="שם פרטי">
          <Input value={form.firstName} onChange={e => update('firstName', e.target.value)} className={fieldClass} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="כיתה">
          <Select value={form.classId} onValueChange={v => update('classId', v)}>
            <SelectTrigger className={fieldClass}><SelectValue placeholder="בחר כיתה" /></SelectTrigger>
            <SelectContent>{classes.map(cls => <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="מגדר">
          <Select value={form.gender} onValueChange={v => update('gender', v)}>
            <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="boys">בן</SelectItem>
              <SelectItem value="girls">בת</SelectItem>
              <SelectItem value="other">אחר</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="קבוצת לימוד">
        <Input value={form.studyGroup} onChange={e => update('studyGroup', e.target.value)} placeholder="לדוגמה: קבוצה א׳" className={fieldClass} />
      </Field>

      <label className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-white dark:bg-card p-3.5 cursor-pointer">
        <Checkbox checked={form.peExempt} onCheckedChange={v => update('peExempt', Boolean(v))} />
        <span className="text-sm font-semibold text-foreground">פטור / מגבלה רפואית פעילה</span>
      </label>

      <Field label="מגבלות / פטורים רפואיים">
        <Textarea value={form.medicalLimitations} onChange={e => update('medicalLimitations', e.target.value)} className={textareaClass} />
      </Field>

      <Field label="הערות חנ״ג / הערות מקצועיות">
        <Textarea value={form.peNotes} onChange={e => update('peNotes', e.target.value)} className={textareaClass} />
      </Field>
    </EditDialog>
  );
}