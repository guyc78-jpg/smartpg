import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Flag, Play, RotateCcw, Search, Square, Target } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import { useLiveRun } from '@/contexts/LiveRunContext';
import RunSetup from '@/components/live-run/RunSetup';
import RunStudentCard from '@/components/live-run/RunStudentCard';
import RunSummary from '@/components/live-run/RunSummary';
import { formatRunTime, secondsFromMs, sortRunStudents } from '@/components/live-run/runUtils';
import { convertRawToGrade } from '@/lib/gradeCalc';

export default function LiveRunPage() {
  const navigate = useNavigate();
  const { data, setTestResult, setClassTestStatus } = useApp();
  const run = useLiveRun();
  const { session, elapsedMs } = run;
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedStudents = useMemo(() => {
    if (!session) return [];
    return data.students.filter(s => session.selectedIds.includes(s.id));
  }, [data.students, session]);

  const currentClass = data.classes.find(c => c.id === session?.setup?.classId);
  const selectedTest = useMemo(() => data.tests.find(t => t.id === session?.setup?.testId) || null, [data.tests, session?.setup?.testId]);
  const totalLaps = session?.setup?.totalLaps || 1;
  const passThreshold = data.settings?.gradeColorThresholds?.redBelow ?? 55;

  const gradeFor = (participant) => {
    if (!selectedTest || participant.status !== 'finished' || participant.finishTimeMs == null) return null;
    return convertRawToGrade(secondsFromMs(participant.finishTimeMs), selectedTest.conversionTable);
  };

  const counts = useMemo(() => {
    const values = Object.values(session?.participants || {});
    return {
      running: values.filter(p => p.status === 'running').length,
      finished: values.filter(p => p.status === 'finished').length,
    };
  }, [session]);

  const params = new URLSearchParams(window.location.search);
  const initial = { classId: params.get('classId') || '', period: params.get('period') || '', date: params.get('date') || '' };

  const resetRun = () => {
    if (window.confirm('איפוס הריצה ימחק את כל הזמנים הזמניים. להמשיך?')) run.resetRun();
  };

  const finishRun = () => {
    if (window.confirm('לעבור למסך סיכום? תלמידים שעדיין רצים יסומנו כלא השלימו / לא השתתפו.')) run.finishRun();
  };

  const saveSummary = async () => {
    if (!session || saving) return;
    setSaving(true);
    try {
      const { classId, date, period, measurementType, trackLength, testId, semester } = session.setup;

      const existing = await base44.entities.RunMeasurement.filter({ class_id: classId, date, period, measurement_type: measurementType });
      const existingByStudent = Object.fromEntries(existing.map(r => [r.student_id, r]));

      const toCreate = [];
      const toUpdate = [];
      for (const student of selectedStudents) {
        const participant = session.participants[student.id];
        const completed = participant.status === 'finished';
        const payload = {
          student_id: student.id, class_id: classId, date, period,
          measurement_type: measurementType,
          result_seconds: completed ? secondsFromMs(participant.finishTimeMs) : null,
          result_distance: participant.laps && trackLength ? Math.round(participant.laps * trackLength) : null,
          status: completed ? 'finished' : 'not_participated',
        };
        const match = existingByStudent[student.id];
        if (match) toUpdate.push({ id: match.id, ...payload });
        else toCreate.push(payload);
      }
      if (toCreate.length > 0) await base44.entities.RunMeasurement.bulkCreate(toCreate);
      if (toUpdate.length > 0) await base44.entities.RunMeasurement.bulkUpdate(toUpdate);

      if (testId) {
        for (const student of selectedStudents) {
          const p = session.participants[student.id];
          const status = p.status === 'finished' ? 'completed' : p.status === 'not_completed' ? 'not_completed' : 'not_participated';
          const raw = p.status === 'finished' && p.finishTimeMs != null ? secondsFromMs(p.finishTimeMs) : null;
          await setTestResult(student.id, testId, semester || 'A', raw, status, {
            run_time_seconds: raw, laps_completed: p.laps ?? null, live_run_id: session.id,
          });
        }
        await setClassTestStatus(classId, testId, semester || 'A', 'conducted');
      }

      run.markSaved();
      run.closeSession();
      toast.success(testId ? 'התוצאות נשמרו כציוני המבדק' : 'התוצאות נשמרו');
      navigate(testId ? `/class/${classId}/tests` : `/class/${classId}`);
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return <Layout title="ריצה חיה" subtitle="מדידת תלמידים בשיעורי חנ״ג" backTo="/"><RunSetup data={data} initial={initial} onStart={run.startSession} /></Layout>;
  }

  if (session.phase === 'summary') {
    return (
      <Layout title="סיכום ריצה" subtitle={`${currentClass?.name || ''} · ${session.setup.measurementLabel || ''}`} backTo="/live-run">
        <RunSummary session={session} students={selectedStudents} className={currentClass?.name} test={selectedTest} passThreshold={passThreshold} onEdit={run.updateSummaryResult} onBack={run.reopenRun} onSave={saveSummary} saving={saving} />
      </Layout>
    );
  }

  const searchTerm = search.trim().toLowerCase();
  const sortedStudents = sortRunStudents(selectedStudents, session.participants)
    .filter(s => !searchTerm || `${s.name || ''} ${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(searchTerm));

  return (
    <Layout title="ריצה חיה" subtitle={`${currentClass?.name || ''} · ${session.setup.measurementLabel || ''}`}>
      <div className="max-w-[520px] mx-auto px-2 pt-3 pb-28 space-y-3" dir="rtl">
        <section className="sticky z-30 rounded-b-3xl bg-background/95 backdrop-blur border-b px-2 pb-3 text-center space-y-3 relative" style={{ top: 'var(--header-h, 0px)' }}>
          <button onClick={resetRun} aria-label="איפוס ריצה" className="absolute left-2 top-2 h-7 w-7 rounded-full text-muted-foreground hover:bg-muted flex items-center justify-center" title="איפוס ריצה">
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="font-mono text-6xl font-black tracking-wider text-foreground" dir="ltr">{formatRunTime(elapsedMs)} 🏃</div>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-semibold">
            <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> רצים: {counts.running}</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> סיימו: {counts.finished}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {session.running ? (
              <Button onClick={run.pauseTimer} className="h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-lg font-black"><Square className="w-4 h-4" /> עצור</Button>
            ) : (
              <Button onClick={run.startTimer} className="h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-lg font-black"><Play className="w-4 h-4" /> {elapsedMs ? 'המשך' : 'התחל'}</Button>
            )}
            <Button variant="outline" onClick={finishRun} className="h-14 rounded-2xl text-lg font-black"><Flag className="w-4 h-4" /> סיים ריצה</Button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש תלמיד/ה" className="w-full h-10 rounded-xl border border-input bg-background pr-9 pl-3 text-sm" />
          </div>
        </section>

        <div className="space-y-2">
          {sortedStudents.map(student => (
            <RunStudentCard
              key={student.id}
              student={student}
              participant={session.participants[student.id]}
              totalLaps={totalLaps}
              grade={gradeFor(session.participants[student.id])}
              passThreshold={passThreshold}
              onFinish={() => run.finishStudent(student.id)}
              onNotParticipate={() => run.setStudentStatus(student.id, 'not_participated')}
              onUndo={() => run.undoStudent(student.id)}
              onSetLaps={(laps) => run.setLaps(student.id, laps)}
            />
          ))}
          {sortedStudents.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">לא נמצאו תלמידים.</div>}
        </div>
      </div>
    </Layout>
  );
}