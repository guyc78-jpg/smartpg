import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Timer, Activity, ClipboardList, Edit2, CheckCircle2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { DAY_LABELS } from '@/lib/scheduleImport';
import { formatPeriodStart } from '@/lib/periodTimes';

export default function LessonManagePage() {
  const { data, loadAll } = useApp();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const classId = params.get('classId') || '';
  const period = Number(params.get('period') || 1);
  const date = params.get('date') || new Date().toISOString().slice(0, 10);

  const [existingId, setExistingId] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [postNotes, setPostNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const rows = await base44.entities.LessonTopic.filter({ class_id: classId, date, period });
      if (!active) return;
      const existing = rows?.[0] || null;
      setLesson(existing);
      setExistingId(existing?.id || null);
      setPostNotes(existing?.post_lesson_notes || '');
      setLoading(false);
    })();
    return () => { active = false; };
  }, [classId, date, period]);

  const cls = data.classes.find(c => c.id === classId);
  const dayOfWeek = new Date(date).getDay();
  const editUrl = `/lesson-edit?classId=${classId}&period=${period}&date=${date}`;

  const handleFinish = async () => {
    setSaving(true);
    const payload = { class_id: classId, date, period, post_lesson_notes: postNotes.trim() };
    if (existingId) await base44.entities.LessonTopic.update(existingId, payload);
    else await base44.entities.LessonTopic.create(payload);
    await loadAll();
    setSaving(false);
    setFinishing(false);
    toast.success('השיעור תועד וסומן כמסתיים');
    navigate('/');
  };

  return (
    <Layout title="ניהול שיעור" backTo="/">
      <div className="max-w-lg mx-auto p-4 space-y-3" dir="rtl">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
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
              <Link to={`/stopwatch?classId=${classId}&period=${period}&date=${date}`} className="flex flex-col items-center justify-center gap-1 rounded-xl bg-card shadow-sm py-3 hover:bg-secondary/60 transition-colors">
                <Timer className="w-[18px] h-[18px] text-primary" />
                <span className="text-xs font-semibold">סטופר חכם</span>
              </Link>
              <Link to={`/live-run?classId=${classId}&period=${period}&date=${date}`} className="flex flex-col items-center justify-center gap-1 rounded-xl bg-card shadow-sm py-3 hover:bg-secondary/60 transition-colors">
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
                <p className="text-[11px] text-muted-foreground font-semibold">תיעוד לאחר שיעור</p>
                <Textarea value={postNotes} onChange={e => setPostNotes(e.target.value)} className="min-h-[80px] text-sm text-right" placeholder="איך התנהל השיעור..." />
                <div className="flex gap-2">
                  <Button onClick={handleFinish} disabled={saving} className="flex-1 h-10 rounded-xl font-semibold gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
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