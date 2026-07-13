import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import ImportScheduleDialog from '@/components/schedule/ImportScheduleDialog';
import WeeklyScheduleGrid from '@/components/schedule/WeeklyScheduleGrid';
import LiveNowBanner from '@/components/schedule/LiveNowBanner';
import DailyLessonJournal from '@/components/schedule/DailyLessonJournal';
import AssignLessonDialog from '@/components/schedule/AssignLessonDialog';
import DeleteScheduleDialog from '@/components/schedule/DeleteScheduleDialog';
import { Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { toLocalISODate } from '@/lib/dateTime';

export default function SchedulePage() {
  const { data, loadAll, importSchedule } = useApp();
  const [tab, setTab] = useState('grid');
  const [dateIso, setDateIso] = useState(() => toLocalISODate());
  const [assignSlot, setAssignSlot] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const lessonTopics = useMemo(
    () => (data.lessonTopics || []).filter(topic => !topic.isTemplate),
    [data.lessonTopics],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('import') === '1') setImportOpen(true);
  }, []);

  const classById = useMemo(() => Object.fromEntries(data.classes.map(c => [c.id, c])), [data.classes]);
  const activeClasses = useMemo(() => data.classes.filter(c => (c.status || 'active') === 'active'), [data.classes]);
  const activeClassIds = useMemo(() => new Set(activeClasses.map(c => c.id)), [activeClasses]);
  const visibleScheduleLessons = useMemo(
    () => data.scheduleLessons.filter(lesson => !lesson.classId || activeClassIds.has(lesson.classId)),
    [activeClassIds, data.scheduleLessons],
  );

  const handleCellClick = (day, period, lesson) => setAssignSlot({ day, period, lesson });

  const handleAssignSave = async (classId, selectedLesson) => {
    const cls = classById[classId];
    if (assignSlot.lesson) {
      const lessonToUpdate = selectedLesson || assignSlot.lesson;
      await base44.entities.TeacherSchedule.update(lessonToUpdate.id, { class_id: classId, class_name: cls?.name || '' });
    } else {
      await base44.entities.TeacherSchedule.create({
        day_of_week: assignSlot.day,
        period: assignSlot.period,
        class_id: classId,
        class_name: cls?.name || '',
        subject: 'חינוך גופני',
        source: 'manual',
      });
    }
    setAssignSlot(null);
    await loadAll();
    toast.success('המערכת עודכנה');
  };

  const handleAssignDelete = async (selectedLesson) => {
    const deletedLesson = selectedLesson || assignSlot?.lesson;
    if (!deletedLesson?.id) throw new Error('לא נמצא שיעור למחיקה.');
    try {
      await base44.entities.TeacherSchedule.delete(deletedLesson.id);
    } catch (error) {
      console.error('Failed to delete schedule lesson', error);
      throw new Error('מחיקת השיעור נכשלה. בדקו את החיבור ונסו שוב.', { cause: error });
    }
    setAssignSlot(null);
    try {
      const refreshed = await loadAll();
      if (refreshed === false) toast.warning('השיעור נמחק, אך רענון מערכת השעות נכשל. מומלץ לרענן את המסך.');
    } catch (error) {
      console.error('Failed to refresh schedule after deletion', error);
      toast.warning('השיעור נמחק, אך רענון מערכת השעות נכשל. מומלץ לרענן את המסך.');
    }
    toast.success('השיעור הוסר מהמערכת');
  };

  return (
    <Layout title="מערכת שעות" menuItems={[
      { label: 'ייבוא מערכת', icon: Upload, onClick: () => setImportOpen(true) },
      { label: 'מחיקת כל המערכת', icon: Trash2, destructive: true, onClick: () => setDeleteOpen(true) },
    ]}>
      <div className="max-w-3xl mx-auto p-4 space-y-4" dir="rtl">
        <div className="grid grid-cols-2 rounded-full liquid-pill p-1 gap-1" role="tablist" aria-label="תצוגת מערכת שעות">
          <button
            type="button"
            id="schedule-grid-tab"
            role="tab"
            aria-selected={tab === 'grid'}
            aria-controls="schedule-grid-panel"
            onClick={() => setTab('grid')}
            className={`h-11 rounded-full text-sm font-bold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tab === 'grid' ? 'liquid-chip-active' : 'text-muted-foreground hover:text-foreground'}`}
          >
            מערכת שעות
          </button>
          <button
            type="button"
            id="schedule-journal-tab"
            role="tab"
            aria-selected={tab === 'journal'}
            aria-controls="schedule-journal-panel"
            onClick={() => setTab('journal')}
            className={`h-11 rounded-full text-sm font-bold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tab === 'journal' ? 'liquid-chip-active' : 'text-muted-foreground hover:text-foreground'}`}
          >
            יומן שיעורים
          </button>
        </div>

        {tab === 'grid' ? (
          <section id="schedule-grid-panel" role="tabpanel" aria-labelledby="schedule-grid-tab" className="space-y-4">
            <LiveNowBanner scheduleLessons={visibleScheduleLessons} classById={classById} />
            <WeeklyScheduleGrid
              scheduleLessons={visibleScheduleLessons}
              classById={classById}
              onCellClick={handleCellClick}
            />
          </section>
        ) : (
          <section id="schedule-journal-panel" role="tabpanel" aria-labelledby="schedule-journal-tab">
            <DailyLessonJournal
              dateIso={dateIso}
              onDateChange={setDateIso}
              scheduleLessons={visibleScheduleLessons}
              classById={classById}
              lessonTopics={lessonTopics}
              onAssign={(day, period) => setAssignSlot({ day, period, lesson: null })}
            />
          </section>
        )}

        <AssignLessonDialog
          open={!!assignSlot}
          onOpenChange={() => setAssignSlot(null)}
          slot={assignSlot}
          classes={activeClasses}
          onSave={handleAssignSave}
          onDelete={handleAssignDelete}
        />

        <DeleteScheduleDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          lessonCount={data.scheduleLessons.length}
          onConfirm={async () => {
            let hasMore = true;
            while (hasMore) {
              const res = await base44.entities.TeacherSchedule.deleteMany({});
              hasMore = res?.has_more === true;
            }
            await loadAll();
            toast.success('מערכת השעות נמחקה');
          }}
        />

        <ImportScheduleDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImport={async (lessonsToImport) => {
            const result = await importSchedule(lessonsToImport);
            await loadAll();
            toast.success(`יובאו ${result.lessonsSaved} שיעורי חנ״ג, נוצרו ${result.classesCreated} כיתות חדשות`);
            return result;
          }}
        />
      </div>
    </Layout>
  );
}
