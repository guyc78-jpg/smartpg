import { Link } from 'react-router-dom';
import { Bell, LogOut, Moon, Settings, Sun, User, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/hooks/useTheme';

export default function HomeHeader({ classCount, studentCount }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const schoolName = typeof window !== 'undefined' ? localStorage.getItem('schoolName') : '';
  const teacherName = typeof window !== 'undefined' ? localStorage.getItem('teacherName') : '';

  return (
    <header dir="rtl" className="sticky top-0 z-40 glass-nav px-3 py-2" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-right min-w-0">
          <h1 className="text-sm font-bold text-foreground truncate leading-tight">{teacherName || user?.full_name || 'ראשי'}</h1>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground leading-tight">
            {schoolName && <><span className="truncate">{schoolName}</span><span className="text-border">|</span></>}
            <span className="flex items-center gap-0.5 shrink-0"><Users className="w-3 h-3" /> {studentCount}</span>
            <span className="flex items-center gap-0.5 shrink-0"><Building2 className="w-3 h-3" /> {classCount}</span>
          </div>
        </div>
        <div className="flex items-center shrink-0">
          <button onClick={() => logout()} className="h-7 w-7 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60" title="יציאה">
            <LogOut className="w-4 h-4" />
          </button>
          <button onClick={toggle} className="h-7 w-7 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60" title="מצב כהה">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => toast('אין התראות חדשות')} className="h-7 w-7 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60" title="התראות">
            <Bell className="w-4 h-4" />
          </button>
          <Link to="/settings" className="h-7 w-7 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60" title="הגדרות">
            <Settings className="w-4 h-4" />
          </Link>
          <Link to="/settings" className="h-7 w-7 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60" title="פרופיל">
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}