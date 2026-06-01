import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { GRADE_LEVELS } from '@/lib/types';

export default function AddClassDialog({ open, onOpenChange, onAdd, defaultGenderTrack = 'boys' }) {
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('ז');
  const [genderTrack, setGenderTrack] = useState(defaultGenderTrack);
  const [homeroomTeacher, setHomeroomTeacher] = useState('');
  const [notes, setNotes] = useState('');
  const [studentNames, setStudentNames] = useState('');

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const students = studentNames.split('\n').map(s => s.trim()).filter(Boolean);
    await onAdd({ name: trimmed, gradeLevel, genderTrack, homeroomTeacher: homeroomTeacher.trim(), notes: notes.trim(), status: 'active' }, students);
    setName('');
    setGradeLevel('ז');
    setGenderTrack(defaultGenderTrack);
    setHomeroomTeacher('');
    setNotes('');
    setStudentNames('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[390px] rounded-2xl shadow-lg p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-base font-bold">כיתה חדשה</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-5 space-y-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">שם הכיתה</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="לדוגמה: ז׳ 1" autoFocus className="h-10 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">שכבה</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{GRADE_LEVELS.map(gl => <SelectItem key={gl} value={gl}>{gl}׳</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">מגדר / מסלול</Label>
              <Select value={genderTrack} onValueChange={setGenderTrack}>
                <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="boys">בנים</SelectItem>
                  <SelectItem value="girls">בנות</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">מחנך/ת</Label>
            <Input value={homeroomTeacher} onChange={e => setHomeroomTeacher(e.target.value)} placeholder="שם המחנך/ת" className="h-10 text-sm" />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">הערות פנימיות לחנ״ג</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="הערה קצרה לצוות חנ״ג" className="h-10 text-sm" />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">שמות תלמידים (אופציונלי)</Label>
            <textarea
              value={studentNames}
              onChange={e => setStudentNames(e.target.value)}
              placeholder={"שם בכל שורה...\nישראל ישראלי\nדוד כהן"}
              className="w-full h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              dir="rtl"
            />
            {studentNames && <p className="text-[10px] text-muted-foreground/60">{studentNames.split('\n').filter(s => s.trim()).length} תלמידים</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={!name.trim()} className="flex-1 h-10 rounded-xl btn-3d font-semibold text-sm">
              <Plus className="w-4 h-4 ml-1" /> צור כיתה
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 rounded-xl btn-3d font-semibold text-sm px-5">ביטול</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}