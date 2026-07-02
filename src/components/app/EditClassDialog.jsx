import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EditDialog, { Field, fieldClass } from '@/components/app/EditDialog';
import { GRADE_LEVELS } from '@/lib/types';

export default function EditClassDialog({ open, onOpenChange, cls, onSave }) {
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('ז');
  const [genderTrack, setGenderTrack] = useState('boys');
  const [homeroomTeacher, setHomeroomTeacher] = useState('');

  useEffect(() => {
    if (cls) {
      setName(cls.name || '');
      setGradeLevel(cls.gradeLevel || 'ז');
      setGenderTrack(cls.genderTrack || 'boys');
      setHomeroomTeacher(cls.homeroomTeacher || '');
    }
  }, [cls]);

  const handleSave = async () => {
    await onSave(cls.id, { name: name.trim(), gradeLevel, genderTrack, homeroomTeacher: homeroomTeacher.trim() });
  };

  return (
    <EditDialog open={open} onOpenChange={onOpenChange} title="עריכת כיתה" onSave={handleSave} canSave={!!name.trim() && !!cls}>
      <Field label="שם הכיתה">
        <Input value={name} onChange={e => setName(e.target.value)} autoFocus className={fieldClass} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="שכבה">
          <Select value={gradeLevel} onValueChange={setGradeLevel}>
            <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
            <SelectContent>{GRADE_LEVELS.map(gl => <SelectItem key={gl} value={gl}>{gl}׳</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="מגדר / מסלול">
          <Select value={genderTrack} onValueChange={setGenderTrack}>
            <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="boys">בנים</SelectItem>
              <SelectItem value="girls">בנות</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="מחנך/ת">
        <Input value={homeroomTeacher} onChange={e => setHomeroomTeacher(e.target.value)} className={fieldClass} />
      </Field>
    </EditDialog>
  );
}