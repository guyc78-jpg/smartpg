import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pause, Play, RotateCcw, Search, Square } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import { useLiveRun } from '@/contexts/LiveRunContext';
import RunSetup from '@/components/live-run/RunSetup';
import RunStudentRow from '@/components/live-run/RunStudentRow';
import RunSummary from '@/components/live-run/RunSummary';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { displayRunStudentName, formatClockTime, secondsFromMs } from '@/components/live-run/runUtils';
import { convertRawToGrade } from '@/lib/gradeCalc';

export default function LiveRunPage() {
  const navigate = useNavigate();
  const { data, setTestResult, setClassTestStatus, setAttendance } = useApp();
  const run = useLiveRun();
  const { session, elapsedMs } = run;
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);

  const selectedStudents = useMemo(() => {
    if (!session) return [];
    return data.students.filter(s => session.selectedIds.includes(s.id));
  }, [data.students, session]);

  const currentClass = data.classes.find(c => c.id === session?.setup?.classId);
  const selectedTest = useMemo(() => data.tests.find(t => t.id === session?.setup?.testId) || null, [data.tests, session?.setup?.testId]);
  const totalLaps = session?.setup?.totalLaps || 1;
  const passThreshold = data.settings?.gradeColorThresholds?.redBelow ?? 55;

  const attendanceByStudent = useMemo(() => {
    const map = {};
    (data.attendance || [])
      .filter(a => a.classId === session?.setup?.classId && a.date === session?.setup?.date)
      .forEach(a => { map[a.studentId] = a.status; });
    return map;
  }, [data.attendance, session?.setup?.classId, session?.setup?.date]);

  const handleAttendance = (studentId, status) => {
    setAttendance(studentId, session.setup.classId, session.setup.date, status);
    if ((status === 'absent' || status === 'excused') && session.participants[studentId]?.status === 'running') {
      run.setStudentStatus(studentId, 'not_participated');
    }
    toast.success(status === 'present' ? 'סומן כנוכח' : status === 'absent' ? 'סומן כנעדר' : 'סומן כפטור');
  };

  const gradeFor = (participant) => {
    if (!selectedTest || participant.status !== 'finished' || participant.finishTimeMs == null) return null;
    return convertRawToGrade(secondsFromMs(participant.finishTimeMs), selectedTest.conversionTable);
  };

  const counts = useMemo(() => {
    const values = Object.values(session?.participants || {});
    return {
      running: values.filter(p => p.status === 'running').length,
      finished: values.filter(p => p.status === 'finished').length,
      participating: values.filter(p => p.status === 'running' || p.status === 'finished').length,
    };
  }, [session]);

  const handleLap = (studentId) => {
    const p = session?.participants?.[studentId];
    if (!p || p.status !== 'running') return;
    if ((p.laps || 0) + 1 >= totalLaps) run.finishStudent(studentId);
    else run.markLap(studentId);
  };

  const params = new URLSearchParams(window.location.search);
  const initial = { classId: params.get('classId') || '', period: params.get('period') || '', date: params.get('date') || '' };

  const resetRun = () => {
    if (window.confirm('איפוס הריצה ימחק את כל הזמנים הזמניים. להמשיך?')) run.resetRun();
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
  const raceStarted = session.running || elapsedMs > 0;
  const sortedStudents = [...selectedStudents]
    .sort((a, b) => displayRunStudentName(a).localeCompare(displayRunStudentName(b), 'he'))
    .filter(s => !searchTerm || `${s.name || ''} ${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(searchTerm));

  return (
    <Layout title="ריצה חיה" subtitle={`${currentClass?.name || ''} · ${session.setup.measurementLabel || ''}`}>
      <div className="max-w-[520px] mx-auto pb-44" dir="rtl">
        {/* Stats bar */}
        <section className="sticky z-30 bg-muted/70 backdrop-blur border-b" style={{ top: 'var(--header-h, 0px)' }}>
          <div className="grid grid-cols-2 text-center py-2.5 relative">
            <div className="border-l border-border/60">
              <p className="text-xs text-muted-foreground font-semibold">משתתפים</p>
              <p className="text-lg font-black text-primary leading-tight" dir="ltr">{counts.participating}/{selectedStudents.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">זמן כולל</p>
              <p className="text-lg font-black text-primary font-mono leading-tight" dir="ltr">{formatClockTime(elapsedMs)}</p>
            </div>
            <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
              {raceStarted && (
                <button onClick={session.running ? run.pauseTimer : run.startTimer} aria-label={session.running ? 'השהה' : 'המשך'} className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted flex items-center justify-center">
                  {session.running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              )}
              <button onClick={resetRun} aria-label="איפוס ריצה" title="איפוס ריצה" className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted flex items-center justify-center">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="px-3 pb-2 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute right-6 top-1/2 -translate-y-[calc(50%+4px)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש תלמיד/ה" className="w-full h-9 rounded-xl border border-input bg-background pr-9 pl-3 text-sm" />
          </div>
        </section>

        {/* Student list */}
        <div className="bg-card">
          {sortedStudents.map(student => (
            <RunStudentRow
              key={student.id}
              student={student}
              participant={session.participants[student.id]}
              raceStarted={raceStarted}
              raceRunning={session.running}
              grade={gradeFor(session.participants[student.id])}
              passThreshold={passThreshold}
              attendanceStatus={attendanceByStudent[student.id]}
              onAttendanceChange={(status) => handleAttendance(student.id, status)}
              onLap={() => handleLap(student.id)}
              onNotParticipate={() => run.setStudentStatus(student.id, 'not_participated')}
              onUndo={() => run.undoStudent(student.id)}
            />
          ))}
          {sortedStudents.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">לא נמצאו תלמידים.</div>}
        </div>
      </div>

      {/* Fixed bottom action */}
      <div className="fixed inset-x-0 z-40 px-4 bottom-[calc(80px+env(safe-area-inset-bottom,0px))] md:bottom-4">
        <div className="max-w-[520px] mx-auto">
          {session.running ? (
            <Button onClick={() => setEndDialogOpen(true)} className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-lg font-black btn-3d">
              <Square className="w-5 h-5 fill-current" /> סיום מרוץ
            </Button>
          ) : (
            <Button onClick={run.startTimer} className="w-full h-14 rounded-2xl text-lg font-black btn-3d">
              <Play className="w-5 h-5 fill-current" /> {elapsedMs > 0 ? 'המשך מרוץ' : 'התחל מרוץ'}
            </Button>
          )}
        </div>
      </div>

      {/* End race confirmation */}
      <AlertDialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <AlertDialogContent dir="rtl" className="max-w-[360px] rounded-2xl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="text-right">סיום מרוץ</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              האם ברצונך לסיים את מרוץ {session.setup.measurementLabel || 'הריצה'}? תלמידים שעדיין רצים יסומנו כלא השלימו / לא השתתפו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 mt-0">ביטול</AlertDialogCancel>
            <AlertDialogAction className="flex-1" onClick={() => run.finishRun()}>אישור</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}