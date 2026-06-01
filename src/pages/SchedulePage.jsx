import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmDeleteDialog from '@/components/app/ConfirmDeleteDialog';
import { GRADE_LEVELS, SEMESTER_LABELS } from '@/lib/types';
import { CalendarDays, ClipboardList, Copy, Edit2, Loader2, Plus, Save, Timer, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  classId: '',
  period: 1,
  semester: 'A',
  topic: '',
  location: '',
  objective: '',
  equipment: '',
  activityType: '',
  notes: '',
};

const ACTIVITY_TYPES = ['כושר גופני', 'משחקי כדור', 'אתלטיקה', 'ריצה', 'גמישות', 'חיזוק', 'מיומנות', 'אחר'];

function toPayload(form, extras = {}) {
  return {
    class_id: form.classId,
    date: form.date,
    period: Number(form.period || 1),
    semester: form.semester,
    topic: form.topic.trim(),
    location: form.location.trim(),
    objective: form.objective.trim(),
    equipment: form.equipment.trim(),
    activity_type: form.activityType,
    notes: form.notes.trim(),
    ...extras,
  };
}

function fromRow(row) {
  return {
    id: row.id,
    classId: row.class_id,
    date: row.date,
    period: row.period,
    semester: row.semester || 'A',
    topic: row.topic || '',
    location: row.location || '',
    objective: row.objective || '',
    equipment: row.equipment || '',
    activityType: row.activity_type || '',
    notes: row.notes || '',
    isTemplate: row.is_template || false,
    templateName: row.template_name || '',
  };
}

