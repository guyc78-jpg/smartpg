import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '@/store/AppProvider';
import { calculateAnnualGrade } from '@/lib/gradeCalc';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Search, ClipboardList, ShieldOff, Award, Upload, UserCheck, Timer, TrendingUp, MessageSquare, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDeleteDialog from '@/components/app/ConfirmDeleteDialog';
import StudentFormDialog from '@/components/students/StudentFormDialog';
import ImportStudentsDialog from '@/components/students/ImportStudentsDialog';
import StudentGradeBreakdown from '@/components/grades/StudentGradeBreakdown';
import { SEMESTER_LABELS, GENDER_TRACK_LABELS } from '@/lib/types';
import { formatStudentName } from '@/lib/studentName';

const GENDER_LABELS = { boys: 'בן', girls: 'בת', other: 'אחר' };

function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground">
      <Icon className="w-3 h-3" />
      <span>{label}</span>
      {value !== undefined && <span className="font-semibold text-foreground">{value}</span>}
    </div>
  );
}

export default function ClassPage() {
  const { classId } = useParams();
  const { data, addStudent, deleteStudent, editStudent, importStudents } = useApp();
  const [search, setSearch] = useState('');
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteStudentTarget, setDeleteStudentTarget] = useState(null);
  const [viewMode, setViewMode] = useState('A');

  const cls = data.classes.find(c => c.id === classId);
  const isGrade12 = cls?.gradeLevel === 'יב';

  const classTests = useMemo(() => {
    if (!cls) return [];
    const classGenderTrack = cls.genderTrack || 'boys';
    return data.tests
      .filter(t => !cls.gradeLevel || t.gradeLevel === cls.gradeLevel)
      .filter(t => (t.genderTrack || 'boys') === classGenderTrack);
  }, [data.tests, cls?.gradeLevel, cls?.genderTrack]);

  const students = useMemo(
    () => data.students
      .filter(s => s.classId === classId)
      .sort((a, b) => formatStudentName(a).localeCompare(formatStudentName(b), 'he')),
    [data.students, classId]
  );

  const conductedTestIdsA = useMemo(
    () => data.classTestStatuses.filter(s => s.classId === classId && s.semester === 'A' && s.status === 'conducted').map(s => s.testId),
    [data.classTestStatuses, classId]
  );
  const conductedTestIdsB = useMemo(
    () => data.classTestStatuses.filter(s => s.classId === classId && s.semester === 'B' && s.status === 'conducted').map(s => s.testId),
    [data.classTestStatuses, classId]
  );

  const filtered = useMemo(() => {
    if (!search) return students;
    return students.filter(s => [formatStudentName(s), s.studyGroup, s.medicalLimitations, s.peNotes].filter(Boolean).some(v => v.includes(search)));
  }, [students, search]);

  const classLessons = useMemo(
    () => (data.lessonTopics || [])
      .filter(l => l.classId === classId && !l.isTemplate)
      .sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [data.lessonTopics, classId]
  );

  if (!cls) {
    return (
      <Layout title="כיתה לא נמצאה" backTo="/">
        <p className="text-center text-muted-foreground py-16">הכיתה לא נמצאה</p>
      </Layout>
    );
  }

  const openAdd = () => {
    setEditingStudent(null);
    setStudentDialogOpen(true);
  };

  const openEdit = (student) => {
    setEditingStudent(student);
    setStudentDialogOpen(true);
  };

  const handleSaveStudent = async (studentData) => {
    if (editingStudent) {
      await editStudent(editingStudent.id, studentData);
      toast.success('התלמיד עודכן');
    } else {
      await addStudent({ ...studentData, classId });
      toast.success('תלמיד נוסף');
    }
  };

  const handleImport = async (studentsToImport) => {
    const count = await importStudents(studentsToImport.map(s => ({ ...s, classId })), classId);
    toast.success(`יובאו ${count} תלמידים`);
  };

  return (
    <Layout
      title={cls.name}
      backTo="/"
      subtitle={`${students.length} תלמידים • ${GENDER_TRACK_LABELS[cls.genderTrack] || 'חנ״ג'}`}
      titleAction={
        <div className="flex gap-1">
          <Link to={`/class/${classId}/tests`}>
            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
              <ClipboardList className="w-3.5 h-3.5" /> מבדקים
            </Button>
          </Link>
          {isGrade12 && (
            <Link to={`/class/${classId}/bagrut`}>
              <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                <Award className="w-3.5 h-3.5" /> בגרות
              </Button>
            </Link>
          )}
        </div>
      }
    >
      <div className="max-w-3xl mx-auto space-y-3 p-4" dir="rtl">
        <div className="flex gap-2">
          {['A', 'B', 'annual'].map(mode => (
            <Button key={mode} variant={viewMode === mode ? 'default' : 'outline'} onClick={() => setViewMode(mode)} className="flex-1 h-9 text-xs font-semibold">
              {mode === 'annual' ? 'שנתי' : SEMESTER_LABELS[mode]}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={openAdd} className="h-11 rounded-xl gap-2 font-semibold"><Plus className="w-4 h-4" /> הוסף תלמיד</Button>
          <Button onClick={() => setImportDialogOpen(true)} variant="outline" className="h-11 rounded-xl gap-2 font-semibold"><Upload className="w-4 h-4" /> ייבוא Excel/CSV</Button>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש תלמיד, קבוצה או הערה..." className="h-10 pr-9 text-sm" />
        </div>

        <Card className="card-3d rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm"><CalendarDays className="w-4 h-4 text-primary" /> היסטוריית שיעורי חנ״ג</div>
            <Badge variant="secondary" className="text-[10px]">{classLessons.length} שיעורים</Badge>
          </div>
          <div className="space-y-1">
            {classLessons.slice(0, 3).map(lesson => (
              <div key={lesson.id} className="flex items-center justify-between gap-2 text-xs rounded-lg bg-muted/40 px-2 py-1.5">
                <span className="font-medium truncate">{lesson.topic}</span>
                <span className="text-muted-foreground shrink-0">{new Date(lesson.date).toLocaleDateString('he-IL')}</span>
              </div>
            ))}
            {classLessons.length === 0 && <p className="text-xs text-muted-foreground">אין עדיין שיעורים שמורים לכיתה זו.</p>}
          </div>
        </Card>

        <div className="space-y-2">
          {filtered.map(student => {
            const annual = calculateAnnualGrade(student.id, classTests, data.results, data.behaviorGrades, data.settings, conductedTestIdsA, conductedTestIdsB, student.peExempt);
            const displayGrade = viewMode === 'annual' ? annual.annualGrade : viewMode === 'A' ? annual.semA.semesterFinalGrade : annual.semB.semesterFinalGrade;
            const completedResults = data.results.filter(r => r.studentId === student.id && r.status === 'completed').length;
            const progress = classTests.length ? `${completedResults}/${classTests.length}` : '—';
            const redBelow = data.settings.gradeColorThresholds?.redBelow ?? 55;
            const isLow = displayGrade !== null && displayGrade < redBelow;

            return (
              <Card key={student.id} className={`card-3d rounded-2xl p-3 space-y-3 ${student.peExempt ? 'opacity-75' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-[15px] truncate">{formatStudentName(student)}</h3>
                      {student.peExempt && (
                        <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive bg-destructive/5">
                          <ShieldOff className="w-2.5 h-2.5 ml-0.5" />פטור
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1 text-[11px] text-muted-foreground">
                      {student.gender && <span>{GENDER_LABELS[student.gender] || student.gender}</span>}
                      {student.studyGroup && <span>• {student.studyGroup}</span>}
                      <span>• {cls.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {displayGrade !== null && !student.peExempt && (
                      <div className={`rounded-lg px-2.5 py-1 min-w-[42px] text-center ${isLow ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                        <span className={`text-sm font-bold ${isLow ? 'text-destructive' : 'text-primary'}`}>{displayGrade}</span>
                      </div>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(student)}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteStudentTarget({ id: student.id, name: formatStudentName(student) })}><Trash2 className="w-3.5 h-3.5 text-destructive/70" /></Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  <InfoChip icon={UserCheck} label="נוכחות" />
                  <InfoChip icon={ClipboardList} label="מבדקים" value={completedResults} />
                  <InfoChip icon={Award} label="ציונים" value={displayGrade ?? '—'} />
                  <InfoChip icon={Timer} label="ריצה חיה" />
                  <InfoChip icon={MessageSquare} label="הערות" value={student.peNotes ? 'יש' : '—'} />
                  <InfoChip icon={CalendarDays} label="שיעורים" value={classLessons.length} />
                  <InfoChip icon={TrendingUp} label="התקדמות" value={progress} />
                </div>

                <StudentGradeBreakdown annual={annual} viewMode={viewMode} />

                {(student.medicalLimitations || student.peNotes) && (
                  <div className="space-y-1 rounded-xl bg-muted/40 p-2 text-xs text-muted-foreground">
                    {student.medicalLimitations && <p><span className="font-semibold text-foreground">רפואי:</span> {student.medicalLimitations}</p>}
                    {student.peNotes && <p><span className="font-semibold text-foreground">מקצועי:</span> {student.peNotes}</p>}
                  </div>
                )}
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-sm">
              {students.length === 0 ? 'אין תלמידים בכיתה. הוסף תלמיד או ייבא קובץ.' : 'לא נמצאו תלמידים.'}
            </p>
          )}
        </div>

        <StudentFormDialog
          open={studentDialogOpen}
          onOpenChange={setStudentDialogOpen}
          student={editingStudent}
          classes={data.classes.filter(c => (c.status || 'active') === 'active')}
          defaultClassId={classId}
          onSave={handleSaveStudent}
        />

        <ImportStudentsDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImport={handleImport} />

        <ConfirmDeleteDialog
          open={!!deleteStudentTarget}
          onOpenChange={() => setDeleteStudentTarget(null)}
          title={`מחיקת ${deleteStudentTarget?.name}`}
          description="מחיקת התלמיד תסיר אותו מרשימת התלמידים, אך לא תמחק רשומות ציונים או מבדקים קיימות. האם למחוק בכל זאת?"
          onConfirm={() => { deleteStudent(deleteStudentTarget.id); setDeleteStudentTarget(null); toast.success('התלמיד נמחק'); }}
        />
      </div>
    </Layout>
  );
}