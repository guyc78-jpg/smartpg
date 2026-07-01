import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, CalendarDays, Timer, Activity } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'ראשי' },
  { to: '/schedule', icon: CalendarDays, label: 'מערכת' },
  { to: '/stopwatch', icon: Timer, label: 'סטופר' },
  { to: '/live-run', icon: Activity, label: 'ריצה חיה' },
  { to: '/manage-tests', icon: ClipboardList, label: 'מבדקים' },
];

function MobileNavItem({ to, icon: Icon, label }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] leading-tight font-medium transition-all duration-200 active:scale-90 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
      <Icon className={`w-[18px] h-[18px] transition-transform duration-200 ${active ? 'text-primary scale-110' : ''}`} />
      <span className="truncate max-w-full px-0.5">{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  return (
    <nav
      dir="rtl"
      className="md:hidden fixed bottom-0 inset-x-0 glass-nav border-t border-border/30 rounded-t-2xl shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.12)] z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch justify-around h-14">
        {NAV_ITEMS.map(item => <MobileNavItem key={item.to} {...item} />)}
      </div>
    </nav>
  );
}