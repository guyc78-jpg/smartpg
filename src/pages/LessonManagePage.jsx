import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Activity, AlertCircle, ClipboardList, Edit2, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { DAY_LABELS } from '@/lib/scheduleImport';
import { formatPeriodStart } from '@/lib/periodTimes';
import { parseLocalISODate } from '@/lib/dateTime';
import { lessonRouteErrorMessage, validateLessonRoute } from '@/lib/lessonRoute';

export default function LessonManagePage() {
  const { data, loadAll } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const route = useMemo(() => validateLessonRoute(searchParams, data.classes), [searchParams, data.classes]);
  const { classId, period, date } = route;

  const [existingId, setExistingId] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [postNotes, setPostNotes] = useState('');
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
        const existing = rows?.[0] || null;
        setLesson(existing);
        setExistingId(existing?.id || null);
        setPostNotes(existing?.post_lesson_notes || '');
      } catch (error) {
        console.error('Failed to load lesson details', error);
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
  const editUrl = `/lesson-edit?${lessonQuery}`;

  const handleFinish = async () => {
    if (!route.valid) return toast.error(lessonRouteErrorMessage(route.error));
    setSaving(true);
    try {
      const payload = { class_id: classId, date, period, post_lesson_notes: postNotes.trim() };
      if (existingId) await base44.entities.LessonTopic.update(existingId, payload);
      else await base44.entities.LessonTopic.create(payload);
      await loadAll();
      setFinishing(false);
      toast.success('השיעור תועד וסומן כמסתיים');
      navigate('/');
    } catch (error) {
      console.error('Failed to finish lesson', error);
      toast.error('שמירת סיום השיעור נכשלה. אפשר לנסות שוב.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="ניהול שיעור" backTo="/">
      <div className="max-w-lg mx-auto p-4 space-y-3" dir="rtl">
        {!route.valid ? (
          <Card className="card-3d rounded-2xl p-6 flex flex-col items-center gap-3 text-center" role="alert">
            <AlertCircle className="w-7 h-7 text-destructive" aria-hidden="true" />
            <div>
              <p className="font-bold">לא ניתן לפתוח את השיעור</p>
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
              <p className="font-bold">לא הצלחנו לטעון את פרטי השיעור</p>
              <p className="mt-1 text-sm text-muted-foreground">בדקו את החיבור ונסו שוב.</p>
            </div>
            <Button variant="outline" onClick={() => setReloadKey(key => key + 1)} className="rounded-xl gap-2">
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              נסו שוב
            </Button>
          </Card>
        ) : (
          <>
            <Card className="card-3d rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-lg break-words">{cls?.name || 'כיתה לא ידועה'}</p>
                  <p className="text-xs text-muted-foreground">יום {DAY_LABELS[dayOfWeek]} · {formatPeriodStart(period)} · שיעור {period}</p>
                </div>
              </div>

              <div className="rounded-xl bg-muted/40 p-3 space-y-1.5 text-sm">
                <p><span className="font-semibold">נושא:</span> {lesson?.topic || 'טרם הוגדר נושא'}</p>
                <p><span className="font-semibold">מטרה:</span> {lesson?.objective || 'לא הוגדרה'}</p>
                <p><span className="font-semibold">ציוד:</span> {lesson?.equipment || 'לא הוגדר'}</p>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-2">
              <Link to={`/live-run?${lessonQuery}`} className="flex flex-col items-center justify-center gap-1 rounded-xl bg-card shadow-sm py-3 hover:bg-secondary/60 transition-colors">
                <Activity className="w-[18px] h-[18px] text-primary" />
                <span className="text-xs font-semibold">ריצה חיה</span>
              </Link>
              <Link to={`/class/${classId}/tests`} className="flex flex-col items-center justify-center gap-1 rounded-xl bg-card shadow-sm py-3 hover:bg-secondary/60 transition-colors">
                <ClipboardList className="w-[18px] h-[18px] text-primary" />
                <span className="text-xs font-semibold">מדידות</span>
              </Link>
              <Link to={editUrl} className="flex flex-col items-center justify-center gap-1 rounded-xl bg-card shadow-sm py-3 hover:bg-secondary/60 transition-colors">
                <Edit2 className="w-[18px] h-[18px] text-primary" />
                <span className="text-xs font-semibold">עריכה</span>
              </Link>
            </div>

            {!finishing ? (
              <Button onClick={() => setFinishing(true)} className="w-full h-11 rounded-xl font-semibold gap-2">
                <CheckCircle2 className="w-4 h-4" />
                סיום שיעור
              </Button>
            ) : (
              <Card className="card-3d rounded-2xl p-4 space-y-2">
                <label htmlFor="lesson-post-notes" className="text-[11px] text-muted-foreground font-semibold">תיעוד לאחר שיעור</label>
                <Textarea id="lesson-post-notes" value={postNotes} onChange={e => setPostNotes(e.target.value)} className="min-h-[80px] text-sm text-right" placeholder="איך התנהל השיעור..." />
                <div className="flex gap-2">
                  <Button onClick={handleFinish} disabled={saving} aria-busy={saving} className="flex-1 h-10 rounded-xl font-semibold gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
                    שמור וסיים
                  </Button>
                  <Button variant="outline" onClick={() => setFinishing(false)} className="h-10 rounded-xl px-5">ביטול</Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
