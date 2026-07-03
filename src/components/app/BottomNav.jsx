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
      className={`relative flex flex-col items-center justify-center gap-0.5 w-[68px] h-full text-[10px] leading-tight transition-all duration-300 active:scale-90 ${active ? 'text-primary font-bold' : 'text-muted-foreground font-medium'}`}
    >
      {active && (
        <>
          <span
            className="absolute inset-x-0.5 inset-y-1 rounded-full bg-gradient-to-b from-primary/30 to-primary/10 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(255,255,255,0.1),0_6px_18px_-5px_hsl(var(--primary)/0.6)] ring-1 ring-primary/30"
            aria-hidden="true"
          />
          <span
            className="absolute -inset-1 rounded-full bg-primary/10 blur-md pointer-events-none"
            aria-hidden="true"
          />
        </>
      )}
      <Icon className={`relative w-5 h-5 transition-transform duration-300 ${active ? 'scale-110 drop-shadow-[0_1px_4px_hsl(var(--primary)/0.5)]' : ''}`} />
      <span className="relative truncate max-w-full px-0.5">{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  return (
    <nav
      dir="rtl"
      className="md:hidden fixed inset-x-0 z-40 flex justify-center pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)' }}
    >
      <div className="pointer-events-auto flex items-stretch gap-1 h-[60px] px-2.5 rounded-full liquid-pill">
        {NAV_ITEMS.map(item => <MobileNavItem key={item.to} {...item} />)}
      </div>
    </nav>
  );
}