import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const itemClass = 'flex items-center justify-start gap-2.5 text-sm font-medium cursor-pointer rounded-lg px-2.5 py-2 text-right';

export default function PushToggleButton({ className }) {
  const { supported, enabled, loading, enable, disable, sendTest } = usePushNotifications();

  if (!supported) return null;

  const handleEnable = async () => {
    try {
      await enable();
      toast.success('התראות הופעלו במכשיר זה');
    } catch (err) {
      if (err.message === 'permission_denied') toast.error('ההרשאה להתראות נדחתה בדפדפן');
      else toast.error('הפעלת ההתראות נכשלה');
    }
  };

  const handleTest = async () => {
    try {
      const res = await sendTest();
      if (res?.sent > 0) toast.success('התראת בדיקה נשלחה — בדקו את המכשיר');
      else toast.error('שליחת ההתראה נכשלה');
    } catch {
      toast.error('שליחת ההתראה נכשלה');
    }
  };

  if (loading) {
    return (
      <span className={className} title="התראות" role="status" aria-label="מעדכן את מצב ההתראות">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      </span>
    );
  }

  if (!enabled) {
    return (
      <button type="button" onClick={handleEnable} className={className} title="הפעלת התראות" aria-label="הפעלת התראות">
        <BellOff className="w-4 h-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <button type="button" className={`${className} text-primary`} title="התראות פעילות" aria-label="ניהול התראות פעילות">
          <BellRing className="w-4 h-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" dir="rtl" className="w-52 rounded-2xl glass-surface shadow-xl p-1.5 text-right">
        <DropdownMenuItem onClick={handleTest} className={itemClass}>
          <Bell className="w-4 h-4 shrink-0" /> שלח התראת בדיקה
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => disable().then(() => toast('ההתראות כובו במכשיר זה'))} className={`${itemClass} text-destructive focus:text-destructive`}>
          <BellOff className="w-4 h-4 shrink-0" /> כבה התראות
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
