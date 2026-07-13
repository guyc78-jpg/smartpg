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
import { Trash2 } from 'lucide-react';

export default function ConfirmDeleteDialog({ open, onOpenChange, title, description, onConfirm, confirmLabel }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
        <AlertDialogFooter className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-2">
            <AlertDialogCancel className="mt-0 h-11 rounded-2xl bg-background font-semibold">
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 rounded-2xl bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
              onClick={onConfirm}
            >
              {confirmLabel || 'מחק'}
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
