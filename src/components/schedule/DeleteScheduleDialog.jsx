import { useState } from 'react';
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
import { Trash2, Loader2 } from 'lucide-react';

export default function DeleteScheduleDialog({ open, onOpenChange, lessonCount, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // keep dialog open on failure
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={nextOpen => { if (!deleting) onOpenChange(nextOpen); }}>
      <AlertDialogContent className="max-w-[340px] rounded-[28px] border-0 bg-card p-6 shadow-2xl" dir="rtl">
        <AlertDialogHeader className="text-center sm:text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-destructive" aria-hidden="true" />
          </div>
          <AlertDialogTitle className="text-base font-bold text-foreground">מחיקת כל מערכת השעות</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
            הפעולה תמחק את כל {lessonCount} השיעורים השבועיים שהוזנו. לא ניתן לבטל פעולה זו.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-2">
            <AlertDialogCancel className="mt-0 h-11 rounded-2xl bg-background font-semibold" disabled={deleting}>
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 rounded-2xl bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
              onClick={event => { event.preventDefault(); handleConfirm(); }}
              disabled={deleting || lessonCount === 0}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'מחק הכל'}
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
