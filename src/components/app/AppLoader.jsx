import { useEffect } from 'react';

export default function AppLoader({ exiting = false, onExited }) {
  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(() => onExited?.(), 550);
    return () => clearTimeout(t);
  }, [exiting, onExited]);

  return (
    <div
      dir="rtl"
      className={`fixed inset-0 z-[100] flex items-center justify-center app-loader-bg transition-all duration-500 ease-out ${exiting ? 'opacity-0 scale-[1.04] pointer-events-none' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Glass logo tile + orbit arc */}
        <div className="relative w-28 h-28 flex items-center justify-center" style={{ animation: 'loader-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both' }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 112 112" fill="none" style={{ animation: 'loader-spin 1.8s linear infinite' }} aria-hidden="true">
            <circle cx="56" cy="56" r="52" stroke="hsl(var(--primary) / 0.12)" strokeWidth="2.5" />
            <circle cx="56" cy="56" r="52" stroke="url(#loaderArc)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="90 237" />
            <defs>
              <linearGradient id="loaderArc" x1="0" y1="0" x2="112" y2="112" gradientUnits="userSpaceOnUse">
                <stop stopColor="hsl(217 85% 45%)" />
                <stop offset="1" stopColor="hsl(190 85% 55%)" stopOpacity="0.15" />
              </linearGradient>
            </defs>
          </svg>
          <div className="relative w-20 h-20 rounded-[1.6rem] glass-surface flex items-center justify-center overflow-hidden">
            <span className="text-2xl font-bold text-primary tracking-tight">חנ״ג</span>
            <span
              className="absolute inset-0"
              style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)', animation: 'loader-shimmer 2.2s ease-in-out infinite' }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Wordmark */}
        <div className="text-center" style={{ animation: 'loader-fade-up 0.7s 0.25s ease-out both' }}>
          <p className="text-base font-bold text-foreground">יומן חנ״ג חכם</p>
          <p className="text-xs text-muted-foreground mt-1">מכינים את היומן שלך…</p>
        </div>

        {/* Progress */}
        <div className="w-44 h-1 rounded-full bg-primary/10 overflow-hidden" style={{ animation: 'loader-fade-up 0.7s 0.4s ease-out both' }}>
          <div
            className="h-full w-full rounded-full bg-gradient-to-l from-primary to-accent origin-right"
            style={{ animation: 'loader-progress 2.1s 0.3s cubic-bezier(0.22,1,0.36,1) both' }}
          />
        </div>
      </div>
    </div>
  );
}