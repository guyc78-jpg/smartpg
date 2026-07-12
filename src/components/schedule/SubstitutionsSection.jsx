import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight, Trash2, Plus } from 'lucide-react';
import { formatLocalDate, toLocalISODate } from '@/lib/dateTime';

export default function SubstitutionsSection({ substitutions, classes, onAdd, onDelete }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: toLocalISODate(),
    period: 1,
    originalClassId: '',
    substituteClassId: '',
    notes: '',
  });

  const classById = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c])), [classes]);

  const sorted = useMemo(
    () => [...substitutions].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [substitutions]
  );

  const handleSubmit = async () => {
    if (!form.date || !form.originalClassId || !form.substituteClassId) return;
    await onAdd(form);
    setForm({ date: toLocalISODate(), period: 1, originalClassId: '', substituteClassId: '', notes: '' });
    setOpen(false);
  };

  return (
    <Card className="card-3d rounded-2xl p-3 space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-sm">
          <ArrowLeftRight className="w-4 h-4 text-primary" />
          החלפות ושיבוצים
        </div>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setOpen(o => !o)}>
          <Plus className="w-3 h-3" /> הוסף
        </Button>
      </div>

      {open && (
        <div className="space-y-2 rounded-xl bg-muted/40 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-8 text-xs" />
            <Input type="number" min="1" placeholder="שעה" value={form.period} onChange={e => setForm(f => ({ ...f, period: Number(e.target.value) }))} className="h-8 text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={form.originalClassId} onValueChange={v => setForm(f => ({ ...f, originalClassId: v }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="כיתה מקורית" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.substituteClassId} onValueChange={v => setForm(f => ({ ...f, substituteClassId: v }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="כיתה חלופית" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input placeholder="הערות" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="h-8 text-xs" />
          <Button onClick={handleSubmit} size="sm" className="w-full h-8 text-xs" disabled={!form.originalClassId || !form.substituteClassId}>
            שמור החלפה
          </Button>
        </div>
      )}

      <div className="space-y-1 max-h-60 overflow-y-auto">
        {sorted.map(sub => (
          <div key={sub.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-2 py-1.5 text-xs">
            <div className="min-w-0">
              <div className="font-medium truncate">
                {classById[sub.originalClassId]?.name || '?'} ← {classById[sub.substituteClassId]?.name || '?'}
              </div>
              <div className="text-muted-foreground">
                {formatLocalDate(sub.date)} • שעה {sub.period}
              </div>
            </div>
            <button onClick={() => onDelete(sub.id)} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-center text-xs text-muted-foreground py-2">אין החלפות רשומות</p>}
      </div>
    </Card>
  );
}
