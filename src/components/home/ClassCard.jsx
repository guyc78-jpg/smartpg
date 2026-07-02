import { Link } from 'react-router-dom';
import { Trash2, Edit2, UserCheck, Archive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GENDER_TRACK_LABELS } from '@/lib/types';

export default function ClassCard({ cls, studentCount, onEdit, onDelete, onArchive }) {
  return (
    <div dir="rtl" className="rounded-2xl bg-card shadow-sm p-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1 justify-start overflow-hidden">
        <Link to={`/class/${cls.id}`} className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary" title="נוכחות">
          <UserCheck className="w-4 h-4" />
        </Link>
        <div className="text-right min-w-0">
          <div className="flex items-center gap-2 justify-start overflow-x-auto no-scrollbar">
            <span className="whitespace-nowrap font-bold text-[15px]">{cls.name}</span>
            <Badge variant="secondary" className="shrink-0 text-[10px]">{GENDER_TRACK_LABELS[cls.genderTrack] || 'בנים'}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">{studentCount} תלמידים</div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(cls)} className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => onArchive(cls)} className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary" title="ארכוב">
          <Archive className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(cls)} className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}