import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Phone, Settings2, UserRound, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { buildWhatsAppMessage, getMessageType, WHATSAPP_MESSAGE_TYPES } from '@/lib/whatsappTemplates';
import { isValidWhatsAppPhone, openWhatsApp } from '@/lib/whatsapp';
import { formatStudentName } from '@/lib/studentName';

export default function WhatsAppMessageDialog({
  open,
  onOpenChange,
  cls,
  contacts = [],
  students = [],
  initialContactId,
  initialStudentId,
  initialMessageType = 'general',
  initialNote = '',
  missingTestNames = [],
  canManage = false,
  onManage,
}) {
  const [contactId, setContactId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [messageType, setMessageType] = useState('general');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setContactId(initialContactId || contacts[0]?.id || '');
    setStudentId(initialStudentId || '');
    setMessageType(initialMessageType);
    setNote(initialNote);
  }, [open, initialContactId, initialStudentId, initialMessageType, initialNote, contacts]);

  const contact = contacts.find(item => item.id === contactId) || contacts[0];
  const student = students.find(item => item.id === studentId);
  const typeConfig = getMessageType(messageType);
  const preview = useMemo(() => buildWhatsAppMessage({
    type: messageType,
    educatorName: contact?.name,
    className: cls?.name || 'הכיתה',
    studentName: student ? formatStudentName(student) : '',
    note,
    missingTestNames,
  }), [messageType, contact?.name, cls?.name, student, note, missingTestNames]);

  const handleOpenWhatsApp = () => {
    if (!contact) return toast.error('לא הוגדר מחנכ/ת לכיתה');
    if (!isValidWhatsAppPhone(contact.phone)) return toast.error(`חסר מספר טלפון תקין עבור ${contact.name}`);
    if (typeConfig.studentRequired && !student) return toast.error('יש לבחור תלמיד/ה עבור סוג הודעה זה');
    if (messageType === 'custom' && !note.trim()) return toast.error('יש להזין טקסט חופשי להודעה');
    if (!openWhatsApp(contact.phone, preview)) toast.error('לא ניתן לפתוח את WhatsApp');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-xl flex-col overflow-hidden p-0 gap-0 rounded-3xl sm:h-auto sm:max-h-[92dvh]">
        <DialogHeader className="shrink-0 px-5 pt-5 pb-4 text-right border-b border-border/60">
          <DialogTitle className="flex items-center gap-2 text-lg font-black">
            <span className="h-9 w-9 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><MessageCircle className="h-5 w-5" /></span>
            הודעה למחנכ/ת
          </DialogTitle>
          <DialogDescription>{contact?.name || 'לא נבחר מחנכ/ת'} · {cls?.name}</DialogDescription>
          {canManage && (
            <button type="button" onClick={onManage} className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/10">
              <Settings2 className="h-3.5 w-3.5" /> ניהול מחנכים
            </button>
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
          {contacts.length > 1 && (
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5" /> למי לשלוח?</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger><SelectValue placeholder="בחר מחנכ/ת" /></SelectTrigger>
                <SelectContent>{contacts.map(item => <SelectItem key={item.id} value={item.id}>{item.name} · {item.phone || 'ללא טלפון'}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">סוג הודעה</Label>
            <div className="grid grid-cols-2 gap-2">
              {WHATSAPP_MESSAGE_TYPES.map(type => (
                <button key={type.key} type="button" onClick={() => setMessageType(type.key)} aria-pressed={messageType === type.key} className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-bold transition-all ${messageType === type.key ? 'liquid-chip-active border-primary/50' : 'liquid-chip text-foreground'}`}>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {typeConfig.studentRequired && (
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> תלמיד/ה</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger><SelectValue placeholder={students.length ? 'בחר תלמיד/ה' : 'אין תלמידים בכיתה'} /></SelectTrigger>
                <SelectContent>{students.map(item => <SelectItem key={item.id} value={item.id}>{formatStudentName(item)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="whatsapp-note" className="text-xs">{messageType === 'custom' ? 'טקסט חופשי' : 'הערה (אופציונלי)'}</Label>
            <Textarea id="whatsapp-note" value={note} onChange={event => setNote(event.target.value)} placeholder={messageType === 'custom' ? 'כתוב את תוכן ההודעה…' : 'פרטים נוספים שיתווספו להודעה…'} className="min-h-24 resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">תצוגה מקדימה</Label>
            <div className="rounded-2xl border border-border bg-muted/35 p-4 whitespace-pre-line text-sm leading-6 text-foreground" aria-live="polite">{preview}</div>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 grid shrink-0 grid-cols-[1fr_2.5fr] gap-2 border-t border-border/60 bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button type="button" onClick={handleOpenWhatsApp} className="min-h-12 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Phone className="h-4 w-4" /> פתח ב־WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
