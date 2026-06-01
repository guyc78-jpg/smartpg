import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = [
  { value: 1, label: 'ראשון' }, { value: 2, label: 'שני' }, { value: 3, label: 'שלישי' },
  { value: 4, label: 'רביעי' }, { value: 5, label: 'חמישי' }, { value: 6, label: 'שישי' },
];

const PERIODS = Array.from({ length: 12 }, (_, i) => i + 1);

const BELL = {
  1: ['08:15','09:05'], 2: ['09:05','09:50'], 3: ['10:15','11:00'], 4: ['11:00','11:45'],
  5: ['12:05','12:50'], 6: ['12:50','13:35'], 7: ['13:45','14:30'], 8: ['14:35','15:20'],
  9: ['15:25','16:10'], 10: ['16:10','16:55'], 11: ['16:55','17:40'], 12: ['17:40','18:25'],
};

function getCurrentPeriod() {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  for (const [p, [a, b]] of Object.entries(BELL)) {
    if (hhmm >= a && hhmm < b) return Number(p);
  }
  return null;
}

export default function SchedulePage() {
  const { data } = useApp();
  const [entries, setEntries] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(getCurrentPeriod());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ day_of_week: 1, period: 1, class_id: '', notes: '' });

  useEffect(() => {
    const i = setInterval(() => setCurrentPeriod(getCurrentPeriod()), 30000);
    return () => clearInterval(i);
  }, []);

  const fetchSchedule = useCallback(async () => {
    const rows = await base44.entities.TeacherSchedule.list();
    setEntries((rows || []).map(r => ({ id: r.id, day_of_week: r.day_of_week, period: r.period, class_id: r.class_id || null, notes: r.notes || '' })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const getEntry = (day, period) => entries.find(e => e.day_of_week === day && e.period === period);
  const getClassName = (classId) => classId ? (data.classes.find(c => c.id === classId)?.name || '') : '';

  const openAdd = (day, period) => { setEditingId(null); setForm({ day_of_week: day, period, class_id: '', notes: '' }); setDialogOpen(true); };
  const openEdit = (entry) => { setEditingId(entry.id); setForm({ day_of_week: entry.day_of_week, period: entry.period, class_id: entry.class_id || '', notes: entry.notes }); setDialogOpen(true); };

  const handleSave = async () => {
    const payload = { day_of_week: form.day_of_week, period: form.period, class_id: form.class_id || null, notes: form.notes.trim() };
    if (editingId) await base44.entities.TeacherSchedule.update(editingId, payload);
    else await base44.entities.TeacherSchedule.create(payload);
    setDialogOpen(false);
    fetchSchedule();
  };

  const handleDelete = async (id) => { await base44.entities.TeacherSchedule.delete(id); fetchSchedule(); };

  const todayDow = new Date().getDay() + 1;

  return (
    <Layout title="מערכת שעות">
      <div className="p-2 overflow-x-auto" dir="rtl">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <table className="w-full border-collapse text-xs min-w-[600px]">
            <thead>
              <tr>
                <th className="p-1.5 text-right font-medium text-muted-foreground border border-border/40 bg-muted/30 w-12">שעה</th>
                {DAYS.map(d => (
                  <th key={d.value} className={`p-1.5 text-center font-medium border border-border/40 bg-muted/30 ${d.value === todayDow ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map(period => {
                const bell = BELL[period];
                return (
                  <tr key={period}>
                    <td className="p-1 border border-border/40 bg-muted/10 text-center">
                      <div className="font-medium">{period}</div>
                      {bell && <div className="text-[10px] text-muted-foreground">{bell[0]}</div>}
                    </td>
                    {DAYS.map(d => {
                      const entry = getEntry(d.value, period);
                      const isNow = d.value === todayDow && currentPeriod === period;
                      return (
                        <td key={d.value} className={`p-1 border border-border/40 cursor-pointer transition-colors min-w-[80px] ${isNow ? 'bg-primary/15 ring-1 ring-inset ring-primary/30' : 'hover:bg-muted/40'}`} onClick={() => entry ? openEdit(entry) : openAdd(d.value, period)}>
                          {entry ? (
                            <div className="space-y-0.5">
                              {entry.class_id && <div className="font-medium text-foreground text-[11px] leading-tight">{getClassName(entry.class_id)}</div>}
                              {entry.notes && <div className="text-[10px] text-muted-foreground leading-tight truncate">{entry.notes}</div>}
                            </div>
                          ) : (
                            <div className="h-8 flex items-center justify-center">
                              <Plus className="w-3 h-3 text-muted-foreground/30" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[340px]" dir="rtl">
          <DialogHeader><DialogTitle>{editingId ? 'עריכת שעה' : 'הוספת שעה'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">כיתה</Label>
              <Select value={form.class_id || 'none'} onValueChange={v => setForm(f => ({ ...f, class_id: v === 'none' ? '' : v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="בחר כיתה" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא</SelectItem>
                  {data.classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">הערות</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="h-9 text-sm" />
            </div>
          </div>
          <DialogFooter className="flex gap-2 mt-4">
            {editingId && (
              <Button variant="outline" className="text-destructive" onClick={() => { handleDelete(editingId); setDialogOpen(false); }}>
                <Trash2 className="w-3.5 h-3.5 ml-1" /> מחק
              </Button>
            )}
            <Button onClick={handleSave}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}