import { Link } from 'react-router-dom';
import { Bell, LogOut, Moon, Settings, Sun, UserCheck, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/hooks/useTheme';

export default function HomeHeader({ classCount, studentCount }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const schoolName = typeof window !== 'undefined' ? localStorage.getItem('schoolName') : '';
  const teacherName = typeof window !== 'undefined' ? localStorage.getItem('teacherName') : '';

  return (
    <header dir="rtl" className="sticky top-0 z-40 glass-nav px-4 pt-2 pb-1.5" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-right min-w-0">
          <h1 className="text-base font-bold text-foreground truncate leading-tight">
            {teacherName || user?.full_name || 'ראשי'}
            {schoolName && <span className="text-sm font-normal text-muted-foreground"> - {schoolName}</span>}
          </h1>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Link to="/settings" className="h-7 w-7 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60" title="פרופיל">
            <UserCheck className="w-4 h-4" />
          </Link>
          <Link to="/settings" className="h-7 w-7 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60" title="הגדרות">
            <Settings className="w-4 h-4" />
          </Link>
          <button onClick={() => toast('אין התראות חדשות')} className="h-7 w-7 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60" title="התראות">
            <Bell className="w-4 h-4" />
          </button>
          <button onClick={toggle} className="h-7 w-7 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60" title="מצב כהה">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => logout()} className="h-7 w-7 flex items-center justify-center text-muted-foreground rounded-lg hover:bg-secondary/60" title="יציאה">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-start gap-2 mt-1 text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {studentCount} תלמידים</span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {classCount} כיתות</span>
      </div>
    </header>
  );
}