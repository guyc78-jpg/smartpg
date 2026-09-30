import { useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2 } from 'lucide-react';

export default function ConfirmDeleteDialog({ open, onOpenChange, title, description, onConfirm, confirmLabel }) {
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (open) setError(''); }, [open]);

  const confirm = async (event) => {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      setError('המחיקה לא הושלמה. בדוק את החיבור ונסה שוב.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={value => { if (!busyRef.current) onOpenChange(value); }}>
      <AlertDialogContent className="max-w-[340px] rounded-[28px] border-0 bg-card p-6 shadow-2xl" dir="rtl">
        <AlertDialogHeader className="text-center sm:text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-destructive" aria-hidden="true" />
          </div>
          <AlertDialogTitle className="text-base font-bold text-foreground">
            {title || 'אישור מחיקה'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {description || 'האם אתה בטוח שברצונך למחוק? לא ניתן לבטל פעולה זו.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p role="alert" aria-live="assertive" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <AlertDialogFooter className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-2">
            <AlertDialogCancel disabled={busy} className="mt-0 h-11 rounded-2xl bg-background font-semibold">
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 rounded-2xl bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
              onClick={confirm}
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> מוחק…</> : (confirmLabel || 'מחק')}
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
