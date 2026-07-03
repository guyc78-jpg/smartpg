import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown, Users } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { useAuth } from '@/lib/AuthContext';
import BottomNav from '@/components/app/BottomNav';
import HomeHeader from '@/components/home/HomeHeader';
import HomeStatsBar from '@/components/home/HomeStatsBar';
import ClassCard from '@/components/home/ClassCard';
import DailyScheduleCard from '@/components/home/DailyScheduleCard';
import GradeFilterPills from '@/components/home/GradeFilterPills';
import HomeActionButtons from '@/components/home/HomeActionButtons';
import AddClassDialog from '@/components/app/AddClassDialog';
import EditClassDialog from '@/components/app/EditClassDialog';
import ConfirmDeleteDialog from '@/components/app/ConfirmDeleteDialog';
import { GRADE_LEVELS } from '@/lib/types';

const classGradeOf = (c) => {
  if (c.gradeLevel) return c.gradeLevel;
  const match = (c.name || '').replace(/["'׳״]/g, '').trim().match(/^([א-ת]+)/);
  return match ? match[1] : '';
};

export default function HomePage() {
  const { data, addClass, addStudent, editClass, deleteClass, archiveClass, deleteAllData, defaultGenderTrack } = useApp();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [myClassesOpen, setMyClassesOpen] = useState(true);
  const [gradeFilter, setGradeFilter] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const activeClasses = useMemo(() => {
    const gradeIdx = c => {
      const i = GRADE_LEVELS.indexOf(classGradeOf(c));
      return i === -1 ? 99 : i;
    };
    const numOf = c => {
      const m = (c.name || '').match(/\d+/);
      return m ? Number(m[0]) : 0;
    };
    return (data.classes || [])
      .filter(c => (c.status || 'active') === 'active')
      .sort((a, b) => gradeIdx(a) - gradeIdx(b) || numOf(a) - numOf(b) || (a.name || '').localeCompare(b.name || '', 'he'));
  }, [data.classes]);
  const classById = useMemo(() => Object.fromEntries(data.classes.map(c => [c.id, c])), [data.classes]);

  const visibleClasses = useMemo(() => {
    if (!gradeFilter) return activeClasses;
    return activeClasses.filter(c => classGradeOf(c) === gradeFilter);
  }, [activeClasses, gradeFilter]);

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
      <HomeHeader />

      <main className="flex-1 px-4 pt-2 pb-[calc(72px+env(safe-area-inset-bottom,0px))] space-y-3">
        <HomeStatsBar classCount={activeClasses.length} studentCount={data.students.length} />
        <DailyScheduleCard scheduleLessons={data.scheduleLessons || []} classById={classById} />

        <GradeFilterPills selected={gradeFilter} onSelect={setGradeFilter} />

        <HomeActionButtons
          onAddClass={() => setAddOpen(true)}
          onDeleteAll={() => setDeleteAllOpen(true)}
          isAdmin={isAdmin}
        />

        <div className="flex items-center justify-start pt-1">
          <button
            onClick={() => setMyClassesOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-card/70 text-sm font-bold text-foreground"
          >
            <Users className="w-4 h-4 text-primary" />
            הכיתות שלי
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${myClassesOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>

        {myClassesOpen && (
          <div className="space-y-2">
            {visibleClasses.map(cls => (
              <ClassCard
                key={cls.id}
                cls={cls}
                studentCount={studentCountByClass[cls.id] || 0}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                onArchive={handleArchiveClass}
              />
            ))}
            {visibleClasses.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-10">
                {gradeFilter ? 'אין כיתות בשכבה זו.' : 'אין כיתות להצגה. הוסף כיתה כדי להתחיל.'}
              </p>
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
        description="מחיקת הכיתה תמחק גם את כל התלמידים, הציונים והרשומות המשויכים אליה לצמיתות. האם להמשיך?"
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