import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, FileText, ArrowRight, Moon, Sun, Settings, CalendarDays, Activity } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import BottomNav from '@/components/app/BottomNav';
import HeaderMoreMenu from '@/components/app/HeaderMoreMenu';

export const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'ראשי' },
  { to: '/schedule', icon: CalendarDays, label: 'מערכת שעות' },
  { to: '/live-run', icon: Activity, label: 'ריצה חיה' },
  { to: '/manage-tests', icon: ClipboardList, label: 'מבדקים' },
  { to: '/reports', icon: FileText, label: 'דוחות' },
];

function NavItem({ to, icon: Icon, label }) {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(`${to}/`));
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function DesktopNavigation({ className = '' }) {
  return (
    <nav aria-label="ניווט ראשי" className={`hidden md:flex items-center gap-1 ${className}`}>
      {NAV_ITEMS.map(item => <NavItem key={item.to} {...item} />)}
      <NavItem to="/settings" icon={Settings} label="הגדרות" />
    </nav>
  );
}

export default function Layout({ children, title, backTo, subtitle, titleAction, menuItems }) {
  const { dark, toggle } = useTheme();
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const updateHeight = () => setHeaderHeight(el.offsetHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [title, subtitle, backTo, titleAction]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background flex flex-col" dir="rtl" style={{ '--header-h': `${headerHeight}px` }}>
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-40 glass-nav dark:bg-background"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Desktop Nav Bar */}
        <div className="hidden md:flex items-center gap-3 px-4 h-14 border-b border-border/40">
          <DesktopNavigation />
          <div className="flex-1" />
          <button onClick={toggle} aria-label={dark ? 'מעבר למצב בהיר' : 'מעבר למצב כהה'} className="h-11 w-11 flex items-center justify-center text-muted-foreground rounded-xl hover:bg-secondary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {dark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>

        {/* Page Title Bar */}
        {(title || backTo) && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30">
            {backTo && (
              <Link to={backTo} aria-label="חזרה" className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
            <div className="flex-1 min-w-0 text-right">
              {title && <h1 className="text-base font-bold truncate">{title}</h1>}
              {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
            </div>
            {titleAction && <div className="shrink-0">{titleAction}</div>}
            <HeaderMoreMenu items={menuItems} />
          </div>
        )}
      </header>

      {/* Main Content — real space reserved via measured header height */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden pb-[calc(68px+env(safe-area-inset-bottom,0px))] md:pb-0" style={{ paddingTop: 'var(--header-h)' }}>
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
}
