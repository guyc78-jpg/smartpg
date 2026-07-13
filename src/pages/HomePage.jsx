import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Archive, ChevronDown, RotateCcw, Users } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { useAuth } from '@/lib/AuthContext';
import BottomNav from '@/components/app/BottomNav';
import HomeHeader from '@/components/home/HomeHeader';
import HomeStatsBar from '@/components/home/HomeStatsBar';
import ClassCard from '@/components/home/ClassCard';
import DailyScheduleCard from '@/components/home/DailyScheduleCard';
import GradeFilterPills from '@/components/home/GradeFilterPills';
import HomeActionButtons from '@/components/home/HomeActionButtons';
import RiskAlertsCard from '@/components/home/RiskAlertsCard';
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
  const { data, addClass, addStudent, editClass, deleteClass, archiveClass, restoreClass, deleteAllData, updateHomeroomContacts, defaultGenderTrack } = useApp();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [myClassesOpen, setMyClassesOpen] = useState(true);
  const [archiveOpen, setArchiveOpen] = useState(false);
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
  const archivedClasses = useMemo(() => (data.classes || [])
    .filter(c => c.status === 'archived')
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he', { numeric: true })), [data.classes]);
  const activeStudentCount = useMemo(() => {
    const activeClassIds = new Set(activeClasses.map(cls => cls.id));
    return (data.students || []).filter(student => activeClassIds.has(student.classId)).length;
  }, [activeClasses, data.students]);
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

  const studentsByClass = useMemo(() => {
    const map = {};
    (data.students || []).forEach(student => {
      if (!map[student.classId]) map[student.classId] = [];
      map[student.classId].push(student);
    });
    Object.values(map).forEach(items => items.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he')));
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

  const handleRestoreClass = async (cls) => {
    try {
      await restoreClass(cls.id);
      toast.success(`כיתה ${cls.name} שוחזרה`);
    } catch (error) {
      console.error('Failed to restore class', error);
      toast.error('שחזור הכיתה נכשל');
    }
  };

  const handleArchiveClass = async (cls) => {
    try {
      await archiveClass(cls.id);
      toast.success('הכיתה הועברה לארכיון', {
        action: {
          label: 'בטל',
          onClick: () => handleRestoreClass(cls),
        },
      });
    } catch (error) {
      console.error('Failed to archive class', error);
      toast.error('העברת הכיתה לארכיון נכשלה');
    }
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
        <HomeStatsBar classCount={activeClasses.length} studentCount={activeStudentCount} />
        <DailyScheduleCard scheduleLessons={data.scheduleLessons || []} classById={classById} />
        <RiskAlertsCard />

        <GradeFilterPills selected={gradeFilter} onSelect={setGradeFilter} />

        <HomeActionButtons
          onAddClass={() => setAddOpen(true)}
          onDeleteAll={() => setDeleteAllOpen(true)}
          isAdmin={isAdmin}
        />

        <div className="flex items-center justify-start pt-1">
          <button
            type="button"
            onClick={() => setMyClassesOpen(o => !o)}
            aria-expanded={myClassesOpen}
            aria-controls="my-classes-list"
            className="flex min-h-11 items-center gap-2 px-3 py-2 rounded-full border border-border/60 bg-card/70 text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Users className="w-4 h-4 text-primary" aria-hidden="true" />
            הכיתות שלי
            <ChevronDown aria-hidden="true" className={`w-4 h-4 text-muted-foreground transition-transform ${myClassesOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>

        {myClassesOpen && (
          <div id="my-classes-list" className="space-y-2">
            {visibleClasses.map(cls => (
              <ClassCard
                key={cls.id}
                cls={cls}
                students={studentsByClass[cls.id] || []}
                studentCount={studentCountByClass[cls.id] || 0}
                isAdmin={isAdmin}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                onArchive={handleArchiveClass}
                onSaveEducators={updateHomeroomContacts}
              />
            ))}
            {visibleClasses.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-10">
                {gradeFilter ? 'אין כיתות בשכבה זו.' : 'אין כיתות להצגה. הוסף כיתה כדי להתחיל.'}
              </p>
            )}
          </div>
        )}

        {archivedClasses.length > 0 && (
          <section className="rounded-2xl border border-border/60 bg-card/55 overflow-hidden" aria-labelledby="archive-title">
            <button
              type="button"
              onClick={() => setArchiveOpen(value => !value)}
              aria-expanded={archiveOpen}
              aria-controls="archived-classes-list"
              className="min-h-11 w-full flex items-center gap-2 px-3 py-2 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <Archive className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span id="archive-title" className="font-bold text-sm">ארכיון כיתות</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-black text-muted-foreground">{archivedClasses.length}</span>
              <ChevronDown className={`mr-auto h-4 w-4 text-muted-foreground transition-transform ${archiveOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {archiveOpen && (
              <div id="archived-classes-list" className="border-t border-border/50 p-2 space-y-1.5">
                {archivedClasses.map(cls => (
                  <div key={cls.id} className="min-h-12 flex items-center gap-2 rounded-xl bg-background/60 px-3 py-1.5">
                    <div className="min-w-0 flex-1 text-right">
                      <p className="truncate text-sm font-bold">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">{studentCountByClass[cls.id] || 0} תלמידים</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreClass(cls)}
                      className="min-h-11 shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`שחזור כיתה ${cls.name}`}
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" /> שחזר
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
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
