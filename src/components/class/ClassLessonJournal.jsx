import { useMemo, useState } from 'react';
import { BookOpen, MapPin, Target, Pencil, StickyNote, Check } from 'lucide-react';
import { useApp } from '@/store/AppProvider';
import { Badge } from '@/components/ui/badge';
import { formatLocalDate, parseLocalISODate } from '@/lib/dateTime';

const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function ClassLessonJournal({ classId }) {
  const { data, saveLessonTopic } = useApp();
  const [editingId, setEditingId] = useState(null);
  const [value, setValue] = useState('');

  const lessons = useMemo(
    () => (data.lessonTopics || [])
      .filter(l => l.classId === classId && !l.isTemplate && l.date)
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (Number(b.period) || 0) - (Number(a.period) || 0)),
    [data.lessonTopics, classId]
  );

  const monthGroups = useMemo(() => {
    const map = new Map();
    for (const l of lessons) {
      const key = l.date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(l);
    }
    return [...map.entries()];
  }, [lessons]);

  const saveEdit = async (lesson) => {
    setEditingId(null);
    if (value.trim() === (lesson.topic || '')) return;
    await saveLessonTopic(classId, lesson.date, lesson.period, value);
  };

  if (lessons.length === 0) {
    return (
      <div className="text-center py-14 space-y-2" dir="rtl">
        <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/40" />
        <p className="text-sm font-bold text-foreground">יומן השיעורים ריק</p>
        <p className="text-xs text-muted-foreground px-6">תעד נושאי שיעור מהמערכת היומית במסך הראשי, והם יופיעו כאן מסודרים לפי תאריכים.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {monthGroups.map(([month, monthLessons]) => (
        <div key={month} className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-foreground">
              {formatLocalDate(`${month}-01`, { month: 'long', year: 'numeric' })}
            </h3>
            <Badge variant="secondary" className="text-[10px]">{monthLessons.length} שיעורים</Badge>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          <div className="space-y-2">
            {monthLessons.map(lesson => {
              const d = parseLocalISODate(lesson.date);
              const isEditing = editingId === lesson.id;
              return (
                <div key={lesson.id} className="rounded-2xl card-3d p-3 flex gap-3 items-start">
                  <div className="shrink-0 w-12 rounded-xl bg-primary/10 border border-primary/20 py-1.5 text-center">
                    <div className="text-lg font-black text-primary leading-none">{d.getDate()}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">{WEEKDAYS[d.getDay()]}</div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1 text-right">
                    <div className="flex items-center gap-2">
                      {lesson.period ? (
                        <Badge variant="outline" className="text-[10px] shrink-0">שיעור {lesson.period}</Badge>
                      ) : null}
                      {isEditing ? (
                        <input
                          autoFocus
                          value={value}
                          onChange={e => setValue(e.target.value)}
                          onBlur={() => saveEdit(lesson)}
                          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                          placeholder="נושא השיעור"
                          className="flex-1 min-w-0 h-8 rounded-lg liquid-field px-2 text-sm text-right focus:outline-none"
                        />
                      ) : (
                        <span className="text-sm font-bold text-foreground truncate">{lesson.topic || 'ללא נושא'}</span>
                      )}
                    </div>

                    {lesson.objective && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3 shrink-0" /> {lesson.objective}</p>
                    )}
                    {lesson.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {lesson.location}</p>
                    )}
                    {(lesson.postLessonNotes || lesson.notes) && (
                      <p className="text-xs text-muted-foreground flex items-start gap-1"><StickyNote className="w-3 h-3 shrink-0 mt-0.5" /> {lesson.postLessonNotes || lesson.notes}</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (isEditing) return;
                      setValue(lesson.topic || '');
                      setEditingId(lesson.id);
                    }}
                    aria-label="עריכת נושא"
                    className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
                  >
                    {isEditing ? <Check className="w-3.5 h-3.5 text-primary" /> : <Pencil className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
