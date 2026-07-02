import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/app/Layout';
import ProStopwatch from '@/components/live-run/ProStopwatch';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import { useLiveRun } from '@/contexts/LiveRunContext';
import RunSetup from '@/components/live-run/RunSetup';
import RunStudentRow from '@/components/live-run/RunStudentRow';
import RunSummary from '@/components/live-run/RunSummary';
import EditParticipants from '@/components/live-run/EditParticipants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { displayRunStudentName, secondsFromMs } from '@/components/live-run/runUtils';
import { convertRawToGrade } from '@/lib/gradeCalc';

export default function LiveRunPage() {
  const navigate = useNavigate();
  const { data, setClassTestStatus, loadAll } = useApp();
  const run = useLiveRun();
  const { session, elapsedMs } = run;
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);

  const selectedStudents = useMemo(() => {
    if (!session) return [];
    const byId = new Map(data.students.map(s => [s.id, s]));
    return session.selectedIds
      .map(id => byId.get(id) || session.studentsById?.[id])
      .filter(Boolean);
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
  const initial = { classId: params.get('classId') || '', period: params.get('period') || '', date: params.get('date') || '', lock: params.get('lock') === '1' };
  const lockedClass = initial.lock && initial.classId ? data.classes.find(c => c.id === initial.classId) : null;

  const resetRun = () => {
    if (window.confirm('איפוס הריצה ימחק את כל הזמנים הזמניים. להמשיך?')) run.resetRun();
  };



  const saveSummary = async () => {
    if (!session || saving) return;
    setSaving(true);
    try {
      const { classId, date, period, measurementType, trackLength, testId, semester } = session.setup;
      const periodNum = period !== '' && period != null && Number.isFinite(Number(period)) ? Number(period) : null;
      const studentIds = selectedStudents.map(s => s.id);

      // --- Run measurements (batched) ---
      const existing = await base44.entities.RunMeasurement.filter({ class_id: classId, date, measurement_type: measurementType });
      const existingByStudent = Object.fromEntries(existing.filter(r => (r.period ?? null) === periodNum).map(r => [r.student_id, r]));

      const toCreate = [];
      const toUpdate = [];
      for (const student of selectedStudents) {
        const participant = session.participants[student.id];
        const completed = participant.status === 'finished';
        const payload = {
          student_id: student.id, class_id: classId, date, period: periodNum,
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

      // --- Test results (batched) ---
      if (testId) {
        const sem = semester || 'A';
        const existingResults = await base44.entities.TestResult.filter({ test_id: testId, semester: sem, student_id: { $in: studentIds } });
        const resultByStudent = Object.fromEntries(existingResults.map(r => [r.student_id, r]));
        const resCreate = [];
        const resUpdate = [];
        for (const student of selectedStudents) {
          const p = session.participants[student.id];
          const status = p.status === 'finished' ? 'completed' : p.status === 'not_completed' ? 'not_completed' : 'not_participated';
          const raw = p.status === 'finished' && p.finishTimeMs != null ? secondsFromMs(p.finishTimeMs) : null;
          const payload = {
            student_id: student.id, test_id: testId, semester: sem, raw_score: raw, status,
            run_time_seconds: raw, laps_completed: p.laps ?? null, live_run_id: session.id,
          };
          const match = resultByStudent[student.id];
          if (match) resUpdate.push({ id: match.id, ...payload });
          else resCreate.push(payload);
        }
        if (resCreate.length > 0) await base44.entities.TestResult.bulkCreate(resCreate);
        if (resUpdate.length > 0) await base44.entities.TestResult.bulkUpdate(resUpdate);
        await setClassTestStatus(classId, testId, sem, 'conducted');
      }

      await loadAll();
      run.markSaved();
      run.closeSession();
      toast.success(testId ? 'התוצאות נשמרו כציוני המבדק' : 'התוצאות נשמרו');
      navigate(testId ? `/class/${classId}/tests` : `/class/${classId}`);
    } catch (e) {
      console.error('Failed to save run summary:', e);
      toast.error('השמירה נכשלה. בדוק את החיבור ונסה שוב.');
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <Layout
        title={lockedClass ? `ריצה חיה — ${lockedClass.name}` : 'ריצה חיה'}
        subtitle="מדידת תלמידים בשיעורי חנ״ג"
        backTo={lockedClass ? `/class/${lockedClass.id}` : '/'}
      >
        <RunSetup data={data} initial={initial} onStart={run.startSession} />
      </Layout>
    );
  }

  if (session.phase === 'edit') {
    return (
      <Layout title="עריכת משתתפים" subtitle={currentClass?.name || ''}>
        <EditParticipants
          classStudents={data.students.filter(s => s.classId === session.setup.classId)}
          snapshot={session.studentsById}
          selectedIds={session.selectedIds}
          onConfirm={run.updateParticipants}
          onCancel={run.reopenRun}
        />
      </Layout>
    );
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
      <div className="w-full max-w-[520px] mx-auto pb-24 overflow-x-hidden" dir="rtl">
        {/* Pro stopwatch */}
        <section className="px-3 pt-3 pb-2">
          <ProStopwatch onReset={resetRun} onFinish={() => setEndDialogOpen(true)} />
        </section>

        {/* Participants + search bar */}
        <section className="sticky z-30 glass-nav" style={{ top: 'var(--header-h, 0px)' }}>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="text-xs font-bold text-muted-foreground whitespace-nowrap text-right">
              משתתפים{' '}
              <span className="text-primary font-black" dir="ltr">{counts.participating}/{selectedStudents.length}</span>
            </div>
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש תלמיד/ה" className="w-full h-9 rounded-xl liquid-field pr-9 pl-3 text-sm" />
            </div>
            <button onClick={run.openEditParticipants} aria-label="עריכת משתתפים" title="עריכת משתתפים" className="liquid-chip h-9 w-9 rounded-xl flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4" />
            </button>
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
              onLap={() => handleLap(student.id)}
              onNotParticipate={() => run.setStudentStatus(student.id, 'not_participated')}
              onUndo={() => run.undoStudent(student.id)}
            />
          ))}
          {sortedStudents.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">לא נמצאו תלמידים.</div>}
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