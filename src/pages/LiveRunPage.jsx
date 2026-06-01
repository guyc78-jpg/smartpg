import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pause, Play, RotateCcw, Square, TimerReset } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    return <Layout title="ריצה חיה"><RunSetup data={data} onStart={run.startSession} /></Layout>;
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
    <Layout title="ריצה חיה" subtitle={`${currentClass?.name || ''} · ${currentTest?.name || ''}`}>
      <div className="max-w-5xl mx-auto p-3 md:p-4 space-y-4" dir="rtl">
        <Card className="card-3d rounded-3xl p-4 text-center space-y-4 sticky top-24 z-20 glass-surface">
          <div className="font-mono text-5xl md:text-7xl font-black tracking-tight" dir="ltr">{formatRunTime(elapsedMs)}</div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Badge variant="secondary" className="justify-center py-1">רצים {counts.running}</Badge>
            <Badge variant="secondary" className="justify-center py-1">סיימו {counts.finished}</Badge>
            <Badge variant="secondary" className="justify-center py-1">לא סיימו {counts.not_completed}</Badge>
            <Badge variant="secondary" className="justify-center py-1">לא השתתפו {counts.not_participated}</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {!session.running ? (
              <Button onClick={run.startTimer} className="h-12 font-bold btn-3d"><Play className="w-4 h-4" /> {elapsedMs ? 'המשך' : 'התחל'}</Button>
            ) : (
              <Button onClick={run.pauseTimer} variant="outline" className="h-12 font-bold"><Pause className="w-4 h-4" /> עצור</Button>
            )}
            <Button variant="outline" onClick={() => window.confirm('לאפס את הריצה ולמחוק את המדידה הנוכחית?') && run.resetSession()} className="h-12 font-bold"><RotateCcw className="w-4 h-4" /> איפוס</Button>
            <Button variant="outline" onClick={() => counts.running === 0 || window.confirm('יש תלמידים שעדיין רצים. לסיים ולסמן אותם כלא סיימו?') ? run.finishRun() : null} className="h-12 font-bold sm:col-span-2"><Square className="w-4 h-4" /> סיום ריצה</Button>
            <Button variant="ghost" onClick={() => navigate('/')} className="h-12 font-bold"><TimerReset className="w-4 h-4" /> מזער</Button>
          </div>
        </Card>

        <div className="space-y-3 pb-20">
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