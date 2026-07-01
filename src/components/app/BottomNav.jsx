import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, FileText, CalendarDays } from 'lucide-react';

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
    <Link to={to} className={`flex flex-col items-center justify-center gap-0 min-w-[48px] h-full rounded-lg text-[10px] leading-tight font-medium transition-all duration-200 active:scale-90 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
      <Icon className={`w-[18px] h-[18px] transition-transform duration-200 ${active ? 'text-primary scale-110' : ''}`} />
      <span>{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-background border-t border-border/60 z-40 h-14">
      <div className="flex justify-around items-center h-full px-2">
        {NAV_ITEMS.map(item => <MobileNavItem key={item.to} {...item} />)}
      </div>
    </nav>
  );
}