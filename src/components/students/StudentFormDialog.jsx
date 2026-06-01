import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const canSave = form.firstName.trim() || form.lastName.trim();

  const handleSave = async () => {
    if (!canSave) return;
    await onSave({ ...form, name: buildStudentName(form.firstName, form.lastName) });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-2xl p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-base font-bold">{student ? 'עריכת תלמיד' : 'תלמיד חדש'}</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-5 space-y-3 max-h-[78vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">שם משפחה</Label>
              <Input value={form.lastName} onChange={e => update('lastName', e.target.value)} className="h-10 text-sm" autoFocus />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">שם פרטי</Label>
              <Input value={form.firstName} onChange={e => update('firstName', e.target.value)} className="h-10 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">כיתה</Label>
              <Select value={form.classId} onValueChange={v => update('classId', v)}>
                <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="בחר כיתה" /></SelectTrigger>
                <SelectContent>{classes.map(cls => <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">מגדר</Label>
              <Select value={form.gender} onValueChange={v => update('gender', v)}>
                <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="boys">בן</SelectItem>
                  <SelectItem value="girls">בת</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">קבוצת לימוד</Label>
            <Input value={form.studyGroup} onChange={e => update('studyGroup', e.target.value)} placeholder="לדוגמה: קבוצה א׳" className="h-10 text-sm" />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border p-3">
            <Checkbox checked={form.peExempt} onCheckedChange={v => update('peExempt', Boolean(v))} />
            <span className="text-sm">פטור / מגבלה רפואית פעילה</span>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">מגבלות / פטורים רפואיים</Label>
            <Textarea value={form.medicalLimitations} onChange={e => update('medicalLimitations', e.target.value)} className="min-h-[70px] text-sm" />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">הערות חנ״ג / הערות מקצועיות</Label>
            <Textarea value={form.peNotes} onChange={e => update('peNotes', e.target.value)} className="min-h-[70px] text-sm" />
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={!canSave || !form.classId} className="flex-1 h-10 rounded-xl font-semibold">שמור</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 rounded-xl px-5">ביטול</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}