import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getBellTimes, saveBellTimes, resetBellTimes, getDefaultBellTimes } from '@/lib/periodTimes';
import { base44 } from '@/api/base44Client';
import { Bell, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';

function TimesTable({ times, onChange }) {
  return (
    <div className="space-y-1.5">
      {Object.keys(times).map(Number).map(p => (
        <div key={p} className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-black shrink-0">{p}</span>
          <Input
            type="time"
            value={times[p][0]}
            onChange={e => onChange(p, 0, e.target.value)}
            className="h-9 text-sm text-center"
          />
          <span className="text-muted-foreground text-xs shrink-0">עד</span>
          <Input
            type="time"
            value={times[p][1]}
            onChange={e => onChange(p, 1, e.target.value)}
            className="h-9 text-sm text-center"
          />
        </div>
      ))}
    </div>
  );
}

export default function BellScheduleEditor() {
  const [times, setTimes] = useState(() => getBellTimes());
  const [tab, setTab] = useState('weekday');

  const updateTime = (group) => (period, idx, value) => {
    setTimes(prev => ({
      ...prev,
      [group]: { ...prev[group], [period]: idx === 0 ? [value, prev[group][period][1]] : [prev[group][period][0], value] },
    }));
  };

  const persistToSettings = async (bell) => {
    const existing = await base44.entities.TeacherSettings.list();
    if (existing.length > 0) await base44.entities.TeacherSettings.update(existing[0].id, { bell_schedule: bell });
    else await base44.entities.TeacherSettings.create({ bell_schedule: bell });
  };

  const handleSave = async () => {
    saveBellTimes(times);
    await persistToSettings(times);
    toast.success('מערכת הצלצולים נשמרה');
  };

  const handleReset = async () => {
    resetBellTimes();
    setTimes(getDefaultBellTimes());
    await persistToSettings(null);
    toast.success('מערכת הצלצולים אופסה לברירת המחדל');
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3" dir="rtl">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">מערכת צלצולים</h3>
        </div>

        <div className="grid grid-cols-2 rounded-xl bg-muted/60 p-1 gap-1">
          <button type="button" onClick={() => setTab('weekday')} className={`h-8 rounded-lg text-xs font-bold transition-all ${tab === 'weekday' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}>
            ימים א׳–ה׳
          </button>
          <button type="button" onClick={() => setTab('friday')} className={`h-8 rounded-lg text-xs font-bold transition-all ${tab === 'friday' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}>
            יום ו׳
          </button>
        </div>

        {tab === 'weekday'
          ? <TimesTable times={times.weekday} onChange={updateTime('weekday')} />
          : <TimesTable times={times.friday} onChange={updateTime('friday')} />}

        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} className="flex-1 h-10 rounded-xl font-semibold text-sm gap-1.5">
            <Save className="w-4 h-4" />
            שמור צלצולים
          </Button>
          <Button variant="outline" onClick={handleReset} className="h-10 rounded-xl px-3 gap-1.5 text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            איפוס
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}