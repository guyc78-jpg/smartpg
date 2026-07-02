import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WizardStepsEditor from '@/components/wizards/WizardStepsEditor';

const EMPTY = { title: '', description: '', role: 'all', is_enabled: true, steps: [] };

export default function WizardEditDialog({ wizard, open, onOpenChange, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(wizard ? { ...EMPTY, ...wizard } : EMPTY);
  }, [open, wizard]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        wizard_id: form.wizard_id || `wiz_${Date.now()}`,
        title: form.title.trim(),
        description: form.description || '',
        role: form.role,
        is_enabled: form.is_enabled,
        steps: form.steps,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card rounded-[28px] border-0 shadow-2xl max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-right">{wizard ? 'עריכת סיור' : 'סיור חדש'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-right">
          <div className="space-y-1.5">
            <Label>שם הסיור</Label>
            <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="לדוגמה: היכרות עם המערכת" />
          </div>
          <div className="space-y-1.5">
            <Label>תיאור קצר</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1.5">
              <Label>מיועד לתפקיד</Label>
              <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">כל המשתמשים</SelectItem>
                  <SelectItem value="admin">מנהלים בלבד</SelectItem>
                  <SelectItem value="user">משתמשים רגילים</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Switch checked={form.is_enabled} onCheckedChange={(v) => setForm(f => ({ ...f, is_enabled: v }))} />
              <Label>סיור פעיל</Label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>שלבי הסיור</Label>
            <WizardStepsEditor steps={form.steps} onChange={(steps) => setForm(f => ({ ...f, steps }))} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 h-11 rounded-2xl font-semibold bg-background" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button className="flex-1 h-11 rounded-2xl font-semibold" disabled={!form.title.trim() || saving} onClick={handleSave}>
              {saving ? 'שומר...' : 'שמירה'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}