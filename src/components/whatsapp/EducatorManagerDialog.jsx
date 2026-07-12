import { useEffect, useState } from 'react';
import { Loader2, MessageCircle, Plus, Save, Trash2, UserRoundPen } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidWhatsAppPhone } from '@/lib/whatsapp';

const createContact = () => ({ id: `educator_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: '', phone: '' });

export default function EducatorManagerDialog({ open, onOpenChange, className, contacts = [], onSave, onStartMessage }) {
  const [draft, setDraft] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setDraft(contacts.map((contact, index) => ({ id: contact.id || `educator_${index}`, name: contact.name || '', phone: contact.phone || '' })));
  }, [open, contacts]);

  const updateContact = (id, patch) => setDraft(items => items.map(item => item.id === id ? { ...item, ...patch } : item));
  const removeContact = id => setDraft(items => items.filter(item => item.id !== id));

  const handleSave = async () => {
    const normalized = draft.map(item => ({ id: item.id, name: item.name.trim(), phone: item.phone.trim() }));
    const missingName = normalized.find(item => !item.name);
    const badPhone = normalized.find(item => !isValidWhatsAppPhone(item.phone));
    if (missingName) return toast.error('יש להזין שם מלא לכל מחנכ/ת');
    if (badPhone) return toast.error(`מספר הטלפון של ${badPhone.name || 'המחנכ/ת'} אינו תקין`);

    setSaving(true);
    try {
      await onSave(normalized);
      toast.success('פרטי המחנכים נשמרו');
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || 'שמירת המחנכים נכשלה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="w-[calc(100vw-1.5rem)] max-w-lg max-h-[88svh] overflow-hidden p-0 gap-0 rounded-3xl">
        <DialogHeader className="px-5 pt-5 pb-4 text-right border-b border-border/60">
          <DialogTitle className="flex items-center gap-2 text-base font-black">
            <UserRoundPen className="h-5 w-5 text-primary" />
            מחנכי הכיתה · {className}
          </DialogTitle>
          <DialogDescription>ניתן לשייך מספר מחנכים ולבחור למי לשלוח הודעה.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60svh] overflow-y-auto p-4 space-y-3">
          {draft.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-6 text-center text-sm text-muted-foreground">
              עדיין לא הוגדרו מחנכים לכיתה.
            </div>
          )}

          {draft.map((contact, index) => (
            <div key={contact.id} className="card-3d rounded-2xl border border-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">מחנכ/ת #{index + 1}</span>
                <button type="button" onClick={() => removeContact(contact.id)} aria-label={`מחק את ${contact.name || `מחנכ ${index + 1}`}`} className="h-8 w-8 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`educator-name-${contact.id}`} className="text-xs">שם מלא</Label>
                <Input id={`educator-name-${contact.id}`} value={contact.name} onChange={event => updateContact(contact.id, { name: event.target.value })} placeholder="לדוגמה: יעל כהן" autoComplete="name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`educator-phone-${contact.id}`} className="text-xs">מספר טלפון</Label>
                <Input id={`educator-phone-${contact.id}`} type="tel" dir="ltr" value={contact.phone} onChange={event => updateContact(contact.id, { phone: event.target.value })} placeholder="050-0000000" inputMode="tel" autoComplete="tel" className="text-left" />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={() => setDraft(items => [...items, createContact()])} className="w-full h-11 border-dashed">
            <Plus className="h-4 w-4" /> הוסף מחנכ/ת
          </Button>

          {contacts.length > 0 && (
            <Button type="button" variant="secondary" onClick={onStartMessage} className="w-full h-11">
              <MessageCircle className="h-4 w-4" /> שלח הודעת WhatsApp
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 p-4 border-t border-border/60 bg-background/70">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>ביטול</Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} שמור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
