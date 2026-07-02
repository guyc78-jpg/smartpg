import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, CalendarX } from 'lucide-react';

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
    <Dialog open={open} onOpenChange={deleting ? undefined : onOpenChange}>
      <DialogContent className="bg-card/90 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl max-w-sm p-0 overflow-hidden" dir="rtl">
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 backdrop-blur-md flex items-center justify-center shadow-inner">
            <CalendarX className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold">מחיקת כל מערכת השעות</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              פעולה זו תמחק לצמיתות את כל {lessonCount} השיעורים במערכת השבועית.
              <br />
              הכיתות והתלמידים לא יימחקו.
            </p>
          </div>
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-xs font-semibold text-destructive">
            לא ניתן לשחזר את המערכת לאחר המחיקה
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={deleting}
            >
              ביטול
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={handleConfirm}
              disabled={deleting || lessonCount === 0}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleting ? 'מוחק...' : 'מחק הכל'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}