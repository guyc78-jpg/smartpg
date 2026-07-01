import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QUARTER_LABELS } from '@/lib/types';

const QUARTERS = ['parentA', 'semesterA', 'parentB', 'semesterB'];

export default function BehaviorSection({ studentId, behaviorGrades, onSave }) {
  const getGrade = (quarter) => behaviorGrades.find(b => b.studentId === studentId && b.quarter === quarter)?.grade ?? '';

  const handleChange = (quarter, value) => {
    const num = value === '' ? null : Number(value);
    if (num !== null && (num < 0 || num > 100)) return;
    onSave(studentId, quarter, num);
  };

  return (
    <Card className="card-3d rounded-2xl p-3 space-y-2">
      <div className="font-bold text-sm">ציוני התנהגות</div>
      <div className="grid grid-cols-2 gap-2">
        {QUARTERS.map(quarter => (
          <div key={quarter} className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">{QUARTER_LABELS[quarter]}</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={getGrade(quarter)}
              onChange={e => handleChange(quarter, e.target.value)}
              className="h-8 text-sm"
              placeholder="—"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}