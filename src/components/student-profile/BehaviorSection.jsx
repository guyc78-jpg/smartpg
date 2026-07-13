import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QUARTER_LABELS } from '@/lib/types';
import { toast } from 'sonner';

const QUARTERS = ['parentA', 'semesterA', 'parentB', 'semesterB'];

export default function BehaviorSection({ studentId, behaviorGrades, onSave }) {
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState({});
  const getGrade = (quarter) => behaviorGrades.find(b => b.studentId === studentId && b.quarter === quarter)?.grade ?? '';

  useEffect(() => {
    setDrafts({});
    setSaving({});
  }, [studentId]);

  const handleChange = (quarter, value) => {
    const num = value === '' ? null : Number(value);
    if (num !== null && (num < 0 || num > 100)) return;
    setDrafts(current => ({ ...current, [quarter]: value }));
  };

  const handleSave = async (quarter) => {
    if (!Object.prototype.hasOwnProperty.call(drafts, quarter) || saving[quarter]) return;
    const value = drafts[quarter];
    const grade = value === '' ? null : Number(value);
    setSaving(current => ({ ...current, [quarter]: true }));
    try {
      await onSave(studentId, quarter, grade);
      setDrafts(current => {
        const next = { ...current };
        delete next[quarter];
        return next;
      });
    } catch (error) {
      console.error('Failed to save behavior grade', error);
      toast.error('שמירת ציון ההתנהגות נכשלה. הערך נשאר לעריכה ואפשר לנסות שוב.');
    } finally {
      setSaving(current => ({ ...current, [quarter]: false }));
    }
  };

  return (
    <Card className="card-3d rounded-2xl p-3 space-y-2">
      <div className="font-bold text-sm">ציוני התנהגות</div>
      <div className="grid grid-cols-2 gap-2">
        {QUARTERS.map(quarter => (
          <div key={quarter} className="space-y-1">
            <Label htmlFor={`behavior-grade-${quarter}`} className="text-[11px] text-muted-foreground">{QUARTER_LABELS[quarter]}</Label>
            <Input
              id={`behavior-grade-${quarter}`}
              aria-label={`ציון התנהגות ${QUARTER_LABELS[quarter]}`}
              type="number"
              min="0"
              max="100"
              value={Object.prototype.hasOwnProperty.call(drafts, quarter) ? drafts[quarter] : getGrade(quarter)}
              disabled={Boolean(saving[quarter])}
              aria-busy={Boolean(saving[quarter])}
              onChange={e => handleChange(quarter, e.target.value)}
              onBlur={() => handleSave(quarter)}
              onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}
              className="h-8 text-sm"
              placeholder="—"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
