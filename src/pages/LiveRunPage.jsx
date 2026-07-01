import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Pause, Play, RotateCcw, Square } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { useApp } from '@/store/AppProvider';
import { useLiveRun } from '@/contexts/LiveRunContext';
import RunSetup from '@/components/live-run/RunSetup';
import RunStudentCard from '@/components/live-run/RunStudentCard';
import RunSummary from '@/components/live-run/RunSummary';
import { formatRunTime, participantToResultStatus, secondsFromMs, sortRunStudents } from '@/components/live-run/runUtils';

export default function LiveRunPage() {
  const navigate = useNavigate();
  const { data, setTestResult, setClassTestStatus, loadAll } = useApp();
  const run = useLiveRun();
  const { session, elapsedMs } = run;

  const selectedStudents = useMemo(() => {
    if (!session) return [];
    return data.students.filter(s => session.selectedIds.includes(s.id));
  }, [data.students, session]);

  const currentTest = data.tests.find(t => t.id === session?.setup?.testId);
  const currentClass = data.classes.find(c => c.id === session?.setup?.classId);

  const counts = useMemo(() => {
    const values = Object.values(session?.participants || {});
    return {
      running: values.filter(p => p.status === 'running').length,
      finished: values.filter(p => p.status === 'finished').length,
      notCompleted: values.filter(p => p.status === 'not_completed').length,
      notParticipated: values.filter(p => p.status === 'not_participated').length,
    };
  }, [session]);

  const resetRun = () => {
    if (window.confirm('איפוס הריצה ימחק את כל הזמנים והסיבובים הזמניים. להמשיך?')) run.resetRun();
  };

  const finishRun = () => {
    if (window.confirm('לעבור למסך סיכום? תלמידים שעדיין רצים יסומנו לפי מצבם הנוכחי ולא תתבצע שמירה עדיין.')) run.finishRun();
  };

  const saveSummary = async () => {
    if (!session || !currentTest) return;
    const invalid = selectedStudents.some(student => {
      const p = session.participants[student.id];
      return p.status === 'finished' && !p.finishTimeMs;
    });
    if (invalid) {
      toast.error('יש תלמיד שבוצע בלי זמן תקין');
      return;
    }

    const existingSameDate = data.results.some(r => r.testId === currentTest.id && r.semester === session.setup.semester && r.testDate === session.setup.date && session.selectedIds.includes(r.studentId) && r.liveRunId !== session.id);
    if (existingSameDate && !window.confirm('כבר קיימות תוצאות למבדק הזה בתאריך שנבחר. להחליף/לעדכן אותן?')) return;

    for (const student of selectedStudents) {
      const participant = session.participants[student.id];
      const completed = participant.status === 'finished';
      const rawSeconds = completed ? secondsFromMs(participant.finishTimeMs) : null;
      await setTestResult(student.id, currentTest.id, session.setup.semester, rawSeconds, participantToResultStatus(participant.status), {
        test_date: session.setup.date,
        run_time_seconds: rawSeconds,
        laps_completed: participant.laps || 0,
        route_name: `${session.setup.routeName || ''} · ${session.setup.distance || ''} מ׳`.trim(),
        live_run_id: session.id,
      });
    }
    await setClassTestStatus(session.setup.classId, currentTest.id, session.setup.semester, 'conducted');
    await loadAll();
    run.markSaved();
    run.closeSession();
    toast.success('תוצאות הריצה נשמרו למבדקים ולכרטיסי התלמידים');
    navigate(`/class/${session.setup.classId}/tests`);
  };

  if (!session) {
    return <Layout title="ריצה חיה" subtitle="סטופר חכם למבדקי זמן" backTo="/"><RunSetup data={data} onStart={run.startSession} /></Layout>;
  }

  if (session.phase === 'summary') {
    return (
      <Layout title="סיכום ריצה" subtitle={`${currentClass?.name || ''} · ${currentTest?.name || ''}`} backTo="/live-run">
        <RunSummary session={session} students={selectedStudents} test={currentTest} settings={data.settings} onEdit={run.updateSummaryResult} onBack={run.reopenRun} onSave={saveSummary} />
      </Layout>
    );
  }

  const sortedStudents = sortRunStudents(selectedStudents, session.participants);

  return (
    <Layout title="סטופר חכם" subtitle={`${currentClass?.name || ''} · ${currentTest?.name || ''} · ${session.setup.distance || ''} מ׳`}>
      <div className="max-w-[520px] mx-auto px-2 pt-3 pb-28 space-y-3" dir="rtl">
        <section className="sticky top-[49px] z-30 rounded-b-3xl bg-background/95 backdrop-blur border-b px-2 pb-3 text-center space-y-3">
          <div className="font-mono text-6xl font-black tracking-wider text-foreground" dir="ltr">{formatRunTime(elapsedMs)}</div>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>רצים: <b className="text-foreground">{counts.running}</b></span>
            <span>סיימו: <b className="text-green-600">{counts.finished}</b></span>
            <span>לא סיימו: <b className="text-destructive">{counts.notCompleted}</b></span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {session.running ? (
              <Button onClick={run.pauseTimer} className="h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-lg font-black"><Square className="w-4 h-4" /> עצור</Button>
            ) : (
              <Button onClick={run.startTimer} className="h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-lg font-black"><Play className="w-4 h-4" /> {elapsedMs ? 'המשך' : 'התחל'}</Button>
            )}
            <Button variant="outline" onClick={finishRun} className="h-14 rounded-2xl text-lg font-black"><Flag className="w-4 h-4" /> סיום ריצה</Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={run.pauseTimer} disabled={!session.running} className="h-10 rounded-xl"><Pause className="w-4 h-4" /> עצירה</Button>
            <Button variant="outline" onClick={resetRun} className="h-10 rounded-xl text-destructive"><RotateCcw className="w-4 h-4" /> איפוס</Button>
          </div>
        </section>

        <div className="space-y-2">
          {sortedStudents.map(student => (
            <RunStudentCard key={student.id} student={student} participant={session.participants[student.id]} elapsedMs={elapsedMs} lapsRequired={session.setup.lapsRequired} onLap={() => run.markLap(student.id)} onFinish={() => run.finishStudent(student.id)} onUndo={() => run.undoStudent(student.id)} onStatus={(status) => run.setStudentStatus(student.id, status)} />
          ))}
          {sortedStudents.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">אין תלמידים לריצה הזו.</div>}
        </div>
      </div>
    </Layout>
  );
}