import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, ClipboardList, Timer, Search, BarChart3, Plus, UserCheck, AlertCircle, Activity } from 'lucide-react';
import { formatStudentName } from '@/lib/studentName';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function QuickAction({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="rounded-2xl border border-border bg-card p-3 text-center shadow-sm transition-colors hover:border-primary/40 hover:text-primary">
      <Icon className="mx-auto mb-1 h-5 w-5" />
      <span className="text-xs font-semibold">{label}</span>
    </Link>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <Card className="card-3d rounded-2xl p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
    </Card>
  );
}

export default function HomePage() {
  const { data } = useApp();
  const [studentSearch, setStudentSearch] = useState('');
  const today = todayKey();

  const activeClassesById = useMemo(
    () => Object.fromEntries((data.classes || []).filter(c => (c.status || 'active') === 'active').map(c => [c.id, c])),
    [data.classes]
  );

  const todayLessons = useMemo(
    () => (data.lessonTopics || [])
      .filter(lesson => lesson.date === today && !lesson.isTemplate)
      .sort((a, b) => (a.period || 0) - (b.period || 0)),
    [data.lessonTopics, today]
  );

  const todayTests = useMemo(
    () => (data.tests || []).filter(test => test.date === today || test.testDate === today),
    [data.tests, today]
  );

  const todayClassIds = useMemo(() => {
    const ids = new Set();
    todayLessons.forEach(lesson => lesson.classId && ids.add(lesson.classId));
    todayTests.forEach(test => test.classId && ids.add(test.classId));
    return [...ids].filter(id => activeClassesById[id]);
  }, [todayLessons, todayTests, activeClassesById]);

  const todayClasses = todayClassIds.map(id => activeClassesById[id]).filter(Boolean);

  const plannedRuns = useMemo(() => {
    const runTests = todayTests.filter(test => test.testType === 'running' || test.name?.includes('ריצה'));
    const runLessons = todayLessons.filter(lesson => [lesson.topic, lesson.activityType, lesson.notes].filter(Boolean).some(text => text.includes('ריצה')));
    return { tests: runTests, lessons: runLessons, total: runTests.length + runLessons.length };
  }, [todayTests, todayLessons]);

  const todayStudents = useMemo(
    () => (data.students || []).filter(student => todayClassIds.includes(student.classId)),
    [data.students, todayClassIds]
  );

  const exemptStudents = todayStudents.filter(student => student.peExempt);
  const missingResults = (data.results || []).filter(result =>
    todayTests.some(test => test.id === result.testId) &&
    ['pending', 'not_participated', 'not_completed'].includes(result.status)
  );

  const hasTodayActivity = todayLessons.length > 0 || todayTests.length > 0 || plannedRuns.total > 0;

  const firstActiveClass = (data.classes || []).find(c => (c.status || 'active') === 'active');
  const testEntryLink = firstActiveClass ? `/class/${firstActiveClass.id}/tests` : '/manage-tests';

  const searchResults = useMemo(() => {
    const q = studentSearch.trim();
    if (!q) return [];
    return (data.students || [])
      .filter(student => formatStudentName(student).includes(q))
      .slice(0, 5);
  }, [data.students, studentSearch]);

  return (
    <Layout title="דשבורד יומן חנ״ג" subtitle={new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}>
      <div className="mx-auto max-w-4xl space-y-4 p-4" dir="rtl">
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryCard icon={CalendarDays} label="שיעורים היום" value={todayLessons.length} />
          <SummaryCard icon={UserCheck} label="כיתות פעילות" value={todayClasses.length} />
          <SummaryCard icon={ClipboardList} label="מבדקים היום" value={todayTests.length} />
          <SummaryCard icon={Timer} label="ריצות מתוכננות" value={plannedRuns.total} />
        </section>

        <Card className="card-3d rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold"><AlertCircle className="h-5 w-5 text-primary" /> מה חשוב היום</h2>
            <Badge variant="secondary" className="text-[10px]">היום בלבד</Badge>
          </div>

          {!hasTodayActivity ? (
            <p className="rounded-xl bg-muted/50 p-4 text-center text-sm font-semibold text-muted-foreground">אין משימות להיום</p>
          ) : (
            <div className="space-y-2">
              {todayLessons.map(lesson => (
                <Link key={lesson.id} to="/schedule" className="block rounded-xl bg-muted/40 p-3 text-sm hover:bg-muted">
                  <div className="font-semibold">שיעור: {lesson.topic || 'שיעור חנ״ג'}</div>
                  <div className="text-xs text-muted-foreground">{activeClassesById[lesson.classId]?.name || 'כיתה'}{lesson.period ? ` • שעה ${lesson.period}` : ''}{lesson.location ? ` • ${lesson.location}` : ''}</div>
                </Link>
              ))}
              {todayTests.map(test => (
                <Link key={test.id} to={test.classId ? `/class/${test.classId}/tests` : '/manage-tests'} className="block rounded-xl bg-primary/10 p-3 text-sm hover:bg-primary/15">
                  <div className="font-semibold text-primary">מבדק: {test.name}</div>
                  <div className="text-xs text-muted-foreground">{activeClassesById[test.classId]?.name || `שכבה ${test.gradeLevel || ''}`} {test.unit ? `• ${test.unit}` : ''}</div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <section className="grid grid-cols-3 gap-2">
          <QuickAction to="/schedule" icon={UserCheck} label="הזנת נוכחות" />
          <QuickAction to={testEntryLink} icon={ClipboardList} label="הזנת מבדק" />
          <QuickAction to="/live-run" icon={Timer} label="ריצה חיה" />
          <QuickAction to="#student-search" icon={Search} label="חיפוש תלמיד" />
          <QuickAction to="/reports" icon={BarChart3} label="דוחות" />
          <QuickAction to="/schedule" icon={Plus} label="הוספת שיעור" />
        </section>

        <Card id="student-search" className="card-3d rounded-2xl p-4">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold"><Search className="h-5 w-5 text-primary" /> חיפוש תלמיד</h2>
          <Input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="הקלד/י שם משפחה או שם פרטי" className="h-11" />
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {searchResults.map(student => (
                <Link key={student.id} to={`/class/${student.classId}`} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm hover:bg-muted">
                  <span className="font-semibold">{formatStudentName(student)}</span>
                  <span className="text-xs text-muted-foreground">{activeClassesById[student.classId]?.name || 'כיתה'}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="card-3d rounded-2xl p-4">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold"><Activity className="h-5 w-5 text-primary" /> סיכום קצר</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-muted/40 p-3"><span className="text-muted-foreground">תלמידים פטורים היום</span><div className="text-xl font-bold">{exemptStudents.length}</div></div>
            <div className="rounded-xl bg-muted/40 p-3"><span className="text-muted-foreground">חסרים במבדקי היום</span><div className="text-xl font-bold">{missingResults.length}</div></div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}