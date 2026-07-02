import { LogOut } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function LogoutConfirmDialog({ open, onOpenChange }) {
  const { logout } = useAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card rounded-[28px] border-0 shadow-2xl max-w-[340px] p-6 [&>button]:hidden" dir="rtl">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-base font-bold text-foreground">יציאה מהחשבון?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            תצטרך להתחבר מחדש כדי להמשיך לעבוד באפליקציה.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-2xl font-semibold bg-background"
              onClick={() => onOpenChange(false)}
            >
              ביטול
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-11 rounded-2xl font-semibold"
              onClick={() => logout()}
            >
              כן, צא מהחשבון
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}