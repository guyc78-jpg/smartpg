import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, LogOut, Moon, Settings, Sun, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import LogoutConfirmDialog from '@/components/app/LogoutConfirmDialog';

const btnClass = 'h-8 w-8 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60 transition-colors active:scale-95';

export default function HeaderActions() {
  const { dark, toggle } = useTheme();
  const [logoutOpen, setLogoutOpen] = useState(false);
  return (
    <div className="flex items-center gap-1 shrink-0" dir="rtl">
      <Link to="/substitute-fills" className={btnClass} title="מילויי מקום">
        <UserCheck className="w-4 h-4" />
      </Link>
      <Link to="/settings" className={btnClass} title="הגדרות">
        <Settings className="w-4 h-4" />
      </Link>
      <button onClick={() => toast('אין התראות חדשות')} className={btnClass} title="התראות">
        <Bell className="w-4 h-4" />
      </button>
      <button onClick={toggle} className={btnClass} title="מצב כהה">
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      <button onClick={() => setLogoutOpen(true)} className={btnClass} title="יציאה">
        <LogOut className="w-4 h-4" />
      </button>
      <LogoutConfirmDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </div>
  );
}