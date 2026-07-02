import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, PenLine } from 'lucide-react';
import { formatStudentName } from '@/lib/studentName';

export default function MissingClassCard({ cls, testGroups, totalMissing }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card-3d rounded-2xl overflow-hidden" dir="rtl">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-2 px-4 py-3 text-right">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-[15px] truncate">{cls.name}</span>
          <span className="shrink-0 rounded-full bg-destructive/10 text-destructive text-[11px] font-black px-2.5 py-0.5">
            {totalMissing} חוסרים
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-3">
          {testGroups.map(group => (
            <div key={group.test.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-muted-foreground">{group.test.name} · {group.students.length} תלמידים</span>
                <Link to={`/class/${cls.id}/tests`} className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline shrink-0">
                  <PenLine className="w-3 h-3" />
                  להזנה
                </Link>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-start">
                {group.students.map(s => (
                  <Link key={s.id} to={`/class/${cls.id}/student/${s.id}`} className="rounded-lg bg-muted px-2 py-0.5 text-[11px] font-semibold hover:bg-secondary transition-colors">
                    {formatStudentName(s)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}