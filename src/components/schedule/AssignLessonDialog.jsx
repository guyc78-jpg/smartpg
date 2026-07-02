import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { formatPeriodRange } from '@/lib/periodTimes';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function AssignLessonDialog({ open, onOpenChange, slot, classes, onSave, onDelete }) {
  const [classId, setClassId] = useState('');

  useEffect(() => {
    if (open) setClassId(slot?.lesson?.classId || '');
  }, [open, slot]);

  if (!slot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px] rounded-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-right">
            {slot.lesson ? 'עריכת שיעור במערכת' : 'שיבוץ שיעור'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl bg-muted/50 p-3 text-sm font-semibold flex items-center justify-between">
            <span>יום {DAY_NAMES[slot.day]} · שעה {slot.period}</span>
            <span className="font-mono text-muted-foreground" dir="ltr">{formatPeriodRange(slot.period, slot.day)}</span>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">כיתה</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="h-11 text-sm"><SelectValue placeholder="בחר כיתה" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onSave(classId)} disabled={!classId} className="flex-1 h-11 rounded-xl font-bold">
              {slot.lesson ? 'עדכן שיעור' : 'שבץ שיעור'}
            </Button>
            {slot.lesson && (
              <Button variant="outline" onClick={onDelete} className="h-11 rounded-xl px-4 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}