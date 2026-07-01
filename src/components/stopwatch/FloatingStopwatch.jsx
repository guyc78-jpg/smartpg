import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Timer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStopwatch } from '@/contexts/StopwatchContext';
import { formatRunTime } from '@/components/live-run/runUtils';

export default function FloatingStopwatch() {
  const { session, elapsedMs, closeSession } = useStopwatch();
  const location = useLocation();
  const [awake, setAwake] = useState(false);

  if (!session || location.pathname === '/stopwatch') return null;

  const close = () => {
    if (!window.confirm('יש מדידת סטופר פעילה שלא נשמרה. לסגור בכל זאת?')) return;
    closeSession();
  };

  return (
    <div className="fixed right-3 bottom-16 md:bottom-4 z-50 max-w-[calc(100vw-1.5rem)]" dir="rtl" onClick={() => setAwake(true)} onMouseEnter={() => setAwake(true)} onMouseLeave={() => setAwake(false)}>
      <div className={`glass-surface border border-border rounded-2xl shadow-lg p-2 flex items-center gap-2 transition-opacity ${awake || session.running ? 'opacity-100' : 'opacity-35'}`}>
        <Link to="/stopwatch" className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted transition-colors">
          <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Timer className="w-4 h-4 text-primary" /></span>
          <span className="text-right">
            <span className="block text-[10px] text-muted-foreground">סטופר חכם פעיל</span>
            <span className="block font-mono font-black text-base" dir="ltr">{formatRunTime(elapsedMs)}</span>
          </span>
        </Link>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={close}><X className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}