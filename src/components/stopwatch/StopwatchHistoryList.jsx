import { useState } from 'react';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatRunTime } from '@/components/live-run/runUtils';

export default function StopwatchHistoryList({ logs, classById, onUpdate, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  if (logs.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">אין מדידות שמורות עבור הסינון הנוכחי.</p>;
  }

  const startEdit = (log) => { setEditingId(log.id); setEditLabel(log.label || ''); };
  const saveEdit = async (log) => { await onUpdate(log.id, { label: editLabel }); setEditingId(null); };

  return (
    <div className="space-y-2">
      {logs.map(log => (
        <div key={log.id} className="rounded-2xl border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => setExpandedId(expandedId === log.id ? null : log.id)} className="flex-1 text-right min-w-0">
              <p className="font-bold text-sm truncate">{classById[log.class_id]?.name || 'כיתה'} · שיעור {log.period || '-'}</p>
              <p className="text-xs text-muted-foreground truncate">{log.date}{log.label ? ` · ${log.label}` : ''}</p>
            </button>
            <span className="font-mono font-black text-base shrink-0" dir="ltr">{formatRunTime(log.total_time_ms)}</span>
            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${expandedId === log.id ? 'rotate-180' : ''}`} />
          </div>

          {expandedId === log.id && (
            <div className="mt-3 space-y-2 border-t pt-3">
              {editingId === log.id ? (
                <div className="flex gap-2">
                  <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="h-9 text-sm" placeholder="תיאור" />
                  <Button size="sm" onClick={() => saveEdit(log)} className="h-9">שמור</Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(log.laps || []).map((lapMs, idx) => (
                    <span key={idx} className="rounded-md bg-muted/50 px-2 py-1 text-xs font-mono font-bold" dir="ltr">#{idx + 1} {formatRunTime(lapMs)}</span>
                  ))}
                  {(!log.laps || log.laps.length === 0) && <p className="text-xs text-muted-foreground">אין הקפות שנשמרו במדידה זו.</p>}
                </div>
              )}
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" size="sm" onClick={() => startEdit(log)} className="h-8 gap-1 text-xs"><Pencil className="w-3.5 h-3.5" /> עריכה</Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(log)} className="h-8 gap-1 text-xs text-destructive"><Trash2 className="w-3.5 h-3.5" /> מחיקה</Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}