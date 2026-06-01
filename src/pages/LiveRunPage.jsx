import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Pause, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { useApp } from '@/store/AppProvider';
import { useLiveRun } from '@/contexts/LiveRunContext';
import { convertRawToGrade } from '@/lib/gradeCalc';
import RunSetup from '@/components/live-run/RunSetup';
import RunStudentCard from '@/components/live-run/RunStudentCard';
import RunSummary from '@/components/live-run/RunSummary';
import { formatRunTime, secondsFromMs, sortRunStudents } from '@/components/live-run/runUtils';

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
      not_completed: values.filter(p => p.status === 'not_completed').length,
      not_participated: values.filter(p => p.status === 'not_participated').length,
    };
  }, [session]);

  const saveSummary = async () => {
    if (!session || !currentTest) return;
    let missingTable = false;
    for (const student of selectedStudents) {
      const participant = session.participants[student.id];
      const finished = participant.status === 'finished';
      const rawSeconds = finished ? secondsFromMs(participant.finishTimeMs) : 0;
      if (finished && !convertRawToGrade(rawSeconds, currentTest.conversionTable || [])) missingTable = true;
      await setTestResult(student.id, currentTest.id, session.setup.semester, rawSeconds, finished ? 'completed' : participant.status, {
        test_date: session.setup.date,
        run_time_seconds: rawSeconds,
        laps_completed: participant.laps || 0,
        route_name: `${session.setup.routeName || ''} ${session.setup.distance || ''}`.trim(),
        live_run_id: session.id,
      });
    }
    await setClassTestStatus(session.setup.classId, currentTest.id, session.setup.semester, 'conducted');
    await loadAll();
    run.closeSession();
    toast.success(missingTable ? 'התוצאות נשמרו. יש להגדיר טבלת המרה לחישוב ציונים מלא.' : 'התוצאות נשמרו למבדקים');
    navigate(`/class/${session.setup.classId}/tests`);
  };

  if (!session) {
    return <Layout title="ריצה Live" backTo="/"><RunSetup data={data} onStart={run.startSession} /></Layout>;
  }

  if (session.phase === 'summary') {
    return (
      <Layout title="סיכום ריצה" backTo="/live-run">
        <RunSummary
          session={session}
          students={selectedStudents}
          test={currentTest}
          settings={data.settings}
          onEdit={run.updateSummaryResult}
          onBack={run.reopenRun}
          onSave={saveSummary}
        />
      </Layout>
    );
  }

  const sortedStudents = sortRunStudents(selectedStudents, session.participants);

  return (
    <Layout title="ריצה Live" subtitle={`${currentClass?.name || ''} · ${currentTest?.name || ''}`}>
      <div className="max-w-[470px] mx-auto px-2 pt-4 pb-24 space-y-4" dir="rtl">
        <section className="text-center space-y-3 sticky top-24 z-20 bg-background/95 backdrop-blur pb-3 border-b border-border/40">
          <div className="font-mono text-5xl font-black tracking-[0.08em] text-foreground" dir="ltr">{formatRunTime(elapsedMs).slice(0, 8)}</div>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> רצים: {counts.running}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600" /> סיימו: {counts.finished}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 px-14">
            {session.running ? (
              <Button onClick={run.pauseTimer} className="h-14 rounded-xl bg-red-600 hover:bg-red-700 text-white text-lg font-bold shadow-md">
                <Square className="w-4 h-4" /> עצור
              </Button>
            ) : (
              <Button onClick={run.startTimer} className="h-14 rounded-xl bg-primary text-primary-foreground text-lg font-bold shadow-md">
                <Play className="w-4 h-4" /> {elapsedMs ? 'המשך' : 'התחל'}
              </Button>
            )}
            <Button variant="outline" onClick={() => counts.running === 0 || window.confirm('יש תלמידים שעדיין רצים. לסיים ולסמן אותם כלא סיימו?') ? run.finishRun() : null} className="h-14 rounded-xl bg-card text-lg font-bold shadow-md">
              <Flag className="w-4 h-4" /> סיים ריצה
            </Button>
          </div>
        </section>

        <div className="space-y-2">
          {sortedStudents.map(student => (
            <RunStudentCard
              key={student.id}
              student={student}
              participant={session.participants[student.id]}
              elapsedMs={elapsedMs}
              lapsRequired={session.setup.lapsRequired}
              onLap={() => run.markLap(student.id)}
              onFinish={() => run.finishStudent(student.id)}
              onUndo={() => run.undoStudent(student.id)}
              onStatus={(status) => run.setStudentStatus(student.id, status)}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}