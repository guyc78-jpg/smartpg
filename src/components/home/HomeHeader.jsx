import { Link } from 'react-router-dom';
import { Bell, LogOut, Moon, Settings, Sun, User, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/hooks/useTheme';

export default function HomeHeader({ classCount, studentCount }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const schoolName = typeof window !== 'undefined' ? localStorage.getItem('schoolName') : '';

  return (
    <header className="px-4 pt-4 pb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1">
          <button onClick={() => logout()} className="h-8 w-8 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60" title="יציאה">
            <LogOut className="w-[18px] h-[18px]" />
          </button>
          <button onClick={toggle} className="h-8 w-8 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60" title="מצב כהה">
            {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
          <button onClick={() => toast('אין התראות חדשות')} className="h-8 w-8 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60" title="התראות">
            <Bell className="w-[18px] h-[18px]" />
          </button>
          <Link to="/settings" className="h-8 w-8 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60" title="הגדרות">
            <Settings className="w-[18px] h-[18px]" />
          </Link>
          <Link to="/settings" className="h-8 w-8 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60" title="פרופיל">
            <User className="w-[18px] h-[18px]" />
          </Link>
        </div>
        <div className="text-right">
          <h1 className="text-lg font-bold text-foreground">{user?.full_name || 'ראשי'}</h1>
          {schoolName && <p className="text-xs text-muted-foreground">{schoolName}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-3 text-sm font-medium text-muted-foreground">
        <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {studentCount} תלמידים</span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {classCount} כיתות</span>
      </div>
    </header>
  );
}