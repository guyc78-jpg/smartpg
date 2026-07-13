import { useMemo, useState } from 'react';
import { Check, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { displayRunStudentName } from './runUtils';
import { isEligibleRunStudent } from './runSetupUtils';

export default function EditParticipants({ classStudents, snapshot, selectedIds, onConfirm, onCancel }) {
  const students = useMemo(() => {
    const byId = new Map(classStudents.filter(isEligibleRunStudent).map(s => [s.id, s]));
    for (const id of selectedIds) {
      if (!byId.has(id) && isEligibleRunStudent(snapshot?.[id])) byId.set(id, snapshot[id]);
    }
    return [...byId.values()].sort((a, b) => displayRunStudentName(a).localeCompare(displayRunStudentName(b), 'he'));
  }, [classStudents, snapshot, selectedIds]);

  const [ids, setIds] = useState(() => selectedIds.filter(id => students.some(student => student.id === id)));
  const allSelected = students.length > 0 && ids.length === students.length;
  const toggle = (id) => setIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="w-full max-w-[520px] mx-auto px-3 pt-3 pb-40 space-y-3 overflow-x-hidden" dir="rtl">
      <div className="flex items-center justify-between text-sm font-bold">
        <span className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> משתתפים בריצה ({ids.length}/{students.length})</span>
        <button type="button" onClick={() => setIds(allSelected ? [] : students.map(s => s.id))} className="text-xs font-semibold text-primary hover:underline">
          {allSelected ? 'נקה הכל' : 'בחר הכל'}
        </button>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        {students.map(student => {
          const checked = ids.includes(student.id);
          return (
            <button
              type="button"
              key={student.id}
              onClick={() => toggle(student.id)}
              className="w-full h-11 flex items-center justify-between gap-2 px-3 border-b last:border-0 text-right hover:bg-muted/40 transition-colors"
            >
              <span className={`text-sm font-semibold truncate ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>
                {displayRunStudentName(student)}
              </span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${checked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 bg-transparent'}`}>
                {checked && <Check className="w-4 h-4" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
        {students.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">אין תלמידים להצגה.</div>}
      </div>

      <div className="fixed inset-x-0 z-40 px-4 bottom-[calc(80px+env(safe-area-inset-bottom,0px))] md:bottom-4">
        <div className="w-full max-w-[520px] mx-auto flex gap-2">
          <Button onClick={() => onConfirm(students.filter(s => ids.includes(s.id)))} disabled={ids.length === 0} className="flex-1 h-14 rounded-2xl text-lg font-black btn-3d">
            <Check className="w-5 h-5" /> עדכן משתתפים ({ids.length})
          </Button>
          <Button variant="outline" onClick={onCancel} className="h-14 px-5 rounded-2xl font-bold">
            <X className="w-4 h-4" /> ביטול
          </Button>
        </div>
      </div>
    </div>
  );
}
