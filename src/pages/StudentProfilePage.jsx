import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import { calculateAnnualGrade } from '@/lib/gradeCalc';
import Layout from '@/components/app/Layout';
import StudentGradeBreakdown from '@/components/grades/StudentGradeBreakdown';
import StudentInfoCard from '@/components/student-profile/StudentInfoCard';
import ClassComparisonSection from '@/components/student-profile/ClassComparisonSection';
import TestResultsSection from '@/components/student-profile/TestResultsSection';
import BehaviorSection from '@/components/student-profile/BehaviorSection';
import RunHistorySection from '@/components/student-profile/RunHistorySection';
import { formatStudentName } from '@/lib/studentName';

export default function StudentProfilePage() {
  const { classId, studentId } = useParams();
  const { data, setBehaviorGrade } = useApp();
  const [runMeasurements, setRunMeasurements] = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(true);

  const cls = data.classes.find(c => c.id === classId);
  const student = data.students.find(s => s.id === studentId);

  const classTests = useMemo(() => {
    if (!cls) return [];
    const gender = cls.genderTrack || 'boys';
    return data.tests
      .filter(t => !cls.gradeLevel || t.gradeLevel === cls.gradeLevel)
      .filter(t => (t.genderTrack || 'boys') === gender);
  }, [data.tests, cls]);

  const conductedTestIdsA = useMemo(
    () => data.classTestStatuses.filter(s => s.classId === classId && s.semester === 'A' && s.status === 'conducted').map(s => s.testId),
    [data.classTestStatuses, classId]
  );
  const conductedTestIdsB = useMemo(
    () => data.classTestStatuses.filter(s => s.classId === classId && s.semester === 'B' && s.status === 'conducted').map(s => s.testId),
    [data.classTestStatuses, classId]
  );

  const annual = useMemo(() => {
    if (!student) return null;
    return calculateAnnualGrade(student.id, classTests, data.results, data.behaviorGrades, data.settings, conductedTestIdsA, conductedTestIdsB, student.peExempt);
  }, [student, classTests, data.results, data.behaviorGrades, data.settings, conductedTestIdsA, conductedTestIdsB]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingRuns(true);
      try {
        const rows = await base44.entities.RunMeasurement.filter({ student_id: studentId });
        if (active) setRunMeasurements(rows || []);
      } catch {
        if (active) setRunMeasurements([]);
      }
      if (active) setLoadingRuns(false);
    })();
    return () => { active = false; };
  }, [studentId]);

  if (!cls || !student) {
    return (
      <Layout title="תלמיד לא נמצא" backTo={`/class/${classId}`}>
        <p className="text-center text-muted-foreground py-16">התלמיד לא נמצא</p>
      </Layout>
    );
  }

  return (
    <Layout title={formatStudentName(student)} backTo={`/class/${classId}`} subtitle={cls.name}>
      <div className="max-w-3xl mx-auto space-y-3 p-4" dir="rtl">
        <StudentInfoCard student={student} cls={cls} />
        {annual && <StudentGradeBreakdown annual={annual} viewMode="annual" />}
        <ClassComparisonSection cls={cls} student={student} classTests={classTests} conductedTestIdsA={conductedTestIdsA} conductedTestIdsB={conductedTestIdsB} />
        <TestResultsSection student={student} tests={classTests} results={data.results} />
        <BehaviorSection studentId={studentId} behaviorGrades={data.behaviorGrades} onSave={setBehaviorGrade} />
        <RunHistorySection measurements={runMeasurements} loading={loadingRuns} />
      </div>
    </Layout>
  );
}