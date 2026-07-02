import { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Plus, Compass } from 'lucide-react';
import WizardCard from '@/components/wizards/WizardCard';
import WizardPlayerDialog from '@/components/wizards/WizardPlayerDialog';
import WizardEditDialog from '@/components/wizards/WizardEditDialog';
import ConfirmDeleteDialog from '@/components/app/ConfirmDeleteDialog';

export default function WizardsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [wizards, setWizards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [completedMap, setCompletedMap] = useState({});

  const storageKey = useCallback((w) => `wizard_done_${user?.id}_${w.wizard_id}`, [user?.id]);

  const load = useCallback(async () => {
    const list = await base44.entities.WizardConfig.list('-created_date');
    setWizards(list);
    const map = {};
    for (const w of list) map[w.id] = localStorage.getItem(`wizard_done_${user?.id}_${w.wizard_id}`) === '1';
    setCompletedMap(map);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const visibleWizards = useMemo(() => {
    if (isAdmin) return wizards;
    return wizards.filter(w => w.is_enabled && (w.role === 'all' || w.role === user?.role));
  }, [wizards, isAdmin, user?.role]);

  const markCompleted = (wizard) => {
    localStorage.setItem(storageKey(wizard), '1');
    setCompletedMap(m => ({ ...m, [wizard.id]: true }));
  };

  const handleSave = async (data) => {
    if (editing) await base44.entities.WizardConfig.update(editing.id, data);
    else await base44.entities.WizardConfig.create(data);
    await load();
  };

  const handleDelete = async () => {
    await base44.entities.WizardConfig.delete(deleting.id);
    setWizards(ws => ws.filter(w => w.id !== deleting.id));
  };

  return (
    <Layout
      title="סיורי מערכת"
      subtitle="הדרכות צעד-אחר-צעד על תכונות המערכת"
      backTo="/"
      titleAction={isAdmin ? (
        <Button size="sm" className="rounded-xl" onClick={() => { setEditing(null); setEditOpen(true); }}>
          <Plus className="w-4 h-4" />
          סיור חדש
        </Button>
      ) : null}
    >
      <div className="p-4 max-w-2xl mx-auto" dir="rtl">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-loading-dot" />
              <span className="w-2 h-2 rounded-full bg-primary animate-loading-dot" style={{ animationDelay: '0.15s' }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-loading-dot" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        ) : visibleWizards.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Compass className="w-10 h-10 text-muted-foreground/50 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'עדיין אין סיורים. צרו סיור ראשון כדי להדריך משתמשים חדשים.' : 'אין כרגע סיורים זמינים עבורך.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleWizards.map(w => (
              <WizardCard
                key={w.id}
                wizard={w}
                isAdmin={isAdmin}
                completed={!!completedMap[w.id]}
                onStart={() => setPlaying(w)}
                onEdit={() => { setEditing(w); setEditOpen(true); }}
                onDelete={() => setDeleting(w)}
              />
            ))}
          </div>
        )}
      </div>

      <WizardPlayerDialog
        wizard={playing}
        open={!!playing}
        onOpenChange={(v) => !v && setPlaying(null)}
        onComplete={markCompleted}
      />
      <WizardEditDialog
        wizard={editing}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSave}
      />
      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="מחיקת סיור"
        description={`למחוק את הסיור "${deleting?.title}"? לא ניתן לבטל פעולה זו.`}
        onConfirm={handleDelete}
      />
    </Layout>
  );
}