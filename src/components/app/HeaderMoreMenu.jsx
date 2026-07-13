import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoutConfirmDialog from '@/components/app/LogoutConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, BookOpenCheck, LogOut, Moon, Settings, Sun, Timer, UserCheck } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const itemClass = 'flex min-h-11 items-center justify-start gap-2.5 text-sm font-medium cursor-pointer rounded-lg px-2.5 py-2 text-right';

export default function HeaderMoreMenu({ items = [] }) {
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <>
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="עוד פעולות"
          className="h-11 w-11 shrink-0 flex items-center justify-center rounded-full liquid-chip text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" dir="rtl" className="w-56 rounded-2xl glass-surface shadow-xl p-1.5 text-right">
        {items.map((item, i) => (
          <DropdownMenuItem
            key={i}
            onClick={item.onClick}
            className={`${itemClass} ${item.destructive ? 'text-destructive focus:text-destructive' : ''}`}
          >
            {item.icon && <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
            {item.label}
          </DropdownMenuItem>
        ))}
        {items.length > 0 && <DropdownMenuSeparator className="bg-border/50" />}
        <DropdownMenuItem onClick={() => navigate('/substitute-fills')} className={itemClass}>
          <UserCheck className="w-4 h-4 shrink-0" /> מילויי מקום
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/stopwatch')} className={itemClass}>
          <Timer className="w-4 h-4 shrink-0" /> סטופר
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('smartpg:open-onboarding'))} className={itemClass}>
          <BookOpenCheck className="w-4 h-4 shrink-0" /> מדריך למשתמש
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings')} className={itemClass}>
          <Settings className="w-4 h-4 shrink-0" /> הגדרות
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggle} className={itemClass}>
          {dark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {dark ? 'מצב בהיר' : 'מצב כהה'}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem onClick={() => setLogoutOpen(true)} className={itemClass}>
          <LogOut className="w-4 h-4 shrink-0" /> יציאה / החלפת משתמש
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <LogoutConfirmDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </>
  );
}
