import { Flag, Pause, Play, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRunTime } from '@/components/live-run/runUtils';

export default function StopwatchRunner({ session, elapsedMs, onStart, onPause, onLap, onReset, onFinish }) {
  const reversedLaps = session.laps.map((ms, idx) => ({ ms, number: idx + 1 })).slice().reverse();

  return (
    <div className="max-w-[480px] mx-auto px-3 pt-3 pb-6 space-y-3" dir="rtl">
      <section className="rounded-3xl bg-card border p-4 text-center space-y-3">
        <p className="text-sm font-bold text-muted-foreground truncate">{session.label || 'מדידת שיעור'}</p>
        <div className="font-mono text-7xl font-black tracking-wider text-foreground" dir="ltr">{formatRunTime(elapsedMs)}</div>
        <div className="grid grid-cols-2 gap-2">
          {session.running ? (
            <Button onClick={onPause} className="h-16 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-lg font-black"><Pause className="w-5 h-5" /> עצור</Button>
          ) : (
            <Button onClick={onStart} className="h-16 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-lg font-black"><Play className="w-5 h-5" /> {elapsedMs ? 'המשך' : 'התחל'}</Button>
          )}
          <Button variant="outline" onClick={onLap} disabled={!session.running} className="h-16 rounded-2xl text-lg font-black"><Flag className="w-5 h-5" /> הקפה</Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onReset} className="h-12 rounded-xl font-bold"><RotateCcw className="w-4 h-4" /> איפוס</Button>
          <Button onClick={onFinish} className="h-12 rounded-xl font-bold btn-3d"><Save className="w-4 h-4" /> שמור וסיים</Button>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-3">
        <p className="text-sm font-bold mb-2">הקפות ({session.laps.length})</p>
        {reversedLaps.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">אין הקפות עדיין.</p>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {reversedLaps.map(l => (
              <div key={l.number} className="flex items-center justify-between text-sm rounded-lg bg-muted/40 px-3 py-2">
                <span className="font-bold">הקפה {l.number}</span>
                <span className="font-mono font-bold" dir="ltr">{formatRunTime(l.ms)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}