import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EditDialog, { Field, fieldClass, textareaClass } from '@/components/app/EditDialog';
import { GRADE_LEVELS } from '@/lib/types';

export default function AddClassDialog({ open, onOpenChange, onAdd, defaultGenderTrack = 'boys' }) {
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('ז');
  const [genderTrack, setGenderTrack] = useState(defaultGenderTrack);
  const [homeroomTeacher, setHomeroomTeacher] = useState('');
  const [notes, setNotes] = useState('');
  const [studentNames, setStudentNames] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setGradeLevel('ז');
    setGenderTrack(defaultGenderTrack);
    setHomeroomTeacher('');
    setNotes('');
    setStudentNames('');
  }, [open, defaultGenderTrack]);

  const handleSave = async () => {
    const students = studentNames.split('\n').map(s => s.trim()).filter(Boolean);
    await onAdd({ name: name.trim(), gradeLevel, genderTrack, homeroomTeacher: homeroomTeacher.trim(), notes: notes.trim(), status: 'active' }, students);
  };

  return (
    <EditDialog open={open} onOpenChange={onOpenChange} title="כיתה חדשה" onSave={handleSave} canSave={!!name.trim()} saveLabel="צור כיתה">
      <Field label="שם הכיתה">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="לדוגמה: ז׳ 1" autoFocus className={fieldClass} />
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
        <Input value={homeroomTeacher} onChange={e => setHomeroomTeacher(e.target.value)} placeholder="שם המחנך/ת" className={fieldClass} />
      </Field>

      <Field label="הערות פנימיות לחנ״ג">
        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="הערה קצרה לצוות חנ״ג" className={fieldClass} />
      </Field>

      <Field label="שמות תלמידים (אופציונלי)">
        <textarea
          value={studentNames}
          onChange={e => setStudentNames(e.target.value)}
          placeholder={"שם בכל שורה...\nישראל ישראלי\nדוד כהן"}
          className={`w-full h-24 px-3 py-2 resize-none focus:outline-none ${textareaClass}`}
          dir="rtl"
        />
        {studentNames && <p className="text-[10px] text-muted-foreground">{studentNames.split('\n').filter(s => s.trim()).length} תלמידים</p>}
      </Field>
    </EditDialog>
  );
}