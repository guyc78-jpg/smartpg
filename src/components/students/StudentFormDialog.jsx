import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
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

const fieldClass = 'h-11 text-sm text-foreground bg-white dark:bg-card border border-border/80 rounded-xl shadow-none focus-visible:ring-2 focus-visible:ring-primary';
const labelClass = 'text-xs font-semibold text-foreground';

export default function StudentFormDialog({ open, onOpenChange, student, classes, defaultClassId, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setSaving(false);
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
  const canSave = (form.firstName.trim() || form.lastName.trim()) && form.classId;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        studyGroup: form.studyGroup.trim(),
        name: buildStudentName(form.firstName.trim(), form.lastName.trim()),
      });
      onOpenChange(false);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'השמירה נכשלה. בדוק את החיבור ונסה שוב.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!saving) onOpenChange(v); }}>
      <DialogContent className="max-w-[420px] rounded-2xl p-0 overflow-hidden bg-background border border-border" dir="rtl">
        <DialogHeader className="px-5 pt-5 pb-0 text-right">
          <DialogTitle className="text-lg font-bold text-foreground text-right">{student ? 'עריכת תלמיד' : 'תלמיד חדש'}</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-5 pt-3 space-y-4 max-h-[78vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={labelClass}>שם משפחה</Label>
              <Input value={form.lastName} onChange={e => update('lastName', e.target.value)} className={fieldClass} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>שם פרטי</Label>
              <Input value={form.firstName} onChange={e => update('firstName', e.target.value)} className={fieldClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={labelClass}>כיתה</Label>
              <Select value={form.classId} onValueChange={v => update('classId', v)}>
                <SelectTrigger className={fieldClass}><SelectValue placeholder="בחר כיתה" /></SelectTrigger>
                <SelectContent>{classes.map(cls => <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>מגדר</Label>
              <Select value={form.gender} onValueChange={v => update('gender', v)}>
                <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="boys">בן</SelectItem>
                  <SelectItem value="girls">בת</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={labelClass}>קבוצת לימוד</Label>
            <Input value={form.studyGroup} onChange={e => update('studyGroup', e.target.value)} placeholder="לדוגמה: קבוצה א׳" className={fieldClass} />
          </div>

          <label className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-white dark:bg-card p-3.5 cursor-pointer">
            <Checkbox checked={form.peExempt} onCheckedChange={v => update('peExempt', Boolean(v))} />
            <span className="text-sm font-semibold text-foreground">פטור / מגבלה רפואית פעילה</span>
          </label>

          <div className="space-y-1.5">
            <Label className={labelClass}>מגבלות / פטורים רפואיים</Label>
            <Textarea value={form.medicalLimitations} onChange={e => update('medicalLimitations', e.target.value)} className="min-h-[70px] text-sm text-foreground bg-white dark:bg-card border border-border/80 rounded-xl focus-visible:ring-2 focus-visible:ring-primary" />
          </div>

          <div className="space-y-1.5">
            <Label className={labelClass}>הערות חנ״ג / הערות מקצועיות</Label>
            <Textarea value={form.peNotes} onChange={e => update('peNotes', e.target.value)} className="min-h-[70px] text-sm text-foreground bg-white dark:bg-card border border-border/80 rounded-xl focus-visible:ring-2 focus-visible:ring-primary" />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={!canSave || saving} className="flex-1 h-11 rounded-xl font-bold text-sm">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> שומר...</> : 'שמור'}
            </Button>
            <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)} className="h-11 rounded-xl px-5 font-semibold text-foreground">ביטול</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}