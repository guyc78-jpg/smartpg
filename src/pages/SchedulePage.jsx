import { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import ImportScheduleDialog from '@/components/schedule/ImportScheduleDialog';
import WeeklyScheduleGrid from '@/components/schedule/WeeklyScheduleGrid';
import LiveNowBanner from '@/components/schedule/LiveNowBanner';
import DailyLessonJournal from '@/components/schedule/DailyLessonJournal';
import AssignLessonDialog from '@/components/schedule/AssignLessonDialog';
import DeleteScheduleDialog from '@/components/schedule/DeleteScheduleDialog';
import { Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SchedulePage() {
  const { data, loadAll, importSchedule } = useApp();
  const [tab, setTab] = useState('grid');
  const [dateIso, setDateIso] = useState(new Date().toISOString().slice(0, 10));
  const [assignSlot, setAssignSlot] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lessonTopics, setLessonTopics] = useState([]);

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
    await base44.entities.TeacherSchedule.delete(assignSlot.lesson.id);
    setAssignSlot(null);
    await loadAll();
    toast.success('השיעור הוסר מהמערכת');
  };

  return (
    <Layout title="מערכת שעות" titleAction={
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => setImportOpen(true)} className="h-8 w-8 p-0" aria-label="ייבוא מערכת">
          <Upload className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)} className="h-8 w-8 p-0 text-destructive hover:text-destructive" aria-label="מחיקת כל המערכת">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    }>
      <div className="max-w-3xl mx-auto p-4 space-y-4" dir="rtl">
        <div className="grid grid-cols-2 rounded-2xl bg-muted/60 p-1 gap-1">
          <button
            type="button"
            onClick={() => setTab('grid')}
            className={`h-10 rounded-xl text-sm font-bold transition-all ${tab === 'grid' ? 'bg-card shadow text-foreground' : 'text-primary/80 hover:text-primary'}`}
          >
            מערכת שעות
          </button>
          <button
            type="button"
            onClick={() => setTab('journal')}
            className={`h-10 rounded-xl text-sm font-bold transition-all ${tab === 'journal' ? 'bg-card shadow text-foreground' : 'text-primary/80 hover:text-primary'}`}
          >
            יומן שיעורים
          </button>
        </div>

        {tab === 'grid' ? (
          <>
            <LiveNowBanner scheduleLessons={data.scheduleLessons} classById={classById} />
            <WeeklyScheduleGrid
              scheduleLessons={data.scheduleLessons}
              classById={classById}
              onCellClick={handleCellClick}
            />
          </>
        ) : (
          <DailyLessonJournal
            dateIso={dateIso}
            onDateChange={setDateIso}
            scheduleLessons={data.scheduleLessons}
            classById={classById}
            lessonTopics={lessonTopics}
            onAssign={(day, period) => setAssignSlot({ day, period, lesson: null })}
          />
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
            await base44.entities.TeacherSchedule.deleteMany({ day_of_week: { $gte: 0 } });
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