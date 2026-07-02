import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '@/store/AppProvider';
import { calculateAnnualGrade } from '@/lib/gradeCalc';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ClipboardList, Award, Upload, Users, BookOpen } from 'lucide-react';
import ClassLessonJournal from '@/components/class/ClassLessonJournal';
import { toast } from 'sonner';
import ConfirmDeleteDialog from '@/components/app/ConfirmDeleteDialog';
import StudentFormDialog from '@/components/students/StudentFormDialog';
import ImportStudentsDialog from '@/components/students/ImportStudentsDialog';
import StudentCard from '@/components/students/StudentCard';
import { SEMESTER_LABELS, GENDER_TRACK_LABELS } from '@/lib/types';
import { formatStudentName } from '@/lib/studentName';

export default function ClassPage() {
  const { classId } = useParams();
  const { data, addStudent, deleteStudent, editStudent, importStudents } = useApp();
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteStudentTarget, setDeleteStudentTarget] = useState(null);
  const [viewMode, setViewMode] = useState('A');
  const [tab, setTab] = useState('students');

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
      .sort((a, b) =>
        (a.lastName || '').localeCompare(b.lastName || '', 'he')
        || (a.firstName || '').localeCompare(b.firstName || '', 'he')
        || formatStudentName(a).localeCompare(formatStudentName(b), 'he')),
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
    const result = await importStudents(studentsToImport.map(s => ({ ...s, classId })), classId);
    toast.success(`יובאו ${result.added} תלמידים`);
    return result;
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
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTab('students')}
            className={`h-10 rounded-xl liquid-chip flex items-center justify-center gap-2 text-sm ${tab === 'students' ? 'liquid-chip-active' : ''}`}
          >
            <Users className="w-4 h-4" /> תלמידים
          </button>
          <button
            onClick={() => setTab('journal')}
            className={`h-10 rounded-xl liquid-chip flex items-center justify-center gap-2 text-sm ${tab === 'journal' ? 'liquid-chip-active' : ''}`}
          >
            <BookOpen className="w-4 h-4" /> יומן שיעורים
          </button>
        </div>

        {tab === 'journal' ? (
          <ClassLessonJournal classId={classId} />
        ) : (
        <>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="חיפוש מהיר: הקלד שם תלמיד..."
            className="h-11 pr-9 text-sm rounded-xl"
          />
          {showSuggestions && search && filtered.length > 0 && (
            <div className="absolute inset-x-0 top-full mt-1 z-30 rounded-xl glass-surface shadow-xl overflow-hidden">
              {filtered.slice(0, 6).map(s => (
                <button
                  key={s.id}
                  onMouseDown={() => {
                    setShowSuggestions(false);
                    setSearch('');
                    setHighlightId(s.id);
                    setTimeout(() => {
                      document.getElementById(`student-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                    setTimeout(() => setHighlightId(null), 2500);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-right hover:bg-primary/10 transition-colors border-b border-border/30 last:border-0"
                >
                  <span className="font-semibold truncate">{formatStudentName(s)}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{s.studyGroup || cls.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

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

        <div className="space-y-2">
          {filtered.map(student => {
            const annual = calculateAnnualGrade(student.id, classTests, data.results, data.behaviorGrades, data.settings, conductedTestIdsA, conductedTestIdsB, student.peExempt);
            const displayGrade = viewMode === 'annual' ? annual.annualGrade : viewMode === 'A' ? annual.semA.semesterFinalGrade : annual.semB.semesterFinalGrade;
            const completedResults = data.results.filter(r => r.studentId === student.id && r.status === 'completed').length;
            const progress = classTests.length ? `${completedResults}/${classTests.length}` : '—';
            const redBelow = data.settings.gradeColorThresholds?.redBelow ?? 55;
            const isLow = displayGrade !== null && displayGrade < redBelow;

            return (
              <StudentCard
                key={student.id}
                student={student}
                classId={classId}
                displayGrade={displayGrade}
                annual={annual}
                viewMode={viewMode}
                progress={progress}
                isLow={isLow}
                highlighted={highlightId === student.id}
                onEdit={() => openEdit(student)}
                onDelete={() => setDeleteStudentTarget({ id: student.id, name: formatStudentName(student) })}
              />
            );
          })}

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-sm">
              {students.length === 0 ? 'אין תלמידים בכיתה. הוסף תלמיד או ייבא קובץ.' : 'לא נמצאו תלמידים.'}
            </p>
          )}
        </div>
        </>
        )}

        <StudentFormDialog
          open={studentDialogOpen}
          onOpenChange={setStudentDialogOpen}
          student={editingStudent}
          classes={data.classes.filter(c => (c.status || 'active') === 'active')}
          defaultClassId={classId}
          onSave={handleSaveStudent}
        />

        <ImportStudentsDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={handleImport}
          classes={data.classes.filter(c => (c.status || 'active') === 'active')}
          defaultClassId={classId}
        />

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