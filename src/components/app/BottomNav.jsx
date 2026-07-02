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
      className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] leading-tight font-medium transition-all duration-300 active:scale-90 ${active ? 'text-primary' : 'text-muted-foreground'}`}
    >
      {active && (
        <span className="absolute inset-x-1 inset-y-1.5 rounded-full bg-primary/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]" aria-hidden="true" />
      )}
      <Icon className={`relative w-[18px] h-[18px] transition-transform duration-300 ${active ? 'scale-110' : ''}`} />
      <span className="relative truncate max-w-full px-0.5">{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  return (
    <nav
      dir="rtl"
      className="md:hidden fixed bottom-0 inset-x-0 liquid-pill rounded-t-2xl z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch justify-around h-[60px] px-1">
        {NAV_ITEMS.map(item => <MobileNavItem key={item.to} {...item} />)}
      </div>
    </nav>
  );
}