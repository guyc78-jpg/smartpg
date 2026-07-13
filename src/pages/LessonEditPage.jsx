import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, Loader2, RefreshCw, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { DAY_LABELS } from '@/lib/scheduleImport';
import { formatPeriodStart } from '@/lib/periodTimes';
import { parseLocalISODate } from '@/lib/dateTime';
import { lessonRouteErrorMessage, validateLessonRoute } from '@/lib/lessonRoute';

const EMPTY_FORM = { topic: '', objective: '', equipment: '', notes: '', postLessonNotes: '' };

export default function LessonEditPage() {
  const { data, loadAll } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const route = useMemo(() => validateLessonRoute(searchParams, data.classes), [searchParams, data.classes]);
  const { classId, period, date } = route;

  const [existingId, setExistingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setLoadError(null);
      if (!route.valid) {
        setLoading(false);
        return;
      }
      try {
        const rows = await base44.entities.LessonTopic.filter({ class_id: classId, date, period });
        if (!active) return;
        const existing = rows?.[0];
        if (existing) {
          setExistingId(existing.id);
          setForm({
            topic: existing.topic || '',
            objective: existing.objective || '',
            equipment: existing.equipment || '',
            notes: existing.notes || '',
            postLessonNotes: existing.post_lesson_notes || '',
          });
        } else {
          setExistingId(null);
          setForm(EMPTY_FORM);
        }
      } catch (error) {
        console.error('Failed to load lesson for editing', error);
        if (active) setLoadError(error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [classId, date, period, reloadKey, route.valid]);

  const cls = route.cls;
  const dayOfWeek = route.valid ? parseLocalISODate(date).getDay() : new Date().getDay();
  const lessonQuery = new URLSearchParams({ classId, period: String(period), date }).toString();
  const manageUrl = `/lesson-manage?${lessonQuery}`;

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!route.valid) return toast.error(lessonRouteErrorMessage(route.error));
    setSaving(true);
    try {
      const payload = {
        class_id: classId,
        date,
        period,
        topic: form.topic.trim(),
        objective: form.objective.trim(),
        equipment: form.equipment.trim(),
        notes: form.notes.trim(),
        post_lesson_notes: form.postLessonNotes.trim(),
      };
      if (existingId) await base44.entities.LessonTopic.update(existingId, payload);
      else await base44.entities.LessonTopic.create(payload);
      await loadAll();
      toast.success('השיעור נשמר');
      navigate(manageUrl);
    } catch (error) {
      console.error('Failed to save lesson', error);
      toast.error('שמירת השיעור נכשלה. אפשר לנסות שוב.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="עריכת שיעור" backTo={manageUrl}>
      <div className="max-w-lg mx-auto p-4 space-y-3" dir="rtl">
        {!route.valid ? (
          <Card className="card-3d rounded-2xl p-6 flex flex-col items-center gap-3 text-center" role="alert">
            <AlertCircle className="w-7 h-7 text-destructive" aria-hidden="true" />
            <div>
              <p className="font-bold">לא ניתן לערוך את השיעור</p>
              <p className="mt-1 text-sm text-muted-foreground">{lessonRouteErrorMessage(route.error)}</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/')} className="rounded-xl">חזרה למסך הראשי</Button>
          </Card>
        ) : loading ? (
          <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">טוען את פרטי השיעור</span>
          </div>
        ) : loadError ? (
          <Card className="card-3d rounded-2xl p-6 flex flex-col items-center gap-3 text-center" role="alert">
            <AlertCircle className="w-7 h-7 text-destructive" aria-hidden="true" />
            <div>
              <p className="font-bold">לא הצלחנו לטעון את השיעור לעריכה</p>
              <p className="mt-1 text-sm text-muted-foreground">בדקו את החיבור ונסו שוב.</p>
            </div>
            <Button variant="outline" onClick={() => setReloadKey(key => key + 1)} className="rounded-xl gap-2">
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              נסו שוב
            </Button>
          </Card>
        ) : (
          <>
            <Card className="card-3d rounded-2xl p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="space-y-0.5">
                  <p className="text-[11px] text-muted-foreground">כיתה</p>
                  <p className="font-bold break-words">{cls?.name || 'כיתה לא ידועה'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] text-muted-foreground">יום</p>
                  <p className="font-bold">{DAY_LABELS[dayOfWeek]}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] text-muted-foreground">שעה</p>
                  <p className="font-bold">{formatPeriodStart(period)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] text-muted-foreground">מספר שיעור</p>
                  <p className="font-bold">שיעור {period}</p>
                </div>
                <div className="col-span-2 space-y-0.5">
                  <p className="text-[11px] text-muted-foreground">מקצוע</p>
                  <p className="font-bold">חינוך גופני</p>
                </div>
              </div>
            </Card>

            <Card className="card-3d rounded-2xl p-4 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="lesson-topic" className="text-xs text-muted-foreground">נושא שיעור</Label>
                <Input id="lesson-topic" value={form.topic} onChange={e => updateForm('topic', e.target.value)} className="h-11 text-sm text-right" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lesson-objective" className="text-xs text-muted-foreground">מטרת השיעור</Label>
                <Textarea id="lesson-objective" value={form.objective} onChange={e => updateForm('objective', e.target.value)} className="min-h-[64px] text-sm text-right" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lesson-equipment" className="text-xs text-muted-foreground">ציוד נדרש</Label>
                <Input id="lesson-equipment" value={form.equipment} onChange={e => updateForm('equipment', e.target.value)} className="h-11 text-sm text-right" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lesson-notes" className="text-xs text-muted-foreground">הערות</Label>
                <Textarea id="lesson-notes" value={form.notes} onChange={e => updateForm('notes', e.target.value)} className="min-h-[64px] text-sm text-right" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lesson-post-notes" className="text-xs text-muted-foreground">תיעוד לאחר שיעור</Label>
                <Textarea id="lesson-post-notes" value={form.postLessonNotes} onChange={e => updateForm('postLessonNotes', e.target.value)} className="min-h-[64px] text-sm text-right" />
              </div>
            </Card>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} aria-busy={saving} className="flex-1 h-11 rounded-xl font-semibold gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
                שמור שיעור
              </Button>
              <Button variant="outline" onClick={() => navigate(manageUrl)} className="h-11 rounded-xl px-5">ביטול</Button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
