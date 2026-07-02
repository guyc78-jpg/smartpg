import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Plus, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SubstituteFillDialog from '@/components/substitute/SubstituteFillDialog';
import SubstituteSummaryBar from '@/components/substitute/SubstituteSummaryBar';
import SubstituteFillRow from '@/components/substitute/SubstituteFillRow';
import { STATUS_NEXT, exportFillsCsv } from '@/components/substitute/substituteUtils';

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const TABS = [{ key: 'today', label: 'היום' }, { key: 'week', label: 'השבוע' }, { key: 'month', label: 'החודש' }, { key: 'all', label: 'הכל' }];

export default function SubstituteFillsPage() {
  const { data } = useApp();
  const [searchParams] = useSearchParams();
  const todayIso = new Date().toISOString().slice(0, 10);

  const [fills, setFills] = useState([]);
  const [month, setMonth] = useState(() => {
    const base = searchParams.get('date') || todayIso;
    return new Date(base.slice(0, 7) + '-01T00:00:00');
  });
  const [tab, setTab] = useState('month');
  const [classFilter, setClassFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(searchParams.get('add') === '1');
  const dialogInitial = useMemo(() => ({
    date: searchParams.get('date') || todayIso,
    period: searchParams.get('period') || '',
  }), [searchParams, todayIso]);

  const load = async () => {
    const rows = await base44.entities.SubstituteFill.list('-date', 1000);
    setFills((rows || []).map(r => ({
      id: r.id, date: r.date, period: r.period, classId: r.class_id || '',
      className: r.class_name, status: r.status || 'not_reported',
    })));
  };
  useEffect(() => { load(); }, []);

  const activeClasses = useMemo(() => data.classes.filter(c => (c.status || 'active') === 'active'), [data.classes]);
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = `${MONTH_NAMES[month.getMonth()]} ${month.getFullYear()}`;
  const monthFills = useMemo(() => fills.filter(f => (f.date || '').startsWith(monthKey)), [fills, monthKey]);

  const classNames = useMemo(() => [...new Set(fills.map(f => f.className).filter(Boolean))], [fills]);

  const visibleFills = useMemo(() => {
    let list = fills;
    if (tab === 'today') list = fills.filter(f => f.date === todayIso);
    else if (tab === 'week') {
      const now = new Date(todayIso + 'T00:00:00');
      const start = new Date(now); start.setDate(now.getDate() - now.getDay());
      const end = new Date(start); end.setDate(start.getDate() + 6);
      const s = start.toISOString().slice(0, 10), e = end.toISOString().slice(0, 10);
      list = fills.filter(f => f.date >= s && f.date <= e);
    } else if (tab === 'month') list = monthFills;
    if (classFilter !== 'all') list = list.filter(f => f.className === classFilter);
    return [...list].sort((a, b) => b.date.localeCompare(a.date) || (a.period || 0) - (b.period || 0));
  }, [fills, tab, classFilter, monthFills, todayIso]);

  const changeMonth = (delta) => setMonth(m => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  const handleSave = async (payload) => {
    const record = { date: payload.date, class_id: payload.classId, class_name: payload.className, status: payload.status };
    if (payload.period) record.period = payload.period;
    await base44.entities.SubstituteFill.create(record);
    toast.success('מילוי המקום נוסף');
    setDialogOpen(false);
    load();
  };

  const handleCycleStatus = async (fill) => {
    const next = STATUS_NEXT[fill.status];
    setFills(fs => fs.map(f => f.id === fill.id ? { ...f, status: next } : f));
    await base44.entities.SubstituteFill.update(fill.id, { status: next });
  };

  const handleDelete = async (fill) => {
    setFills(fs => fs.filter(f => f.id !== fill.id));
    await base44.entities.SubstituteFill.delete(fill.id);
    toast.success('מילוי המקום נמחק');
  };

  return (
    <Layout title="מילויי מקום שלי" backTo="/">
      <div className="max-w-xl mx-auto p-4 space-y-3" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border bg-card h-11 flex-1">
            <button onClick={() => changeMonth(-1)} className="w-10 h-full flex items-center justify-center text-muted-foreground hover:text-foreground" aria-label="חודש קודם">
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="flex-1 text-center text-sm font-black">{monthLabel}</span>
            <button onClick={() => changeMonth(1)} className="w-10 h-full flex items-center justify-center text-muted-foreground hover:text-foreground" aria-label="חודש הבא">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="h-11 rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-white gap-1.5">
            <Plus className="w-4 h-4" />
            הוסף מילוי מקום
          </Button>
        </div>

        <SubstituteSummaryBar fills={monthFills} monthLabel={monthLabel} onExport={() => exportFillsCsv(monthFills, monthLabel)} />

        <div className="rounded-2xl border bg-card p-3 space-y-2">
          <div className="flex gap-1.5">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 h-9 rounded-lg text-xs font-bold transition-colors ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="h-10 flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הכיתות</SelectItem>
                {classNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-[11px] font-bold text-muted-foreground">{visibleFills.length} רשומות</span>
          </div>
        </div>

        {visibleFills.length === 0 ? (
          <div className="rounded-2xl border bg-card py-10 flex flex-col items-center gap-3">
            <UserPlus className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm font-bold text-muted-foreground">אין מילויי מקום בטווח שבחרת</p>
            <Button variant="outline" onClick={() => setDialogOpen(true)} className="rounded-xl gap-1.5 text-sm font-bold">
              <Plus className="w-4 h-4" />
              הוסף מילוי מקום ראשון
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleFills.map(fill => (
              <SubstituteFillRow key={fill.id} fill={fill} onCycleStatus={handleCycleStatus} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <SubstituteFillDialog open={dialogOpen} onOpenChange={setDialogOpen} classes={activeClasses} initial={dialogInitial} onSave={handleSave} />
    </Layout>
  );
}