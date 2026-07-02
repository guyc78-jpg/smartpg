import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, CalendarDays, FileText } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'ראשי' },
  { to: '/schedule', icon: CalendarDays, label: 'מערכת' },
  { to: '/manage-tests', icon: ClipboardList, label: 'מבדקים' },
  { to: '/reports', icon: FileText, label: 'דוחות' },
];

function MobileNavItem({ to, icon: Icon, label }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`relative flex flex-col items-center justify-center gap-0 w-16 h-full text-[9px] leading-tight font-medium transition-all duration-300 active:scale-90 ${active ? 'text-primary' : 'text-muted-foreground'}`}
    >
      {active && (
        <span className="absolute inset-x-1.5 inset-y-1 rounded-full bg-primary/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]" aria-hidden="true" />
      )}
      <Icon className={`relative w-4 h-4 transition-transform duration-300 ${active ? 'scale-110' : ''}`} />
      <span className="relative truncate max-w-full px-0.5">{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  return (
    <nav
      dir="rtl"
      className="md:hidden fixed inset-x-0 z-40 flex justify-center pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}
    >
      <div className="pointer-events-auto flex items-stretch h-[50px] px-1.5 rounded-full glass-nav border border-border/40 shadow-lg">
        {NAV_ITEMS.map(item => <MobileNavItem key={item.to} {...item} />)}
      </div>
    </nav>
  );
}