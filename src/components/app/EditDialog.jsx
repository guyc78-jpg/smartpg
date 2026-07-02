import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Trash2 } from 'lucide-react';

export const fieldClass = 'h-11 text-sm text-foreground liquid-field rounded-xl shadow-none focus-visible:ring-0';
export const textareaClass = 'min-h-[70px] text-sm text-foreground liquid-field rounded-xl focus-visible:ring-0';

export function Field({ label, children }) {
  return (
    <div className="space-y-1.5 text-right">
      <Label className="text-xs font-semibold text-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function EditDialog({ open, onOpenChange, title, children, onSave, canSave = true, saveLabel = 'שמור', onDelete }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setSaving(false); setError(''); }
  }, [open]);

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError('');
    try {
      await onSave();
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
          <DialogTitle className="text-lg font-bold text-foreground text-right">{title}</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-5 pt-3 space-y-4 max-h-[78vh] overflow-y-auto">
          {children}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={!canSave || saving} className="flex-1 h-11 rounded-xl font-bold text-sm">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> שומר...</> : saveLabel}
            </Button>
            {onDelete && (
              <Button variant="outline" disabled={saving} onClick={onDelete} className="h-11 rounded-xl px-4 text-destructive hover:text-destructive" aria-label="מחיקה">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)} className="h-11 rounded-xl px-5 font-semibold text-foreground">ביטול</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}