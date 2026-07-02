import { LogOut } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function LogoutConfirmDialog({ open, onOpenChange }) {
  const { logout } = useAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs rounded-2xl glass-surface" dir="rtl">
        <div className="text-right space-y-3 pt-2">
          <div className="h-11 w-11 rounded-full bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">יציאה מהחשבון?</h3>
            <p className="text-sm text-muted-foreground mt-1">תצטרך להתחבר מחדש כדי להמשיך לעבוד באפליקציה.</p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="destructive" className="flex-1 h-10 rounded-xl" onClick={() => logout()}>
              כן, צא מהחשבון
            </Button>
            <Button variant="outline" className="flex-1 h-10 rounded-xl" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}