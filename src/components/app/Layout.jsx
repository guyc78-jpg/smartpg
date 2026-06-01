import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, FileText, ArrowRight, LogOut, Moon, Sun, Settings, CalendarDays, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';

function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
  return { dark, toggle: () => setDark(d => !d) };
}

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'ראשי' },
  { to: '/schedule', icon: CalendarDays, label: 'מערכת' },
  { to: '/manage-tests', icon: ClipboardList, label: 'מבדקים' },
  { to: '/reports', icon: FileText, label: 'דוחות' },
];

function NavItem({ to, icon: Icon, label }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

function MobileNavItem({ to, icon: Icon, label }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`flex flex-col items-center justify-center gap-0 min-w-[48px] h-full rounded-lg text-[10px] leading-tight font-medium transition-all duration-200 active:scale-90 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
      <Icon className={`w-[18px] h-[18px] transition-transform duration-200 ${active ? 'text-primary scale-110' : ''}`} />
      <span>{label}</span>
    </Link>
  );
}

export default function Layout({ children, title, backTo, subtitle, titleAction }) {
  const { dark, toggle } = useTheme();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Desktop Header */}
      <header className="hidden md:flex items-center gap-3 px-4 h-12 border-b border-border/60 bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(item => <NavItem key={item.to} {...item} />)}
          <Link to="/settings" className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/settings' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
            <Settings className="w-4 h-4" />
            הגדרות
          </Link>
        </div>
        <div className="flex-1" />
        <Link to="/live-run" className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors ${location.pathname === '/live-run' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`} aria-label="ריצה Live">
          <Timer className="w-4 h-4" />
        </Link>
        <button onClick={toggle} className="h-8 w-8 flex items-center justify-center text-muted-foreground rounded-md hover:bg-secondary/50 transition-colors">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Page Header */}
      {(title || backTo) && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 bg-background/80 sticky top-12 md:top-12 z-30">
          {backTo && (
            <Link to={backTo} className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <div className="flex-1 min-w-0">
            {title && <h1 className="text-base font-bold truncate">{title}</h1>}
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
          <Link to="/live-run" className={`md:hidden h-8 w-8 flex items-center justify-center rounded-md transition-colors ${location.pathname === '/live-run' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`} aria-label="ריצה Live">
            <Timer className="w-4 h-4" />
          </Link>
          {titleAction && <div className="shrink-0">{titleAction}</div>}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-background border-t border-border/60 z-40 h-14">
        <div className="flex justify-around items-center h-full px-2">
          {NAV_ITEMS.map(item => <MobileNavItem key={item.to} {...item} />)}
          <MobileNavItem to="/settings" icon={Settings} label="הגדרות" />
        </div>
      </nav>
    </div>
  );
}