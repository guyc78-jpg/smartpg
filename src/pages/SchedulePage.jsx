import { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import ImportScheduleDialog from '@/components/schedule/ImportScheduleDialog';
import WeeklyScheduleGrid from '@/components/schedule/WeeklyScheduleGrid';
import LiveNowBanner from '@/components/schedule/LiveNowBanner';
import DailyLessonJournal from '@/components/schedule/DailyLessonJournal';
import AssignLessonDialog from '@/components/schedule/AssignLessonDialog';
import DeleteScheduleDialog from '@/components/schedule/DeleteScheduleDialog';
import ConfirmDeleteDialog from '@/components/app/ConfirmDeleteDialog';
import { Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { toLocalISODate } from '@/lib/dateTime';

export default function SchedulePage() {
  const { data, loadAll, importSchedule, deleteClass } = useApp();
  const [tab, setTab] = useState('grid');
  const [dateIso, setDateIso] = useState(() => toLocalISODate());
  const [assignSlot, setAssignSlot] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lessonTopics, setLessonTopics] = useState([]);
  const [orphanClass, setOrphanClass] = useState(null);

  const fetchTopics = useCallback(async () => {
    const rows = await base44.entities.LessonTopic.list('-date');
    setLessonTopics((rows || []).filter(r => !r.is_template).map(r => ({
      id: r.id, classId: r.class_id, date: r.date, period: r.period, topic: r.topic || '',
    })));
  }, []);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('import') === '1') setImportOpen(true);
  }, []);

  const classById = useMemo(() => Object.fromEntries(data.classes.map(c => [c.id, c])), [data.classes]);

  const handleCellClick = (day, period, lesson) => setAssignSlot({ day, period, lesson });

  const handleAssignSave = async (classId) => {
    const cls = classById[classId];
    if (assignSlot.lesson) {
      await base44.entities.TeacherSchedule.update(assignSlot.lesson.id, { class_id: classId, class_name: cls?.name || '' });
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

  const handleAssignDelete = async () => {
    const deletedLesson = assignSlot.lesson;
    await base44.entities.TeacherSchedule.delete(deletedLesson.id);
    setAssignSlot(null);
    await loadAll();
    toast.success('השיעור הוסר מהמערכת');
    // Two-way sync: if this was the class's last lesson in the schedule, offer to delete the class too
    const cid = deletedLesson.classId;
    if (cid && classById[cid]) {
      const remaining = data.scheduleLessons.filter(l => l.classId === cid && l.id !== deletedLesson.id);
      if (remaining.length === 0) setOrphanClass(classById[cid]);
    }
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
            <LiveNowBanner scheduleLessons={data.scheduleLessons} classById={classById} />
            <WeeklyScheduleGrid
              scheduleLessons={data.scheduleLessons}
              classById={classById}
              onCellClick={handleCellClick}
            />
          </section>
        ) : (
          <section id="schedule-journal-panel" role="tabpanel" aria-labelledby="schedule-journal-tab">
            <DailyLessonJournal
              dateIso={dateIso}
              onDateChange={setDateIso}
              scheduleLessons={data.scheduleLessons}
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
          classes={data.classes}
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

        <ConfirmDeleteDialog
          open={!!orphanClass}
          onOpenChange={(v) => { if (!v) setOrphanClass(null); }}
          title={`למחוק את כיתה ${orphanClass?.name || ''} מהדשבורד?`}
          description="הכיתה לא מופיעה יותר במערכת השעות. מחיקה תסיר אותה מהדשבורד כולל התלמידים והציונים שלה. לא ניתן לבטל פעולה זו."
          confirmLabel="מחק כיתה"
          onConfirm={async () => {
            await deleteClass(orphanClass.id);
            toast.success(`כיתה ${orphanClass.name} נמחקה מהדשבורד`);
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
