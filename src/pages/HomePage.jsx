import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronDown, Calendar, Plus, Timer, Trash2, Users } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/app/BottomNav';
import HomeHeader from '@/components/home/HomeHeader';
import ClassCard from '@/components/home/ClassCard';
import AddClassDialog from '@/components/app/AddClassDialog';
import EditClassDialog from '@/components/app/EditClassDialog';
import ConfirmDeleteDialog from '@/components/app/ConfirmDeleteDialog';
import { GRADE_LEVELS } from '@/lib/types';

export default function HomePage() {
  const { data, addClass, addStudent, editClass, deleteClass, deleteAllData, defaultGenderTrack } = useApp();
  const [gradeFilter, setGradeFilter] = useState('all');
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const [myClassesOpen, setMyClassesOpen] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const activeClasses = useMemo(() => (data.classes || []).filter(c => (c.status || 'active') === 'active'), [data.classes]);

  const filteredClasses = useMemo(
    () => gradeFilter === 'all' ? activeClasses : activeClasses.filter(c => c.gradeLevel === gradeFilter),
    [activeClasses, gradeFilter]
  );

  const studentCountByClass = useMemo(() => {
    const map = {};
    (data.students || []).forEach(s => { map[s.classId] = (map[s.classId] || 0) + 1; });
    return map;
  }, [data.students]);

  const handleAddClass = async (classData, studentNames) => {
    const classId = await addClass(classData);
    for (const name of studentNames) {
      await addStudent({ name, classId }, classId);
    }
    toast.success('הכיתה נוספה');
  };

  const handleEditClass = async (id, classData) => {
    await editClass(id, classData);
    toast.success('הכיתה עודכנה');
  };

  const handleDeleteClass = async () => {
    await deleteClass(deleteTarget.id);
    toast.success('הכיתה נמחקה');
    setDeleteTarget(null);
  };

  const handleDeleteAll = async () => {
    await deleteAllData();
    toast.success('כל הנתונים נמחקו');
    setDeleteAllOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <HomeHeader classCount={activeClasses.length} studentCount={data.students.length} />

      <main className="flex-1 px-4 pb-24 space-y-3">
        <button onClick={() => setScheduleOpen(o => !o)} className="w-full flex items-center justify-between rounded-2xl bg-card shadow-sm px-4 py-3">
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${scheduleOpen ? '' : '-rotate-90'}`} />
          <span className="flex items-center gap-2 font-bold text-[15px]">
            מערכת יומית
            <Calendar className="w-4 h-4 text-primary" />
          </span>
        </button>

        {scheduleOpen && (
          <>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {[...GRADE_LEVELS].reverse().map(g => (
                <button
                  key={g}
                  onClick={() => setGradeFilter(gradeFilter === g ? 'all' : g)}
                  className={`shrink-0 h-10 px-4 rounded-full border text-sm font-bold ${gradeFilter === g ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground'}`}
                >
                  {g}׳
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => setAddOpen(true)} className="h-11 rounded-xl font-bold">
                <Plus className="w-4 h-4" /> הוסף כיתה
              </Button>
              <Link to="/live-run">
                <Button variant="outline" className="w-full h-11 rounded-xl font-bold border-primary/40 text-primary">
                  <Timer className="w-4 h-4" /> Live ריצה
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setDeleteAllOpen(true)} className="h-11 rounded-xl font-bold border-destructive/40 text-destructive">
                <Trash2 className="w-4 h-4" /> מחק הכל
              </Button>
            </div>
          </>
        )}

        <button onClick={() => setMyClassesOpen(o => !o)} className="w-full flex items-center justify-between px-1 py-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
            הכיתות שלי
            <ChevronDown className={`w-4 h-4 transition-transform ${myClassesOpen ? '' : '-rotate-90'}`} />
          </span>
        </button>

        {myClassesOpen && (
          <div className="space-y-2">
            {filteredClasses.map(cls => (
              <ClassCard
                key={cls.id}
                cls={cls}
                studentCount={studentCountByClass[cls.id] || 0}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
            {filteredClasses.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-10">אין כיתות להצגה. הוסף כיתה כדי להתחיל.</p>
            )}
          </div>
        )}
      </main>

      <BottomNav />

      <AddClassDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAddClass} defaultGenderTrack={defaultGenderTrack} />
      <EditClassDialog open={!!editTarget} onOpenChange={() => setEditTarget(null)} cls={editTarget} onSave={handleEditClass} />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={`מחיקת ${deleteTarget?.name || ''}`}
        description="מחיקת הכיתה תסיר אותה מהרשימה. תלמידים ורשומות קיימות לא יימחקו אוטומטית."
        onConfirm={handleDeleteClass}
      />
      <ConfirmDeleteDialog
        open={deleteAllOpen}
        onOpenChange={setDeleteAllOpen}
        title="מחיקת כל הנתונים"
        description="פעולה זו תמחק את כל הכיתות, התלמידים, המבדקים והציונים באפליקציה לצמיתות. האם להמשיך?"
        onConfirm={handleDeleteAll}
      />
    </div>
  );
}