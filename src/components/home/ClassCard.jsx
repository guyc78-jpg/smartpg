import { Link } from 'react-router-dom';
import { Trash2, Edit2, UserCheck, Archive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GENDER_TRACK_LABELS } from '@/lib/types';
import EducatorContactButton from '@/components/home/EducatorContactButton';

export default function ClassCard({ cls, students, studentCount, isAdmin, onEdit, onDelete, onArchive, onSaveEducators }) {
  return (
    <div dir="rtl" className="rounded-2xl bg-card border border-border/70 shadow-sm p-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 min-w-0 flex-1 justify-start overflow-hidden">
        <Link
          to={`/class/${cls.id}/attendance`}
          aria-label={`נוכחות בכיתה ${cls.name}`}
          className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserCheck className="w-4 h-4" aria-hidden="true" />
        </Link>
        <Link to={`/class/${cls.id}`} className="text-right min-w-0 block">
          <div className="flex items-center gap-2 justify-start overflow-x-auto no-scrollbar">
            <span className="whitespace-nowrap font-bold text-[15px]">{cls.name}</span>
            <Badge variant="secondary" className="shrink-0 text-[10px]">{GENDER_TRACK_LABELS[cls.genderTrack] || 'בנים'}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">{studentCount} תלמידים</div>
        </Link>
      </div>

      <div className="flex items-center justify-end gap-1 shrink-0">
        <EducatorContactButton cls={cls} students={students} isAdmin={isAdmin} onSaveContacts={contacts => onSaveEducators(cls.id, contacts)} />
        <button type="button" onClick={() => onEdit(cls)} aria-label={`עריכת כיתה ${cls.name}`} className="h-11 w-11 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Edit2 className="w-4 h-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => onArchive(cls)} aria-label={`העברת כיתה ${cls.name} לארכיון`} className="h-11 w-11 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Archive className="w-4 h-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => onDelete(cls)} aria-label={`מחיקת כיתה ${cls.name}`} className="h-11 w-11 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
