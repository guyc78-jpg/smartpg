import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown, Plus, Trash2, Users } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { useAuth } from '@/lib/AuthContext';
import BottomNav from '@/components/app/BottomNav';
import HomeHeader from '@/components/home/HomeHeader';
import ClassCard from '@/components/home/ClassCard';
import TodayPeHeader from '@/components/home/TodayPeHeader';
import QuickActionsGrid from '@/components/home/QuickActionsGrid';
import RiskAlertsCard from '@/components/home/RiskAlertsCard';
import DailyPeSchedule from '@/components/schedule/DailyPeSchedule';
import AddClassDialog from '@/components/app/AddClassDialog';
import EditClassDialog from '@/components/app/EditClassDialog';
import ConfirmDeleteDialog from '@/components/app/ConfirmDeleteDialog';

export default function HomePage() {
  const { data, addClass, addStudent, editClass, deleteClass, archiveClass, deleteAllData, defaultGenderTrack } = useApp();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [myClassesOpen, setMyClassesOpen] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const activeClasses = useMemo(() => (data.classes || []).filter(c => (c.status || 'active') === 'active'), [data.classes]);
  const classById = useMemo(() => Object.fromEntries(data.classes.map(c => [c.id, c])), [data.classes]);
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todaysLessons = useMemo(
    () => (data.scheduleLessons || []).filter(l => l.dayOfWeek === new Date().getDay()),
    [data.scheduleLessons]
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

  const handleArchiveClass = async (cls) => {
    await archiveClass(cls.id);
    toast.success('הכיתה הועברה לארכיון');
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

      <main className="flex-1 px-4 pb-[calc(72px+env(safe-area-inset-bottom,0px))] space-y-3">
        <TodayPeHeader todaysLessons={todaysLessons} classById={classById} />

        <QuickActionsGrid />

        <RiskAlertsCard />

        <DailyPeSchedule lessons={todaysLessons} classById={classById} lessonTopics={data.lessonTopics} dateIso={todayIso} />

        <div className="flex items-center justify-between px-1 pt-2">
          <button onClick={() => setMyClassesOpen(o => !o)} className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
            <Users className="w-4 h-4" />
            הכיתות שלי
            <ChevronDown className={`w-4 h-4 transition-transform ${myClassesOpen ? '' : '-rotate-90'}`} />
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => setAddOpen(true)} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary" title="הוסף כיתה">
              <Plus className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button onClick={() => setDeleteAllOpen(true)} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="מחק הכל">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {myClassesOpen && (
          <div className="space-y-2">
            {activeClasses.map(cls => (
              <ClassCard
                key={cls.id}
                cls={cls}
                studentCount={studentCountByClass[cls.id] || 0}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                onArchive={handleArchiveClass}
              />
            ))}
            {activeClasses.length === 0 && (
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
        description="מחיקת הכיתה תמחק גם את כל התלמידים, הנוכחות, הציונים והרשומות המשויכים אליה לצמיתות. האם להמשיך?"
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