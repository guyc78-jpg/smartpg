import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '@/store/AppProvider';
import { calculateAnnualGrade, calculateSemesterGrades, convertRawToGrade } from '@/lib/gradeCalc';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Check, X, Search, ClipboardList, ShieldOff, Award } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import ConfirmDeleteDialog from '@/components/app/ConfirmDeleteDialog';
import { SEMESTER_LABELS } from '@/lib/types';

export default function ClassPage() {
  const { classId } = useParams();
  const { data, addStudent, deleteStudent, editStudent, setGradeOverride } = useApp();
  const [newName, setNewName] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editExempt, setEditExempt] = useState(false);
  const [deleteStudentTarget, setDeleteStudentTarget] = useState(null);
  const [viewMode, setViewMode] = useState('A');

  const cls = data.classes.find(c => c.id === classId);
  const isGrade12 = cls?.gradeLevel === 'יב';

  const classTests = useMemo(() => {
    if (!cls) return [];
    const classGenderTrack = cls.genderTrack || 'boys';
    let filtered = data.tests;
    if (cls.gradeLevel) filtered = filtered.filter(t => t.gradeLevel === cls.gradeLevel);
    filtered = filtered.filter(t => (t.genderTrack || 'boys') === classGenderTrack);
    return filtered;
  }, [data.tests, cls?.gradeLevel, cls?.genderTrack]);

  const students = useMemo(
    () => data.students.filter(s => s.classId === classId).sort((a, b) => a.name.localeCompare(b.name, 'he')),
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

  const filtered = useMemo(
    () => search ? students.filter(s => s.name.includes(search)) : students,
    [students, search]
  );

  if (!cls) {
    return (
      <Layout title="כיתה לא נמצאה" backTo="/">
        <p className="text-center text-muted-foreground py-16">הכיתה לא נמצאה</p>
      </Layout>
    );
  }

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed || !classId) return;
    addStudent(trimmed, classId);
    setNewName('');
    toast.success('תלמיד נוסף');
  };

  return (
    <Layout
      title={cls.name}
      backTo="/"
      subtitle={`${students.length} תלמידים`}
      titleAction={
        <div className="flex gap-1">
          <Link to={`/class/${classId}/tests`}>
            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
              <ClipboardList className="w-3.5 h-3.5" />
              מבדקים
            </Button>
          </Link>
          {isGrade12 && (
            <Link to={`/class/${classId}/bagrut`}>
              <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                <Award className="w-3.5 h-3.5" />
                בגרות
              </Button>
            </Link>
          )}
        </div>
      }
    >
      <div className="max-w-3xl mx-auto space-y-3 p-4" dir="rtl">
        {/* View Mode Tabs */}
        <div className="flex gap-2">
          {['A', 'B', 'annual'].map(mode => (
            <Button key={mode} variant={viewMode === mode ? 'default' : 'outline'} onClick={() => setViewMode(mode)} className="flex-1 h-9 text-xs font-semibold">
              {mode === 'annual' ? 'שנתי' : SEMESTER_LABELS[mode]}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש תלמיד..." className="h-9 pr-9 text-sm" />
        </div>

        {/* Add Student */}
        <div className="flex gap-2">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="שם תלמיד חדש" className="h-9 text-sm flex-1"
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <Button onClick={handleAdd} disabled={!newName.trim()} size="sm" className="h-9 gap-1">
            <Plus className="w-4 h-4" /> הוסף
          </Button>
        </div>

        {/* Student List */}
        <div className="space-y-1.5">
          {filtered.map(student => {
            const annual = calculateAnnualGrade(student.id, classTests, data.results, data.behaviorGrades, data.settings, conductedTestIdsA, conductedTestIdsB, student.peExempt);
            const isEditing = editingId === student.id;
            
            let displayGrade = null;
            if (viewMode === 'annual') displayGrade = annual.annualGrade;
            else if (viewMode === 'A') displayGrade = annual.semA.semesterFinalGrade;
            else displayGrade = annual.semB.semesterFinalGrade;

            const isLow = displayGrade !== null && displayGrade < 55;

            return (
              <Card key={student.id} className={`card-3d rounded-xl transition-all ${student.peExempt ? 'opacity-60' : ''}`}>
                {isEditing ? (
                  <div className="p-3 space-y-2">
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-sm" autoFocus />
                    <div className="flex items-center gap-2">
                      <Checkbox checked={editExempt} onCheckedChange={setEditExempt} />
                      <span className="text-xs">פטור מחנ״ג</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7" onClick={() => { editStudent(student.id, editName, editExempt); setEditingId(null); }}>
                        <Check className="w-3 h-3 ml-1" /> שמור
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingId(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-[15px] truncate">{student.name}</span>
                      {student.peExempt && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-destructive/40 text-destructive bg-destructive/5 shrink-0">
                          <ShieldOff className="w-2.5 h-2.5 ml-0.5" />פטור
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {displayGrade !== null && !student.peExempt && (
                        <div className={`rounded-lg px-2.5 py-0.5 min-w-[40px] text-center ${isLow ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                          <span className={`text-sm font-bold ${isLow ? 'text-destructive' : 'text-primary'}`}>{displayGrade}</span>
                        </div>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(student.id); setEditName(student.name); setEditExempt(student.peExempt || false); }}>
                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteStudentTarget({ id: student.id, name: student.name })}>
                        <Trash2 className="w-3 h-3 text-destructive/60" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-sm">
              {students.length === 0 ? 'אין תלמידים בכיתה. הוסף תלמיד חדש.' : 'לא נמצאו תלמידים.'}
            </p>
          )}
        </div>

        <ConfirmDeleteDialog
          open={!!deleteStudentTarget}
          onOpenChange={() => setDeleteStudentTarget(null)}
          title={`מחיקת ${deleteStudentTarget?.name}`}
          description="כל הציונים של התלמיד ימחקו."
          onConfirm={() => { deleteStudent(deleteStudentTarget.id); setDeleteStudentTarget(null); toast.success('התלמיד נמחק'); }}
        />
      </div>
    </Layout>
  );
}