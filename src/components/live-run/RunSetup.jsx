import { useMemo, useState } from 'react';
import { Play, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GRADE_LEVELS, SEMESTER_LABELS } from '@/lib/types';
import { compareStudentsByLastName } from './runUtils';

export default function RunSetup({ data, onStart }) {
  const today = new Date().toISOString().slice(0, 10);
  const [gradeLevel, setGradeLevel] = useState(data.classes[0]?.gradeLevel || 'ז');
  const classes = useMemo(() => data.classes.filter(c => !gradeLevel || c.gradeLevel === gradeLevel), [data.classes, gradeLevel]);
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const cls = data.classes.find(c => c.id === classId) || classes[0];
  const classTests = useMemo(() => {
    if (!cls) return [];
    return data.tests.filter(t => (!cls.gradeLevel || t.gradeLevel === cls.gradeLevel) && (t.genderTrack || 'boys') === (cls.genderTrack || 'boys'));
  }, [data.tests, cls]);
  const [testId, setTestId] = useState(classTests[0]?.id || '');
  const [date, setDate] = useState(today);
  const [routeName, setRouteName] = useState('מסלול בית ספר');
  const [distance, setDistance] = useState('2000 מטר');
  const [lapsRequired, setLapsRequired] = useState(1);
  const [semester, setSemester] = useState('A');
  const [selected, setSelected] = useState([]);

  const students = useMemo(
    () => data.students.filter(s => s.classId === (cls?.id || classId) && !s.peExempt).sort(compareStudentsByLastName),
    [data.students, cls, classId]
  );

  const selectedSet = new Set(selected.length ? selected : students.map(s => s.id));

  const toggleStudent = (id) => {
    const base = selected.length ? selected : students.map(s => s.id);
    setSelected(base.includes(id) ? base.filter(x => x !== id) : [...base, id]);
  };

  const handleStart = () => {
    const chosen = students.filter(s => selectedSet.has(s.id));
    if (!cls || !testId || chosen.length === 0) return;
    onStart({ gradeLevel, classId: cls.id, testId, date, routeName, distance, lapsRequired: Number(lapsRequired || 1), semester }, chosen);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4" dir="rtl">
      <Card className="card-3d rounded-2xl p-4 space-y-4">
        <div>
          <h2 className="text-xl font-bold">פתיחת ריצה חיה</h2>
          <p className="text-sm text-muted-foreground">בחר כיתה, מבדק ותלמידים לפני תחילת המדידה.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Select value={gradeLevel} onValueChange={(v) => { setGradeLevel(v); setClassId(''); setSelected([]); }}>
            <SelectTrigger className="h-11"><SelectValue placeholder="שכבה" /></SelectTrigger>
            <SelectContent>{GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>שכבה {g}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={cls?.id || ''} onValueChange={(v) => { setClassId(v); setSelected([]); }}>
            <SelectTrigger className="h-11"><SelectValue placeholder="כיתה" /></SelectTrigger>
            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={testId || classTests[0]?.id || ''} onValueChange={setTestId}>
            <SelectTrigger className="h-11"><SelectValue placeholder="סוג ריצה / מבדק" /></SelectTrigger>
            <SelectContent>{classTests.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-11" />
          <Input value={routeName} onChange={e => setRouteName(e.target.value)} placeholder="מסלול" className="h-11" />
          <Input value={distance} onChange={e => setDistance(e.target.value)} placeholder="מרחק" className="h-11" />
          <Input type="number" min="1" value={lapsRequired} onChange={e => setLapsRequired(e.target.value)} placeholder="מספר הקפות" className="h-11" />
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(SEMESTER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="card-3d rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold"><Users className="w-4 h-4" /> תלמידים לריצה ({selectedSet.size})</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelected(students.map(s => s.id))}>בחר הכל</Button>
            <Button variant="outline" size="sm" onClick={() => setSelected([])}>נקה בחירה</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[42vh] overflow-y-auto pr-1">
          {students.map(student => (
            <button key={student.id} onClick={() => toggleStudent(student.id)} className={`text-right rounded-xl border px-3 py-3 transition-all ${selectedSet.has(student.id) ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border hover:bg-muted'}`}>
              {student.name}
            </button>
          ))}
        </div>
        <Button onClick={handleStart} disabled={!cls || !testId || selectedSet.size === 0} className="w-full h-14 text-lg font-bold btn-3d">
          <Play className="w-5 h-5" /> התחל ריצה
        </Button>
      </Card>
    </div>
  );
}