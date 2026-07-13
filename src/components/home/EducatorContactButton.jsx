import { useMemo, useState } from 'react';
import { ContactRound } from 'lucide-react';
import { toast } from 'sonner';
import EducatorManagerDialog from '@/components/whatsapp/EducatorManagerDialog';
import WhatsAppMessageDialog from '@/components/whatsapp/WhatsAppMessageDialog';

export default function EducatorContactButton({ cls, students, isAdmin, onSaveContacts }) {
  const [managerOpen, setManagerOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const contacts = useMemo(() => (Array.isArray(cls.homeroomContacts) ? cls.homeroomContacts : []).map((contact, index) => ({
    id: contact.id || `educator_${cls.id}_${index}`,
    name: contact.name || '',
    phone: contact.phone || '',
  })), [cls.id, cls.homeroomContacts]);

  const handleClick = () => {
    if (contacts.length > 0) return setMessageOpen(true);
    if (isAdmin) return setManagerOpen(true);
    toast.info('לא הוגדר מחנכ/ת לכיתה זו');
  };

  return (
    <>
      <button type="button" onClick={handleClick} aria-label={isAdmin ? `ניהול מחנכים לכיתה ${cls.name}` : `הודעה למחנכי הכיתה ${cls.name}`} title={isAdmin ? 'ניהול מחנכים' : 'הודעת WhatsApp למחנכ/ת'} className="relative h-11 w-11 shrink-0 flex items-center justify-center rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ContactRound className="h-4 w-4" aria-hidden="true" />
        {contacts.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-black leading-4 text-center shadow-sm" aria-label={`${contacts.length} מחנכים`}>
            {contacts.length}
          </span>
        )}
      </button>

      {isAdmin && (
        <EducatorManagerDialog
          open={managerOpen}
          onOpenChange={setManagerOpen}
          className={cls.name}
          contacts={contacts}
          onSave={onSaveContacts}
          onStartMessage={() => { setManagerOpen(false); setMessageOpen(true); }}
        />
      )}

      <WhatsAppMessageDialog
        open={messageOpen}
        onOpenChange={setMessageOpen}
        cls={cls}
        contacts={contacts}
        students={students}
        canManage={isAdmin}
        onManage={() => { setMessageOpen(false); setManagerOpen(true); }}
      />
    </>
  );
}