export default function SchedulePage() {
  const { data, loadAll } = useApp();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [classFilter, setClassFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [semesterFilter, setSemesterFilter] = useState('all');

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    const rows = await base44.entities.LessonTopic.list('-date');
    setLessons((rows || []).map(fromRow));
    setLoading(false);
  }, []);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  const classById = useMemo(() => Object.fromEntries(data.classes.map(c => [c.id, c])), [data.classes]);
  const visibleLessons = useMemo(() => {
    return lessons
      .filter(l => !l.isTemplate)
      .filter(l => classFilter === 'all' || l.classId === classFilter)
      .filter(l => gradeFilter === 'all' || classById[l.classId]?.gradeLevel === gradeFilter)
      .filter(l => semesterFilter === 'all' || l.semester === semesterFilter)
      .filter(l => !monthFilter || l.date?.startsWith(monthFilter))
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || Number(a.period) - Number(b.period));
  }, [lessons, classFilter, gradeFilter, monthFilter, semesterFilter, classById]);

  const grouped = useMemo(() => {
    return visibleLessons.reduce((acc, lesson) => {
      if (!acc[lesson.date]) acc[lesson.date] = [];
      acc[lesson.date].push(lesson);
      return acc;
    }, {});
  }, [visibleLessons]);

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const openAdd = () => {
    setEditingLesson(null);
    setForm({ ...EMPTY_FORM, classId: classFilter !== 'all' ? classFilter : data.classes[0]?.id || '' });
    setDialogOpen(true);
  };

  const openEdit = (lesson) => {
    setEditingLesson(lesson);
    setForm({
      date: lesson.date,
      classId: lesson.classId,
      period: lesson.period || 1,
      semester: lesson.semester || 'A',
      topic: lesson.topic,
      location: lesson.location,
      objective: lesson.objective,
      equipment: lesson.equipment,
      activityType: lesson.activityType,
      notes: lesson.notes,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.classId || !form.date || !form.topic.trim()) return;
    const payload = toPayload(form, { is_template: false });
    if (editingLesson) await base44.entities.LessonTopic.update(editingLesson.id, payload);
    else await base44.entities.LessonTopic.create(payload);
    setDialogOpen(false);
    await fetchLessons();
    await loadAll();
    toast.success(editingLesson ? 'השיעור עודכן' : 'השיעור נשמר');
  };

  const handleDuplicate = async (lesson) => {
    await base44.entities.LessonTopic.create(toPayload({ ...lesson, topic: `${lesson.topic} - עותק` }, { is_template: false }));
    await fetchLessons();
    await loadAll();
    toast.success('השיעור שוכפל');
  };

  const handleSaveTemplate = async (lesson) => {
    await base44.entities.LessonTopic.create(toPayload(lesson, { is_template: true, template_name: lesson.topic || 'תבנית שיעור' }));
    await fetchLessons();
    toast.success('השיעור נשמר כתבנית');
  };

  const handleDelete = async () => {
    await base44.entities.LessonTopic.delete(deleteLessonTarget.id);
    setDeleteLessonTarget(null);
    await fetchLessons();
    await loadAll();
    toast.success('השיעור נמחק');
  };

  return (
    <Layout title="יומן שיעורי חנ״ג" titleAction={<Button size="sm" onClick={openAdd} className="h-8 gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> שיעור</Button>}>
      <div className="max-w-4xl mx-auto p-4 space-y-4" dir="rtl">
        <Card className="card-3d rounded-2xl p-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="כיתה" /></SelectTrigger>
              <SelectContent><SelectItem value="all">כל הכיתות</SelectItem>{data.classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="שכבה" /></SelectTrigger>
              <SelectContent><SelectItem value="all">כל השכבות</SelectItem>{GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}׳</SelectItem>)}</SelectContent>
            </Select>
            <Input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="h-10 text-sm" />
            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="מחצית" /></SelectTrigger>
              <SelectContent><SelectItem value="all">כל המחציות</SelectItem><SelectItem value="A">מחצית א׳</SelectItem><SelectItem value="B">מחצית ב׳</SelectItem></SelectContent>
            </Select>
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-center text-muted-foreground py-16 text-sm">אין שיעורים מתאימים לסינון.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([date, items]) => (
              <section key={date} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  {new Date(date).toLocaleDateString('he-IL')}
                </div>
                {items.map(lesson => {
                  const cls = classById[lesson.classId];
                  return (
                    <Card key={lesson.id} className="card-3d rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base truncate">{lesson.topic}</h3>
                            <Badge variant="secondary" className="text-[10px]">שעה {lesson.period}</Badge>
                            <Badge variant="outline" className="text-[10px]">{SEMESTER_LABELS[lesson.semester] || lesson.semester}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{cls?.name || 'כיתה לא ידועה'}{lesson.location ? ` • ${lesson.location}` : ''}{lesson.activityType ? ` • ${lesson.activityType}` : ''}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(lesson)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(lesson)}><Copy className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSaveTemplate(lesson)}><Save className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteLessonTarget(lesson)}><Trash2 className="w-3.5 h-3.5 text-destructive/70" /></Button>
                        </div>
                      </div>

                      {(lesson.objective || lesson.equipment || lesson.notes) && (
                        <div className="grid gap-1 text-xs text-muted-foreground rounded-xl bg-muted/40 p-2">
                          {lesson.objective && <p><span className="font-semibold text-foreground">מטרה:</span> {lesson.objective}</p>}
                          {lesson.equipment && <p><span className="font-semibold text-foreground">ציוד:</span> {lesson.equipment}</p>}
                          {lesson.notes && <p><span className="font-semibold text-foreground">הערות:</span> {lesson.notes}</p>}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <Link to={`/class/${lesson.classId}`}><Button variant="outline" className="w-full h-9 text-xs gap-1"><UserCheck className="w-3.5 h-3.5" /> נוכחות</Button></Link>
                        <Link to={`/class/${lesson.classId}/tests`}><Button variant="outline" className="w-full h-9 text-xs gap-1"><ClipboardList className="w-3.5 h-3.5" /> מבדק</Button></Link>
                        <Link to="/live-run"><Button variant="outline" className="w-full h-9 text-xs gap-1"><Timer className="w-3.5 h-3.5" /> ריצה חיה</Button></Link>
                      </div>
                    </Card>
                  );
                })}
              </section>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[440px] rounded-2xl p-0 overflow-hidden" dir="rtl">
            <DialogHeader className="px-5 pt-5 pb-0"><DialogTitle className="text-base font-bold">{editingLesson ? 'עריכת שיעור' : 'שיעור חנ״ג חדש'}</DialogTitle></DialogHeader>
            <div className="px-5 pb-5 space-y-3 max-h-[78vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">תאריך</Label><Input type="date" value={form.date} onChange={e => updateForm('date', e.target.value)} className="h-10 text-sm" /></div>
                <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">שעה</Label><Input type="number" min="1" value={form.period} onChange={e => updateForm('period', e.target.value)} className="h-10 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">כיתה</Label><Select value={form.classId} onValueChange={v => updateForm('classId', v)}><SelectTrigger className="h-10 text-sm"><SelectValue placeholder="בחר כיתה" /></SelectTrigger><SelectContent>{data.classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">מחצית</Label><Select value={form.semester} onValueChange={v => updateForm('semester', v)}><SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A">מחצית א׳</SelectItem><SelectItem value="B">מחצית ב׳</SelectItem></SelectContent></Select></div>
              </div>
              <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">נושא שיעור</Label><Input value={form.topic} onChange={e => updateForm('topic', e.target.value)} className="h-10 text-sm" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">מקום שיעור</Label><Input value={form.location} onChange={e => updateForm('location', e.target.value)} className="h-10 text-sm" /></div>
                <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">סוג פעילות</Label><Select value={form.activityType || 'none'} onValueChange={v => updateForm('activityType', v === 'none' ? '' : v)}><SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">ללא</SelectItem>{ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">מטרת שיעור</Label><Textarea value={form.objective} onChange={e => updateForm('objective', e.target.value)} className="min-h-[64px] text-sm" /></div>
              <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">ציוד נדרש</Label><Input value={form.equipment} onChange={e => updateForm('equipment', e.target.value)} className="h-10 text-sm" /></div>
              <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">הערות</Label><Textarea value={form.notes} onChange={e => updateForm('notes', e.target.value)} className="min-h-[64px] text-sm" /></div>
              <div className="flex gap-2 pt-1"><Button onClick={handleSave} disabled={!form.classId || !form.date || !form.topic.trim()} className="flex-1 h-10 rounded-xl font-semibold">שמור שיעור</Button><Button variant="outline" onClick={() => setDialogOpen(false)} className="h-10 rounded-xl px-5">ביטול</Button></div>
            </div>
          </DialogContent>
        </Dialog>

        <ConfirmDeleteDialog
          open={!!deleteLessonTarget}
          onOpenChange={() => setDeleteLessonTarget(null)}
          title={`מחיקת שיעור ${deleteLessonTarget?.topic || ''}`}
          description="הפעולה תמחק רק את רשומת השיעור מיומן חנ״ג ולא תמחק תלמידים, ציונים או מבדקים. האם להמשיך?"
          onConfirm={handleDelete}
        />
      </div>
    </Layout>
  );
}