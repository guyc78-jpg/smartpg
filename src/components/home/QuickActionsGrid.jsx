import { Link } from 'react-router-dom';
import { CalendarDays, CalendarRange, Activity, ClipboardList, Upload } from 'lucide-react';

const ACTIONS = [
  { to: '/schedule#daily-journal', label: 'מערכת יומית', icon: CalendarDays },
  { to: '/schedule#weekly-schedule', label: 'מערכת שבועית', icon: CalendarRange },
  { to: '/live-run', label: 'ריצה חיה', icon: Activity },
  { to: '/manage-tests', label: 'מדידות כושר', icon: ClipboardList },
  { to: '/schedule?import=1', label: 'ייבוא מערכת', icon: Upload },
];

export default function QuickActionsGrid() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ACTIONS.map(action => (
        <Link
          key={action.label}
          to={action.to}
          className="flex flex-col items-center justify-center gap-1 rounded-xl bg-card shadow-sm py-3 px-1 text-center hover:bg-secondary/60 transition-colors"
        >
          <action.icon className="w-[18px] h-[18px] text-primary" />
          <span className="text-[11px] font-semibold leading-tight">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}