import { AlertTriangle, ArrowRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { convertRawToGrade } from '@/lib/gradeCalc';
import { RUN_STATUS_LABELS, FINAL_RUN_STATUSES, displayRunStudentName, formatRunTime, msFromSeconds, secondsFromMs, sortRunStudents } from './runUtils';

export default function RunSummary({ session, students, test, settings, onEdit, onBack, onSave }) {
  const sorted = sortRunStudents(students, session.participants);
  const hasTable = Boolean(test?.conversionTable?.length);

  const getGrade = (participant) => {
    if (participant.status === 'finished') {
      const converted = convertRawToGrade(secondsFromMs(participant.finishTimeMs), test?.conversionTable || []);
      return converted === null ? 'דורש טבלה' : Math.max(converted, settings.minCompletedGrade || 56);
    }
    if (participant.status === 'not_completed' || participant.status === 'not_participated') return settings.penaltyScore || 15;
    return '—';
  };

  const invalidRows = sorted.filter(student => {
    const p = session.participants[student.id];
    return p.status === 'finished' && !p.finishTimeMs;
  });

  return (
    <div className="max-w-4xl mx-auto p-3 pb-28 space-y-3" dir="rtl">
      <Card className="card-3d rounded-2xl p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">סיכום לפני שמירה</h2>
            <p className="text-sm text-muted-foreground">בדוק זמנים, סטטוסים וציונים. השמירה מתבצעת רק אחרי אישור.</p>
          </div>
          <Badge variant="secondary">{sorted.length} תלמידים</Badge>
        </div>
        {!hasTable && <div className="flex items-center gap-2 rounded-xl bg-warning/10 p-2 text-xs text-warning"><AlertTriangle className="w-4 h-4" /> אין טבלת המרה מלאה למבדק הזה, הציון יחושב לאחר הגדרת טבלה.</div>}
      </Card>

      <div className="space-y-2">
        {sorted.map(student => {
          const participant = session.participants[student.id];
          const seconds = participant.finishTimeMs ? secondsFromMs(participant.finishTimeMs) : '';
          return (
            <Card key={student.id} className="rounded-2xl p-3">
              <div className="grid grid-cols-2 md:grid-cols-[1fr_150px_110px_130px_80px] gap-2 items-center">
                <div className="col-span-2 md:col-span-1 text-right">
                  <div className="font-black">{displayRunStudentName(student)}</div>
                  <div className="text-xs text-muted-foreground">{participant.laps}/{session.setup.lapsRequired} סיבובים · {participant.finishTimeMs ? formatRunTime(participant.finishTimeMs) : 'אין זמן סיום'}</div>
                </div>
                <select value={participant.status} onChange={e => onEdit(student.id, { status: e.target.value, finishTimeMs: e.target.value === 'finished' ? participant.finishTimeMs || session.elapsedBeforePause : null })} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
                  {FINAL_RUN_STATUSES.map(status => <option key={status} value={status}>{RUN_STATUS_LABELS[status]}</option>)}
                </select>
                <Input type="number" min="0" step="0.01" value={seconds} disabled={participant.status !== 'finished'} onChange={e => onEdit(student.id, { finishTimeMs: msFromSeconds(e.target.value) })} className="h-10 text-center" placeholder="שניות" />
                <Input type="number" min="0" step="0.5" value={participant.laps} onChange={e => onEdit(student.id, { laps: Number(e.target.value || 0) })} className="h-10 text-center" />
                <div className="text-center font-black text-primary">{getGrade(participant)}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {invalidRows.length > 0 && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">יש תלמיד שסומן “בוצע” בלי זמן תקין. ערוך זמן או שנה סטטוס לפני שמירה.</div>}

      <div className="fixed bottom-14 md:bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t p-3 z-30">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Button variant="outline" onClick={onBack} className="h-12 flex-1 rounded-xl"><ArrowRight className="w-4 h-4" /> חזרה לריצה</Button>
          <Button disabled={invalidRows.length > 0} onClick={onSave} className="h-12 flex-[2] rounded-xl font-black btn-3d"><Save className="w-4 h-4" /> אשר ושמור למבדקים</Button>
        </div>
      </div>
    </div>
  );
}