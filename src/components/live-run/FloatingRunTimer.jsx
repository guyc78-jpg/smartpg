import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Timer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiveRun } from '@/contexts/LiveRunContext';
import { formatRunTime } from './runUtils';

export default function FloatingRunTimer() {
  const { session, elapsedMs, closeSession, hasUnsavedWork } = useLiveRun();
  const location = useLocation();
  const [awake, setAwake] = useState(false);

  if (!session || location.pathname === '/live-run') return null;

  const close = () => {
    if (hasUnsavedWork && !window.confirm('יש ריצה פעילה או תוצאות שלא נשמרו. לסגור בכל זאת?')) return;
    closeSession();
  };

  return (
    <div
      className="fixed left-3 bottom-16 md:bottom-4 z-50 max-w-[calc(100vw-1.5rem)]"
      dir="rtl"
      onPointerDown={() => setAwake(true)}
      onMouseEnter={() => setAwake(true)}
      onMouseLeave={() => setAwake(false)}
      onFocusCapture={() => setAwake(true)}
      onBlurCapture={() => setAwake(false)}
    >
      <div className={`liquid-pill rounded-2xl p-2 flex items-center gap-2 transition-opacity focus-within:opacity-100 ${awake || session.running ? 'opacity-100' : 'opacity-50'}`}>
        <Link to="/live-run" aria-label="חזרה לריצה החיה" className="flex min-h-11 items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="relative w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Timer className="w-4 h-4 text-primary" aria-hidden="true" />
            {session.running && <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-primary animate-ping" aria-hidden="true" />}
          </span>
          <span className="text-right">
            <span className="block text-[10px] text-muted-foreground">ריצה חיה פעילה</span>
            <span className="block font-mono font-black text-base" dir="ltr">{formatRunTime(elapsedMs)}</span>
          </span>
        </Link>
        <Button variant="ghost" size="icon" aria-label="סגירת הריצה החיה" className="h-11 w-11" onClick={close}><X className="w-4 h-4" aria-hidden="true" /></Button>
      </div>
    </div>
  );
}
