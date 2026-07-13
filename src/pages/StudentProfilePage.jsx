import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageCircle, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/store/AppProvider';
import { useAuth } from '@/lib/AuthContext';
import { calculateAnnualGrade, isTestEligibleForClass } from '@/lib/gradeCalc';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import StudentGradeBreakdown from '@/components/grades/StudentGradeBreakdown';
import StudentInfoCard from '@/components/student-profile/StudentInfoCard';
import ClassComparisonSection from '@/components/student-profile/ClassComparisonSection';
import TestResultsSection from '@/components/student-profile/TestResultsSection';
import BehaviorSection from '@/components/student-profile/BehaviorSection';
import RunHistorySection from '@/components/student-profile/RunHistorySection';
import { formatStudentName } from '@/lib/studentName';
import EducatorManagerDialog from '@/components/whatsapp/EducatorManagerDialog';
import WhatsAppMessageDialog from '@/components/whatsapp/WhatsAppMessageDialog';

export default function StudentProfilePage() {
  const { classId, studentId } = useParams();
  const { data, setBehaviorGrade, updateHomeroomContacts } = useApp();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [runMeasurements, setRunMeasurements] = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [runError, setRunError] = useState(null);
  const [runReloadKey, setRunReloadKey] = useState(0);
  const [messageOpen, setMessageOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  const cls = data.classes.find(c => c.id === classId);
  const student = data.students.find(s => s.id === studentId);
  const educatorContacts = useMemo(() => (Array.isArray(cls?.homeroomContacts) ? cls.homeroomContacts : []).map((contact, index) => ({
    id: contact.id || `educator_${classId}_${index}`,
    name: contact.name || '',
    phone: contact.phone || '',
  })), [cls?.homeroomContacts, classId]);

  const classTests = useMemo(() => {
    if (!cls) return [];
    return data.tests.filter(test => isTestEligibleForClass(test, cls));
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
    let requestVersion = 0;
    setRunMeasurements([]);
    const loadRuns = async () => {
      if (!active) return;
      const requestId = ++requestVersion;
      setLoadingRuns(true);
      setRunError(null);
      try {
        const rows = await base44.entities.RunMeasurement.filter({ student_id: studentId }, '-created_date', 500);
        if (active && requestId === requestVersion) setRunMeasurements(rows || []);
      } catch (error) {
        console.error('Failed to load student run history', error);
        if (active && requestId === requestVersion) setRunError(error);
      }
      if (active && requestId === requestVersion) setLoadingRuns(false);
    };
    loadRuns();
    const unsubscribe = base44.entities.RunMeasurement.subscribe(event => {
      if (event?.data?.student_id === studentId) loadRuns();
    });
    return () => { active = false; requestVersion += 1; unsubscribe?.(); };
  }, [studentId, runReloadKey]);

  if (!cls || !student) {
    return (
      <Layout title="תלמיד לא נמצא" backTo={`/class/${classId}`}>
        <p className="text-center text-muted-foreground py-16">התלמיד לא נמצא</p>
      </Layout>
    );
  }

  const openEducatorMessage = () => {
    if (educatorContacts.length > 0) {
      setMessageOpen(true);
      return;
    }
    if (isAdmin) {
      setManagerOpen(true);
      return;
    }
    toast.info('לא הוגדרו פרטי מחנכ/ת לכיתה זו');
  };

  return (
    <Layout title={formatStudentName(student)} backTo={`/class/${classId}`} subtitle={cls.name}>
      <div className="max-w-3xl mx-auto space-y-3 p-4" dir="rtl">
        <section className="glass-surface rounded-2xl p-3 flex items-center gap-2" aria-label="יצירת קשר עם מחנכי הכיתה">
          <Button type="button" onClick={openEducatorMessage} className="min-h-11 flex-1 gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {educatorContacts.length > 0 ? 'שליחת WhatsApp למחנך/ת' : isAdmin ? 'הגדרת מחנך/ת ושליחת הודעה' : 'לא הוגדר מחנך/ת'}
          </Button>
          {isAdmin && educatorContacts.length > 0 && (
            <Button type="button" variant="outline" size="icon" onClick={() => setManagerOpen(true)} className="h-11 w-11 shrink-0" aria-label={`ניהול מחנכים לכיתה ${cls.name}`}>
              <Settings2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </section>
        <StudentInfoCard student={student} cls={cls} />
        {annual && <StudentGradeBreakdown annual={annual} viewMode="annual" />}
        <ClassComparisonSection cls={cls} student={student} classTests={classTests} conductedTestIdsA={conductedTestIdsA} conductedTestIdsB={conductedTestIdsB} />
        <TestResultsSection student={student} tests={classTests} results={data.results} />
        <BehaviorSection studentId={studentId} behaviorGrades={data.behaviorGrades} onSave={setBehaviorGrade} />
        <RunHistorySection
          measurements={runMeasurements}
          loading={loadingRuns}
          error={runError}
          onRetry={() => setRunReloadKey(key => key + 1)}
        />
      </div>

      {isAdmin && (
        <EducatorManagerDialog
          open={managerOpen}
          onOpenChange={setManagerOpen}
          className={cls.name}
          contacts={educatorContacts}
          onSave={contacts => updateHomeroomContacts(classId, contacts)}
          onStartMessage={() => { setManagerOpen(false); setMessageOpen(true); }}
        />
      )}
      <WhatsAppMessageDialog
        open={messageOpen}
        onOpenChange={setMessageOpen}
        cls={cls}
        contacts={educatorContacts}
        students={[student]}
        initialStudentId={student.id}
        canManage={isAdmin}
        onManage={() => { setMessageOpen(false); setManagerOpen(true); }}
      />
    </Layout>
  );
}
