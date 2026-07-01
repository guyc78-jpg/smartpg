import { AlertTriangle, ArrowRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { convertRawToGrade } from '@/lib/gradeCalc';
import { RUN_STATUS_LABELS, FINAL_RUN_STATUSES, displayRunStudentName, formatRunTime, msFromSeconds, secondsFromMs, sortRunStudents } from './runUtils';

export default function RunSummary({ session, students, test, settings, onEdit, onBack, onSave }) {
  const sorted = sortRunStudents(students, session.participants);
  const hasTable = Boolean(test?.conversionTable?.length);

  const getGrade = (participant) => {
    if (participant.status === 'finished') {
      const converted = convertRawToGrade(secondsFromMs(participant.finishTimeMs), test?.conversionTable || []);
      return converted === null ? '—' : Math.max(converted, settings.minCompletedGrade || 56);
    }
    if (participant.status === 'not_completed' || participant.status === 'not_participated') return settings.penaltyScore || 15;
    return '—';
  };

  const notParticipated = sorted.filter(s => session.participants[s.id].status === 'not_participated').length;
  const notCompleted = sorted.filter(s => session.participants[s.id].status === 'not_completed').length;
  const finishedCount = sorted.filter(s => session.participants[s.id].status === 'finished').length;

  const invalidRows = sorted.filter(student => {
    const p = session.participants[student.id];
    return p.status === 'finished' && !p.finishTimeMs;
  });

  return (
    <div className="max-w-4xl mx-auto p-3 pb-28 space-y-3" dir="rtl">
      <Card className="card-3d rounded-2xl p-4 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">כיתה:</span><span className="font-bold">{session.setup.gradeLevel ? `${session.setup.gradeLevel}' ` : ''}{test ? '' : ''}{students[0]?.className || ''}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">מבדק:</span><span className="font-bold">{session.setup.testName || test?.name}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">סה״כ זמן:</span><span className="font-mono font-black text-lg" dir="ltr">{formatRunTime(session.elapsedBeforePause)}</span></div>
        {!hasTable && <div className="flex items-center gap-2 rounded-xl bg-warning/10 p-2 text-xs text-warning"><AlertTriangle className="w-4 h-4" /> אין טבלת המרה מלאה למבדק הזה.</div>}
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border p-3 text-center">
          <div className="text-2xl font-black">{notParticipated}</div>
          <div className="text-xs text-muted-foreground">לא השתתפו</div>
        </div>
        <div className="rounded-xl border p-3 text-center border-destructive/40">
          <div className="text-2xl font-black text-destructive">{notCompleted}</div>
          <div className="text-xs text-muted-foreground">לא השלימו</div>
        </div>
        <div className="rounded-xl border-2 border-primary p-3 text-center">
          <div className="text-2xl font-black text-primary">{finishedCount}</div>
          <div className="text-xs text-muted-foreground">סיימו</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_28px_70px_70px_50px] gap-2 px-3 py-2 text-xs font-bold text-muted-foreground border-b">
          <span className="text-right">שם</span><span className="text-center">#</span><span className="text-center">זמן</span><span className="text-center">סיבובים</span><span className="text-center">ציון</span>
        </div>
        {sorted.map((student, index) => {
          const participant = session.participants[student.id];
          return (
            <div key={student.id} className="grid grid-cols-[1fr_28px_70px_70px_50px] gap-2 px-3 py-2 items-center border-b last:border-0 text-sm">
              <span className="font-bold truncate text-right">{displayRunStudentName(student)}</span>
              <span className="text-center text-muted-foreground">{index + 1}</span>
              <span className="text-center font-mono font-bold" dir="ltr">{participant.finishTimeMs ? formatRunTime(participant.finishTimeMs) : '—'}</span>
              <span className="text-center text-muted-foreground" dir="ltr">{participant.laps}/{session.setup.lapsRequired}</span>
              <span className="text-center font-black text-primary">{getGrade(participant)}</span>
            </div>
          );
        })}
      </div>

      <details className="rounded-2xl border bg-card p-3">
        <summary className="text-sm font-bold cursor-pointer">עריכה ידנית של זמן / סטטוס</summary>
        <div className="mt-3 space-y-2">
          {sorted.map(student => {
            const participant = session.participants[student.id];
            const seconds = participant.finishTimeMs ? secondsFromMs(participant.finishTimeMs) : '';
            return (
              <div key={student.id} className="grid grid-cols-[1fr_120px_90px] gap-2 items-center">
                <span className="text-sm font-bold truncate text-right">{displayRunStudentName(student)}</span>
                <select value={participant.status} onChange={e => onEdit(student.id, { status: e.target.value, finishTimeMs: e.target.value === 'finished' ? participant.finishTimeMs || session.elapsedBeforePause : null })} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
                  {FINAL_RUN_STATUSES.map(status => <option key={status} value={status}>{RUN_STATUS_LABELS[status]}</option>)}
                </select>
                <Input type="number" min="0" step="0.01" value={seconds} disabled={participant.status !== 'finished'} onChange={e => onEdit(student.id, { finishTimeMs: msFromSeconds(e.target.value) })} className="h-9 text-center text-xs" placeholder="שניות" />
              </div>
            );
          })}
        </div>
      </details>

      {invalidRows.length > 0 && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">יש תלמיד שסומן “בוצע” בלי זמן תקין. ערוך זמן או שנה סטטוס לפני שמירה.</div>}

      <div className="fixed bottom-14 md:bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t p-3 z-30">
        <div className="max-w-4xl mx-auto space-y-2">
          <Button disabled={invalidRows.length > 0} onClick={onSave} className="w-full h-13 rounded-xl font-black btn-3d"><Save className="w-4 h-4" /> שמור להזנת המבדק</Button>
          <Button variant="outline" onClick={onBack} className="w-full h-11 rounded-xl"><ArrowRight className="w-4 h-4" /> חזור להגדרות</Button>
        </div>
      </div>
    </div>
  );
}