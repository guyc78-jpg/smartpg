import { ArrowRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { convertRawToGrade } from '@/lib/gradeCalc';
import { displayRunStudentName, formatResultSeconds, formatRunTime, msFromSeconds, secondsFromMs, sortRunStudents } from './runUtils';

const STATUS_OPTIONS = [
  { value: 'finished', label: 'סיים/ה' },
  { value: 'not_completed', label: 'לא השלים/ה' },
  { value: 'not_participated', label: 'לא השתתף/ה' },
];

export default function RunSummary({ session, students, className, test, passThreshold = 55, onEdit, onBack, onSave, saving }) {
  const participants = session.participants;
  const sorted = sortRunStudents(students, participants);
  const totalLaps = session.setup.totalLaps;
  const finished = sorted.filter(s => participants[s.id].status === 'finished');
  const notCompleted = sorted.filter(s => participants[s.id].status === 'not_completed').length;
  const notParticipated = sorted.filter(s => participants[s.id].status === 'not_participated').length;

  const gradeFor = (p) => (test && p.status === 'finished' && p.finishTimeMs)
    ? convertRawToGrade(secondsFromMs(p.finishTimeMs), test.conversionTable)
    : null;

  const invalidRows = sorted.filter(student => {
    const p = participants[student.id];
    return p.status === 'finished' && !p.finishTimeMs;
  });

  return (
    <div className="w-full max-w-[520px] mx-auto p-3 pb-[calc(230px+env(safe-area-inset-bottom,0px))] md:pb-44 space-y-3 overflow-x-hidden" dir="rtl">
      <div className="rounded-2xl border bg-card p-4 space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">כיתה:</span><span className="font-bold">{className || '—'}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">מבדק:</span><span className="font-bold">{test?.name || session.setup.measurementLabel || '—'}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">סה״כ זמן:</span><span className="font-mono font-black" dir="ltr">{formatRunTime(session.elapsedBeforePause)}</span></div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border bg-card p-3 text-center">
          <div className="text-2xl font-black text-green-600">{finished.length}</div>
          <div className="text-xs text-muted-foreground">סיימו</div>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <div className="text-2xl font-black text-destructive">{notCompleted}</div>
          <div className="text-xs text-muted-foreground">לא השלימו</div>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <div className="text-2xl font-black text-muted-foreground">{notParticipated}</div>
          <div className="text-xs text-muted-foreground">לא השתתפו</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="grid grid-cols-[20px_minmax(0,1fr)_54px_44px_34px_48px] gap-1 px-2.5 py-2 text-xs font-bold text-muted-foreground border-b bg-muted/40">
          <span>#</span><span className="text-right">שם</span><span className="text-center">זמן</span><span className="text-center">סיבובים</span><span className="text-center">ציון</span><span className="text-center">מצב</span>
        </div>
        {sorted.map(student => {
          const p = participants[student.id];
          const isFinished = p.status === 'finished';
          const rank = isFinished ? finished.indexOf(student) + 1 : null;
          const grade = gradeFor(p);
          return (
            <div key={student.id} className="grid grid-cols-[20px_minmax(0,1fr)_54px_44px_34px_48px] gap-1 px-2.5 py-2.5 items-center border-b last:border-0 text-sm">
              <span className="text-muted-foreground text-xs">{rank ?? '—'}</span>
              <span className="font-bold truncate text-right">{displayRunStudentName(student)}</span>
              <span className="text-center font-mono font-bold" dir="ltr">{isFinished && p.finishTimeMs ? formatResultSeconds(p.finishTimeMs) : '—'}</span>
              <span className="text-center text-xs text-muted-foreground">{p.laps != null && totalLaps ? `${p.laps}/${totalLaps}` : '—'}</span>
              <span className="text-center font-black">{grade ?? '—'}</span>
              <span className="text-center">
                {grade != null ? (
                  grade >= passThreshold
                    ? <span className="rounded-full bg-green-600/15 text-green-700 dark:text-green-400 px-1.5 py-0.5 text-[10px] font-black">עבר</span>
                    : <span className="rounded-full bg-destructive/15 text-destructive px-1.5 py-0.5 text-[10px] font-black">לא עבר</span>
                ) : '—'}
              </span>
            </div>
          );
        })}
      </div>

      <details className="rounded-2xl border bg-card p-3">
        <summary className="text-sm font-bold cursor-pointer">עריכה ידנית של זמן / סטטוס</summary>
        <div className="mt-3 space-y-2">
          {sorted.map(student => {
            const participant = participants[student.id];
            const seconds = participant.finishTimeMs ? secondsFromMs(participant.finishTimeMs) : '';
            return (
              <div key={student.id} className="grid grid-cols-[minmax(0,1fr)_110px_80px] gap-2 items-center w-full max-w-full">
                <span className="text-sm font-bold truncate text-right">{displayRunStudentName(student)}</span>
                <select value={participant.status} onChange={e => onEdit(student.id, { status: e.target.value, finishTimeMs: e.target.value === 'finished' ? participant.finishTimeMs || session.elapsedBeforePause : null })} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
                  {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <Input type="number" min="0" step="0.01" value={seconds} disabled={participant.status !== 'finished'} onChange={e => onEdit(student.id, { finishTimeMs: msFromSeconds(e.target.value) })} className="h-9 text-center text-xs" placeholder="שניות" />
              </div>
            );
          })}
        </div>
      </details>

      {invalidRows.length > 0 && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">יש תלמיד שסומן “סיים” בלי זמן תקין. ערוך זמן או שנה סטטוס לפני שמירה.</div>}

      <div className="fixed bottom-[calc(68px+env(safe-area-inset-bottom,0px))] md:bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t p-3 z-30">
        <div className="w-full max-w-[520px] mx-auto space-y-2">
          <Button disabled={invalidRows.length > 0 || saving} onClick={onSave} className="w-full h-14 rounded-2xl text-lg font-black btn-3d">
            <Save className="w-5 h-5" /> {saving ? 'שומר…' : test ? 'שמור להזנת המבדק' : 'שמור תוצאות'}
          </Button>
          <Button variant="outline" onClick={onBack} className="w-full h-11 rounded-xl"><ArrowRight className="w-4 h-4" /> חזור להגדרות</Button>
        </div>
      </div>
    </div>
  );
}