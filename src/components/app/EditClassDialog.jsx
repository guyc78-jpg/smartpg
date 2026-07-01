import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
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
    if (!name.trim() || !cls) return;
    await onSave(cls.id, { name: name.trim(), gradeLevel, genderTrack, homeroomTeacher: homeroomTeacher.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[390px] rounded-2xl shadow-lg p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-base font-bold">עריכת כיתה</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-5 space-y-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">שם הכיתה</Label>
            <Input value={name} onChange={e => setName(e.target.value)} autoFocus className="h-10 text-sm" />
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
            <Input value={homeroomTeacher} onChange={e => setHomeroomTeacher(e.target.value)} className="h-10 text-sm" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={!name.trim()} className="flex-1 h-10 rounded-xl btn-3d font-semibold text-sm">
              <Save className="w-4 h-4 ml-1" /> שמור
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 rounded-xl btn-3d font-semibold text-sm px-5">ביטול</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}