import { useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { useApp } from '@/store/AppProvider';

export default function LessonTopicInline({ classId, date, period }) {
  const { data, saveLessonTopic } = useApp();
  const existing = (data.lessonTopics || []).find(
    l => l.classId === classId && l.date === date && Number(l.period) === Number(period) && !l.isTemplate
  );
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  const startEdit = () => { setValue(existing?.topic || ''); setEditing(true); };
  const save = async () => {
    setEditing(false);
    if ((existing?.topic || '') === value.trim()) return;
    await saveLessonTopic(classId, date, period, value);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5" dir="rtl">
        <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          placeholder="מה לימדתי?"
          className="flex-1 min-w-0 h-8 rounded-lg liquid-field px-2 text-xs text-right focus:outline-none"
        />
      </div>
    );
  }

  return (
    <button onClick={startEdit} className="flex items-center justify-start gap-1.5 text-xs text-right w-full py-0.5" dir="rtl">
      <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
      {existing?.topic ? (
        <span className="font-medium text-foreground truncate">{existing.topic}</span>
      ) : (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Plus className="w-3 h-3" /> הוסף נושא שיעור
        </span>
      )}
    </button>
  );
}