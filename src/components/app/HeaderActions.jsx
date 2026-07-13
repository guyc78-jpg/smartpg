import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Moon, Settings, Sun, UserCheck } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import LogoutConfirmDialog from '@/components/app/LogoutConfirmDialog';
import PushToggleButton from '@/components/app/PushToggleButton';

const btnClass = 'h-11 w-11 flex items-center justify-center text-muted-foreground rounded-xl hover:bg-secondary/60 transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export default function HeaderActions() {
  const { dark, toggle } = useTheme();
  const [logoutOpen, setLogoutOpen] = useState(false);
  return (
    <div className="flex items-center gap-0 shrink-0" dir="rtl">
      <Link to="/substitute-fills" className={btnClass} title="מילויי מקום" aria-label="מילויי מקום">
        <UserCheck className="w-4 h-4" aria-hidden="true" />
      </Link>
      <Link to="/settings" className={btnClass} title="הגדרות" aria-label="הגדרות">
        <Settings className="w-4 h-4" aria-hidden="true" />
      </Link>
      <PushToggleButton className={btnClass} />
      <button type="button" onClick={toggle} className={btnClass} title={dark ? 'מעבר למצב בהיר' : 'מעבר למצב כהה'} aria-label={dark ? 'מעבר למצב בהיר' : 'מעבר למצב כהה'}>
        {dark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
      </button>
      <button type="button" onClick={() => setLogoutOpen(true)} className={btnClass} title="יציאה" aria-label="יציאה או החלפת משתמש">
        <LogOut className="w-4 h-4" aria-hidden="true" />
      </button>
      <LogoutConfirmDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </div>
  );
}
