import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { GRADE_LEVELS, GENDER_TRACK_LABELS } from '@/lib/types';

export default function CopyTestsDialog({ open, onOpenChange, allTests, defaultTargetGrade, onConfirm }) {
  const [targetGrade, setTargetGrade] = useState(defaultTargetGrade || 'ז');
  const [selected, setSelected] = useState(new Set());
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (open) {
      setTargetGrade(defaultTargetGrade || 'ז');
      setSelected(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const sourceTests = (allTests || []).filter(t => t.gradeLevel !== targetGrade);

  const toggle = (id) => {
    setSelected(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirm = async () => {
    const chosen = sourceTests
      .filter(t => selected.has(t.id))
      .map(t => ({ ...t, id: undefined, gradeLevel: targetGrade, classId: '' }));
    setCopying(true);
    try {
      await onConfirm(chosen);
      onOpenChange(false);
    } finally {
      setCopying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-[420px] rounded-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="text-right">
          <DialogTitle className="text-right">העתקת מבדקים משכבה אחרת</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          <span className="text-sm font-bold block text-right">העתקה לשכבה:</span>
          <div className="grid grid-cols-6 gap-1.5" dir="rtl">
            {GRADE_LEVELS.map(gl => (
              <button
                key={gl}
                type="button"
                onClick={() => { setTargetGrade(gl); setSelected(new Set()); }}
                className={`h-9 rounded-full text-xs font-bold liquid-chip ${targetGrade === gl ? 'liquid-chip-active' : ''}`}
              >
                {gl}׳
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-primary font-medium text-right">
          בחר מבדקים קיימים משכבות אחרות להעתקה לשכבה {targetGrade}׳:
        </p>

        <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
          {sourceTests.map(test => {
            const isSelected = selected.has(test.id);
            return (
              <button
                key={test.id}
                type="button"
                onClick={() => toggle(test.id)}
                className={`w-full rounded-xl border p-3 flex items-center gap-3 text-right transition-colors ${isSelected ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}
              >
                {isSelected
                  ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  : <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />}
                <div className="min-w-0 flex-1 text-right">
                  <div className="font-bold text-sm truncate">{test.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    שכבה {test.gradeLevel}׳ • {GENDER_TRACK_LABELS[test.genderTrack || 'boys']} • {test.conversionTable?.length || 0} שורות המרה
                  </div>
                </div>
              </button>
            );
          })}
          {sourceTests.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">אין מבדקים בשכבות אחרות להעתקה</p>
          )}
        </div>

        <Button onClick={confirm} disabled={selected.size === 0 || copying} className="w-full h-11 rounded-xl font-bold">
          {copying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {copying ? 'מעתיק…' : `העתק ${selected.size} מבדקים לשכבה ${targetGrade}׳`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}