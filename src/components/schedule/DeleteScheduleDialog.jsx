import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
    <Dialog open={open} onOpenChange={deleting ? undefined : onOpenChange}>
      <DialogContent className="bg-card rounded-[28px] border-0 shadow-2xl max-w-[340px] p-6 [&>button]:hidden" dir="rtl">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-base font-bold text-foreground">מחיקת כל מערכת השעות</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            הפעולה תמחק את כל {lessonCount} השיעורים השבועיים שהוזנו. לא ניתן לבטל פעולה זו.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-2xl font-semibold bg-background"
              onClick={() => onOpenChange(false)}
              disabled={deleting}
            >
              ביטול
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-11 rounded-2xl font-semibold"
              onClick={handleConfirm}
              disabled={deleting || lessonCount === 0}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'מחק הכל'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}