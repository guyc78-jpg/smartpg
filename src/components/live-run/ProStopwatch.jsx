import { useEffect, useState } from 'react';
import { Flag, Pause, Play, RotateCcw } from 'lucide-react';
import { useLiveRun } from '@/contexts/LiveRunContext';
import { formatRunTime } from './runUtils';

const R = 88;
const C = 2 * Math.PI * R;

function useSmoothElapsed() {
  const { session, elapsedMs } = useLiveRun();
  const [ms, setMs] = useState(elapsedMs);
  useEffect(() => {
    if (!session?.running) { setMs(session?.elapsedBeforePause ?? 0); return; }
    let raf;
    const loop = () => {
      setMs(Date.now() - session.startedAt + session.elapsedBeforePause);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [session?.running, session?.startedAt, session?.elapsedBeforePause]);
  return ms;
}

export default function ProStopwatch({ onReset, onFinish }) {
  const run = useLiveRun();
  const running = Boolean(run.session?.running);
  const ms = useSmoothElapsed();
  const started = running || ms > 0;
  const [main, centis] = formatRunTime(ms).split('.');
  const frac = (ms % 60000) / 60000;

  return (
    <div className="glass-surface rounded-3xl px-4 pt-4 pb-5" dir="rtl">
      {/* Dial */}
      <div className="relative mx-auto w-56 h-56 sm:w-64 sm:h-64">
        {running && <div className="absolute inset-4 rounded-full bg-primary/25 blur-2xl animate-stopwatch-pulse" />}
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="100" cy="100" r={R} fill="none" stroke="hsl(var(--primary) / 0.12)" strokeWidth="6" />
          <circle
            cx="100" cy="100" r={R} fill="none"
            stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
            style={{
              transition: running ? 'none' : 'stroke-dashoffset 0.4s ease',
              filter: running ? 'drop-shadow(0 0 7px hsl(var(--primary) / 0.75))' : 'none',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className={`text-[11px] font-bold tracking-[0.2em] transition-colors ${running ? 'text-primary' : 'text-muted-foreground'}`}>
            {running ? '● בריצה' : started ? 'מושהה' : 'מוכן'}
          </span>
          <div className="flex items-baseline" dir="ltr">
            <span className="font-mono font-black text-5xl sm:text-6xl tabular-nums tracking-tight leading-none">{main}</span>
            <span className="font-mono font-bold text-2xl sm:text-3xl text-primary tabular-nums">.{centis}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <button
          onClick={onReset}
          aria-label="איפוס"
          title="איפוס"
          className={`liquid-chip w-12 h-12 rounded-full flex items-center justify-center transition-opacity duration-300 ${started ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={running ? run.pauseTimer : run.startTimer}
          className={`btn-3d w-20 h-20 rounded-full flex flex-col items-center justify-center gap-0.5 font-black text-primary-foreground transition-colors duration-300 ${running ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'}`}
        >
          {running ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current mr-0.5" />}
          <span className="text-[11px]">{running ? 'השהה' : started ? 'המשך' : 'התחל'}</span>
        </button>
        <button
          onClick={onFinish}
          aria-label="סיום ריצה"
          title="סיום ריצה"
          className={`btn-3d w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-opacity duration-300 ${started ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <Flag className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}