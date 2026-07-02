import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pencil, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';

const ROLE_LABELS = { all: 'כל המשתמשים', admin: 'מנהלים', user: 'משתמשים' };

export default function WizardCard({ wizard, isAdmin, completed, onStart, onEdit, onDelete }) {
  return (
    <div className="card-3d rounded-3xl p-4 space-y-3 text-right" dir="rtl">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-foreground truncate">{wizard.title}</h3>
          {wizard.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{wizard.description}</p>
          )}
        </div>
        {completed && <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="rounded-full">{(wizard.steps || []).length} שלבים</Badge>
        {isAdmin && (
          <>
            <Badge variant="outline" className="rounded-full">{ROLE_LABELS[wizard.role] || wizard.role}</Badge>
            {!wizard.is_enabled && <Badge variant="destructive" className="rounded-full">כבוי</Badge>}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" className="rounded-xl flex-1" onClick={onStart} disabled={!(wizard.steps || []).length}>
          {completed ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {completed ? 'הפעל שוב' : 'התחל סיור'}
        </Button>
        {isAdmin && (
          <>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={onEdit} aria-label="עריכה">
              <Pencil className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl text-destructive" onClick={onDelete} aria-label="מחיקה">
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}