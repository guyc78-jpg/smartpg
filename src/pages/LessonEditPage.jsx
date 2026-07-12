import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
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
import { parseLocalISODate, toLocalISODate } from '@/lib/dateTime';

const EMPTY_FORM = { topic: '', objective: '', equipment: '', notes: '', postLessonNotes: '' };

export default function LessonEditPage() {
  const { data, loadAll } = useApp();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const classId = params.get('classId') || '';
  const period = Number(params.get('period') || 1);
  const date = params.get('date') || toLocalISODate();

  const [existingId, setExistingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
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
      setLoading(false);
    })();
    return () => { active = false; };
  }, [classId, date, period]);

  const cls = data.classes.find(c => c.id === classId);
  const dayOfWeek = parseLocalISODate(date).getDay();
  const manageUrl = `/lesson-manage?classId=${classId}&period=${period}&date=${date}`;

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
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
    setSaving(false);
    toast.success('השיעור נשמר');
    navigate(manageUrl);
  };

  return (
    <Layout title="עריכת שיעור" backTo={manageUrl}>
      <div className="max-w-lg mx-auto p-4 space-y-3" dir="rtl">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
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
                <Label className="text-[11px] text-muted-foreground">נושא שיעור</Label>
                <Input value={form.topic} onChange={e => updateForm('topic', e.target.value)} className="h-10 text-sm text-right" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">מטרת השיעור</Label>
                <Textarea value={form.objective} onChange={e => updateForm('objective', e.target.value)} className="min-h-[64px] text-sm text-right" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">ציוד נדרש</Label>
                <Input value={form.equipment} onChange={e => updateForm('equipment', e.target.value)} className="h-10 text-sm text-right" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">הערות</Label>
                <Textarea value={form.notes} onChange={e => updateForm('notes', e.target.value)} className="min-h-[64px] text-sm text-right" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">תיעוד לאחר שיעור</Label>
                <Textarea value={form.postLessonNotes} onChange={e => updateForm('postLessonNotes', e.target.value)} className="min-h-[64px] text-sm text-right" />
              </div>
            </Card>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1 h-11 rounded-xl font-semibold gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
