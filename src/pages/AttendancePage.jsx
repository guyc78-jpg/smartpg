import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Clock3, Loader2, Save, Shirt, UserRoundX } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import { toLocalISODate } from '@/lib/dateTime';
import { formatStudentName } from '@/lib/studentName';

const STATUS_OPTIONS = [
  { value: 'present', label: 'נוכח/ת', icon: CheckCircle2 },
  { value: 'absent', label: 'נעדר/ת', icon: UserRoundX },
  { value: 'late', label: 'איחור', icon: Clock3 },
  { value: 'excused', label: 'מוצדק', icon: CheckCircle2 },
];

function emptyEntry(studentId) {
  return { studentId, status: 'present', uniformOk: true, notes: '' };
}

export default function AttendancePage() {
  const { classId } = useParams();
  const { data } = useApp();
  const [date, setDate] = useState(() => toLocalISODate());
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cls = data.classes.find(item => item.id === classId);
  const students = useMemo(
    () => data.students
      .filter(student => student.classId === classId)
      .sort((a, b) => formatStudentName(a).localeCompare(formatStudentName(b), 'he')),
    [data.students, classId]
  );

  const loadAttendance = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError('');
    try {
      const rows = await base44.entities.AttendanceRecord.filter(
        { class_id: classId, date },
        '-updated_date',
        5000
      );
      const latestByStudent = new Map();
      for (const row of rows || []) {
        if (!latestByStudent.has(row.student_id)) latestByStudent.set(row.student_id, row);
      }
      setEntries(Object.fromEntries(students.map(student => {
        const row = latestByStudent.get(student.id);
        return [student.id, row ? {
          id: row.id,
          studentId: student.id,
          status: row.status || 'present',
          uniformOk: row.uniform_ok !== false,
          notes: row.notes || '',
        } : emptyEntry(student.id)];
      })));
    } catch (loadError) {
      console.error('Failed to load attendance', loadError);
      setError('לא ניתן לטעון את נתוני הנוכחות. בדוק את החיבור ונסה שוב.');
    } finally {
      setLoading(false);
    }
  }, [classId, date, students]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const updateEntry = (studentId, changes) => {
    setEntries(current => ({
      ...current,
      [studentId]: { ...(current[studentId] || emptyEntry(studentId)), ...changes },
    }));
  };

  const markAllPresent = () => {
    setEntries(current => Object.fromEntries(students.map(student => [
      student.id,
      { ...(current[student.id] || emptyEntry(student.id)), status: 'present' },
    ])));
  };

  const saveAttendance = async () => {
    setSaving(true);
    setError('');
    try {
      const payloads = students.map(student => {
        const entry = entries[student.id] || emptyEntry(student.id);
        return {
          id: entry.id,
          class_id: classId,
          student_id: student.id,
          date,
          status: entry.status,
          uniform_ok: entry.uniformOk,
          notes: entry.notes.trim(),
        };
      });
      const updates = payloads.filter(item => item.id);
      const creates = payloads.filter(item => !item.id).map(({ id: _id, ...item }) => item);
      const [updated, created] = await Promise.all([
        updates.length ? base44.entities.AttendanceRecord.bulkUpdate(updates) : [],
        creates.length ? base44.entities.AttendanceRecord.bulkCreate(creates) : [],
      ]);
      const savedRows = [...(updated || []), ...(created || [])];
      setEntries(current => ({
        ...current,
        ...Object.fromEntries(savedRows.map(row => [row.student_id, {
          id: row.id,
          studentId: row.student_id,
          status: row.status,
          uniformOk: row.uniform_ok !== false,
          notes: row.notes || '',
        }]))
      }));
      toast.success('הנוכחות נשמרה');
    } catch (saveError) {
      console.error('Failed to save attendance', saveError);
      setError('שמירת הנוכחות נכשלה. הנתונים נשארו במסך כדי שתוכל לנסות שוב.');
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => students.reduce((result, student) => {
    const entry = entries[student.id] || emptyEntry(student.id);
    result[entry.status] = (result[entry.status] || 0) + 1;
    if (!entry.uniformOk) result.noUniform += 1;
    return result;
  }, { present: 0, absent: 0, late: 0, excused: 0, noUniform: 0 }), [students, entries]);

  if (!cls) {
    return <Layout title="נוכחות" backTo="/"><p className="p-8 text-center text-muted-foreground">הכיתה לא נמצאה.</p></Layout>;
  }

  return (
    <Layout title={`נוכחות · ${cls.name}`} subtitle={`${students.length} תלמידים`} backTo={`/class/${classId}`}>
      <main className="mx-auto max-w-3xl space-y-3 p-4 pb-28" dir="rtl">
        <section className="glass-surface rounded-2xl p-3 space-y-3" aria-label="בחירת יום וסיכום נוכחות">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex-1 space-y-1 text-sm font-semibold">
              <span>תאריך השיעור</span>
              <Input type="date" value={date} onChange={event => setDate(event.target.value)} className="h-11" />
            </label>
            <Button type="button" variant="outline" onClick={markAllPresent} className="h-11">סמן את כולם כנוכחים</Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-5" aria-live="polite">
            <span className="liquid-chip rounded-xl px-2 py-2">נוכחים <strong>{summary.present}</strong></span>
            <span className="liquid-chip rounded-xl px-2 py-2">נעדרים <strong>{summary.absent}</strong></span>
            <span className="liquid-chip rounded-xl px-2 py-2">איחורים <strong>{summary.late}</strong></span>
            <span className="liquid-chip rounded-xl px-2 py-2">מוצדקים <strong>{summary.excused}</strong></span>
            <span className="liquid-chip rounded-xl px-2 py-2">ללא תלבושת <strong>{summary.noUniform}</strong></span>
          </div>
        </section>

        {error && (
          <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
            <Button type="button" variant="ghost" onClick={loadAttendance} className="mr-2 h-9">נסה שוב</Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" aria-label="טוען נוכחות" /></div>
        ) : students.length === 0 ? (
          <div className="glass-surface rounded-2xl p-10 text-center text-muted-foreground">אין תלמידים בכיתה זו.</div>
        ) : (
          <section className="space-y-2" aria-label="רשימת תלמידים לנוכחות">
            {students.map(student => {
              const entry = entries[student.id] || emptyEntry(student.id);
              const name = formatStudentName(student);
              return (
                <article key={student.id} className="glass-surface rounded-2xl p-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-bold">{name}</h2>
                    <button
                      type="button"
                      aria-pressed={!entry.uniformOk}
                      aria-label={`${entry.uniformOk ? 'סמן ללא תלבושת' : 'סמן עם תלבושת'} עבור ${name}`}
                      onClick={() => updateEntry(student.id, { uniformOk: !entry.uniformOk })}
                      className={`min-h-11 rounded-xl px-3 text-xs font-semibold inline-flex items-center gap-2 ${entry.uniformOk ? 'liquid-chip' : 'border border-warning/50 bg-warning/15 text-warning-foreground'}`}
                    >
                      <Shirt className="h-4 w-4" /> {entry.uniformOk ? 'תלבושת תקינה' : 'ללא תלבושת'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label={`סטטוס נוכחות עבור ${name}`}>
                    {STATUS_OPTIONS.map(option => {
                      const Icon = option.icon;
                      const active = entry.status === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => updateEntry(student.id, { status: option.value })}
                          className={`min-h-11 rounded-xl px-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${active ? 'liquid-chip-active' : 'liquid-chip'}`}
                        >
                          <Icon className="h-4 w-4" /> {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <label className="block space-y-1 text-xs text-muted-foreground">
                    <span>הערה אופציונלית עבור {name}</span>
                    <Input
                      value={entry.notes}
                      onChange={event => updateEntry(student.id, { notes: event.target.value })}
                      maxLength={300}
                      placeholder="למשל: אישור רפואי יימסר בהמשך"
                      className="h-11 text-sm"
                    />
                  </label>
                </article>
              );
            })}
          </section>
        )}

        {!loading && students.length > 0 && (
          <div className="sticky bottom-24 z-30 rounded-2xl glass-surface p-2 shadow-xl">
            <Button type="button" onClick={saveAttendance} disabled={saving} className="h-12 w-full gap-2 font-bold">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {saving ? 'שומר נוכחות…' : 'שמור נוכחות'}
            </Button>
          </div>
        )}
      </main>
    </Layout>
  );
}
