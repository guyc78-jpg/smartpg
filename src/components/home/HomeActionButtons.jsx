import { Link } from 'react-router-dom';
import { Plus, Timer, Trash2 } from 'lucide-react';

export default function HomeActionButtons({ onAddClass, onDeleteAll, isAdmin }) {
  return (
    <div className={`grid gap-2 ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`} dir="rtl">
      <button
        onClick={onAddClass}
        className="btn-3d h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        הוסף כיתה
      </button>
      <Link
        to="/live-run"
        className="btn-3d h-11 rounded-xl border border-primary/30 bg-card/70 text-primary text-sm font-bold flex items-center justify-center gap-1.5"
      >
        <Timer className="w-4 h-4" />
        ריצה Live
      </Link>
      {isAdmin && (
        <button
          onClick={onDeleteAll}
          className="h-11 rounded-xl border border-destructive/40 bg-destructive/5 text-destructive text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          מחק הכל
        </button>
      )}
    </div>
  );
}