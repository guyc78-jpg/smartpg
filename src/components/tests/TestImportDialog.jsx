import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { GRADE_LEVELS } from '@/lib/types';

export default function TestImportDialog({ open, onOpenChange, tests, defaultGradeLevel, onConfirm, importing }) {
  const [gradeLevel, setGradeLevel] = useState(defaultGradeLevel || 'ז');
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (open) {
      setGradeLevel(defaultGradeLevel || 'ז');
      setSelected(new Set(tests.map((_, i) => i)));
    }
  }, [open, tests, defaultGradeLevel]);

  const toggle = (i) => {
    setSelected(current => {
      const next = new Set(current);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const confirm = () => {
    const chosen = tests.filter((_, i) => selected.has(i)).map(t => ({ ...t, gradeLevel }));
    onConfirm(chosen);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-[420px] rounded-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="text-right">
          <DialogTitle className="text-right">ייבוא מבדקים מקובץ</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 justify-start">
          <span className="text-sm font-bold">שכבה:</span>
          <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="h-9 rounded-xl liquid-field px-3 text-sm">
            {GRADE_LEVELS.map(gl => <option key={gl} value={gl}>{gl}׳</option>)}
          </select>
        </div>

        <p className="text-xs text-primary font-medium text-right">
          נמצאו {tests.length} מבדקים. בחר אילו לייבא:
        </p>

        <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
          {tests.map((test, i) => {
            const isSelected = selected.has(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                className={`w-full rounded-xl border p-3 flex items-center gap-3 text-right transition-colors ${isSelected ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}
              >
                {isSelected
                  ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  : <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />}
                <div className="min-w-0 flex-1 text-right">
                  <div className="font-bold text-sm truncate">{test.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {test.conversionTable.length} שורות בטבלת המרה{test.genderTrack === 'girls' ? ' • בנות' : ' • בנים'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <Button onClick={confirm} disabled={selected.size === 0 || importing} className="w-full h-11 rounded-xl font-bold">
          {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {importing ? 'מייבא…' : `ייבא ${selected.size} מבדקים`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}