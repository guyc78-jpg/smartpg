import { useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { useApp } from '@/store/AppProvider';

export default function LessonTopicInline({ classId, classIds, date, period }) {
  const { data, saveLessonTopic } = useApp();
  const targetClassIds = classIds?.length ? classIds : [classId].filter(Boolean);
  const existingTopics = (data.lessonTopics || []).filter(
    l => targetClassIds.includes(l.classId) && l.date === date && Number(l.period) === Number(period) && !l.isTemplate
  );
  const existing = existingTopics[0];
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  const startEdit = () => { setValue(existing?.topic || ''); setEditing(true); };
  const save = async () => {
    setEditing(false);
    const nextTopic = value.trim();
    const unchanged = targetClassIds.every(id => existingTopics.find(topic => topic.classId === id)?.topic === nextTopic);
    if (unchanged) return;
    await Promise.all(targetClassIds.map(id => saveLessonTopic(id, date, period, nextTopic)));
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
