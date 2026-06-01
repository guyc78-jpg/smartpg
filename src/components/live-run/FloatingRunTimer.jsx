import { Link, useLocation } from 'react-router-dom';
import { Timer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiveRun } from '@/contexts/LiveRunContext';
import { formatRunTime } from './runUtils';

export default function FloatingRunTimer() {
  const { session, elapsedMs, closeSession } = useLiveRun();
  const location = useLocation();

  if (!session || location.pathname === '/live-run') return null;

  return (
    <div className="fixed left-3 bottom-16 md:bottom-4 z-50 max-w-[calc(100vw-1.5rem)]" dir="rtl">
      <div className="glass-surface border border-border rounded-2xl shadow-lg p-2 flex items-center gap-2">
        <Link to="/live-run" className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted transition-colors">
          <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Timer className="w-4 h-4 text-primary" />
          </span>
          <span className="text-right">
            <span className="block text-[10px] text-muted-foreground">ריצה פעילה</span>
            <span className="block font-mono font-bold text-sm ltr" dir="ltr">{formatRunTime(elapsedMs)}</span>
          </span>
        </Link>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.confirm('לסגור את הריצה הפעילה?') && closeSession()}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}