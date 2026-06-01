import { Save, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { convertRawToGrade } from '@/lib/gradeCalc';
import { RUN_STATUS_LABELS, formatRunTime, secondsFromMs, sortRunStudents } from './runUtils';
import { formatStudentName } from '@/lib/studentName';

export default function RunSummary({ session, students, test, settings, onEdit, onBack, onSave }) {
  const sorted = sortRunStudents(students, session.participants);
  const hasTable = Boolean(test?.conversionTable?.length);

  const getGrade = (participant) => {
    if (participant.status !== 'finished') return 15;
    const converted = convertRawToGrade(secondsFromMs(participant.finishTimeMs), test?.conversionTable || []);
    return converted === null ? 'דורש טבלה' : Math.max(converted, settings.minCompletedGrade || 56);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4" dir="rtl">
      <Card className="card-3d rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">סיכום ריצה</h2>
            <p className="text-sm text-muted-foreground">בדוק וערוך לפני שמירה סופית למבדקים.</p>
          </div>
          {!hasTable && <Badge variant="outline" className="border-warning text-warning">אין טבלת המרה מתאימה</Badge>}
        </div>
      </Card>

      <div className="space-y-2">
        {sorted.map(student => {
          const participant = session.participants[student.id];
          const grade = getGrade(participant);
          return (
            <Card key={student.id} className="rounded-2xl p-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_150px_120px_130px_120px] gap-3 items-center">
                <div>
                  <div className="font-bold">{formatStudentName(student)}</div>
                  <div className="text-xs text-muted-foreground">{participant.laps}/{session.setup.lapsRequired} הקפות</div>
                </div>
                <select value={participant.status} onChange={e => onEdit(student.id, { status: e.target.value, finishTimeMs: e.target.value === 'finished' ? participant.finishTimeMs || session.elapsedBeforePause : null })} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
                  {Object.entries(RUN_STATUS_LABELS).filter(([k]) => k !== 'running').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <Input type="number" min="0" value={participant.laps} onChange={e => onEdit(student.id, { laps: Number(e.target.value || 0) })} className="h-10 text-center" />
                <div className="font-mono font-bold text-left" dir="ltr">{participant.finishTimeMs ? formatRunTime(participant.finishTimeMs) : '—'}</div>
                <div className="text-center font-bold text-primary">{grade}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-16 md:bottom-0 bg-background/90 backdrop-blur border-t border-border py-3 flex gap-2">
        <Button variant="outline" onClick={onBack} className="h-12 flex-1"><ArrowRight className="w-4 h-4" /> חזרה לעריכה</Button>
        <Button onClick={onSave} className="h-12 flex-[2] font-bold btn-3d"><Save className="w-4 h-4" /> שמור למבדקים</Button>
      </div>
    </div>
  );
}