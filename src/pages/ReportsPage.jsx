import { useState, useMemo } from 'react';
import { useApp } from '@/store/AppProvider';
import { calculateAnnualGrade } from '@/lib/gradeCalc';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Users, Download, School, Clock, XCircle, BookOpen } from 'lucide-react';
import { SEMESTER_LABELS, GRADE_LEVELS } from '@/lib/types';
import { formatStudentName } from '@/lib/studentName';
import { exportClassReportCSV } from '@/lib/exportReport';

export default function ReportsPage() {
  const { data } = useApp();
  const [selectedClass, setSelectedClass] = useState('');
  const [viewMode, setViewMode] = useState('annual');

  const sortedClasses = useMemo(() => {
    const gradeIdx = c => {
      const i = GRADE_LEVELS.indexOf(c.gradeLevel);
      return i === -1 ? 99 : i;
    };
    const numOf = c => {
      const m = (c.name || '').match(/\d+/);
      return m ? Number(m[0]) : 0;
    };
    return [...data.classes].sort((a, b) =>
      gradeIdx(a) - gradeIdx(b) || numOf(a) - numOf(b) || (a.name || '').localeCompare(b.name || '', 'he')
    );
  }, [data.classes]);

  const redBelow = data.settings.gradeColorThresholds?.redBelow ?? 55;
  const cls = data.classes.find(c => c.id === selectedClass);
  const students = useMemo(
    () => data.students.filter(s => s.classId === selectedClass).sort((a, b) => formatStudentName(a).localeCompare(formatStudentName(b), 'he')),
    [data.students, selectedClass]
  );

  const classTests = useMemo(() => {
    if (!cls) return data.tests;
    const g = cls.genderTrack || 'boys';
    let filtered = data.tests;
    if (cls.gradeLevel) filtered = filtered.filter(t => t.gradeLevel === cls.gradeLevel);
    return filtered.filter(t => (t.genderTrack || 'boys') === g);
  }, [data.tests, cls]);

  const conductedTestIdsA = useMemo(
    () => data.classTestStatuses.filter(s => s.classId === selectedClass && s.semester === 'A' && s.status === 'conducted').map(s => s.testId),
    [data.classTestStatuses, selectedClass]
  );
  const conductedTestIdsB = useMemo(
    () => data.classTestStatuses.filter(s => s.classId === selectedClass && s.semester === 'B' && s.status === 'conducted').map(s => s.testId),
    [data.classTestStatuses, selectedClass]
  );

  const studentGrades = useMemo(
    () => students.map(s => ({
      student: s,
      annual: calculateAnnualGrade(s.id, classTests, data.results, data.behaviorGrades, data.settings, conductedTestIdsA, conductedTestIdsB, s.peExempt),
    })),
    [students, classTests, data.results, data.behaviorGrades, data.settings, conductedTestIdsA, conductedTestIdsB]
  );

  // Global stats
  const globalStats = useMemo(() => {
    let allGrades = [];
    let gradesA = [];
    let gradesB = [];
    let failCount = 0;
    let missingCount = 0;

    data.classes.forEach(c => {
      const cs = data.students.filter(s => s.classId === c.id);
      const g = c.genderTrack || 'boys';
      let cTests = data.tests;
      if (c.gradeLevel) cTests = cTests.filter(t => t.gradeLevel === c.gradeLevel);
      cTests = cTests.filter(t => (t.genderTrack || 'boys') === g);
      const ctsA = data.classTestStatuses.filter(s => s.classId === c.id && s.semester === 'A' && s.status === 'conducted').map(s => s.testId);
      const ctsB = data.classTestStatuses.filter(s => s.classId === c.id && s.semester === 'B' && s.status === 'conducted').map(s => s.testId);

      cs.forEach(s => {
        if (s.peExempt) return;
        const annual = calculateAnnualGrade(s.id, cTests, data.results, data.behaviorGrades, data.settings, ctsA, ctsB, s.peExempt);
        if (annual.annualGrade !== null) {
          allGrades.push(annual.annualGrade);
          if (annual.annualGrade < redBelow) failCount++;
        }
        if (annual.semA.semesterFinalGrade !== null) gradesA.push(annual.semA.semesterFinalGrade);
        if (annual.semB.semesterFinalGrade !== null) gradesB.push(annual.semB.semesterFinalGrade);
        if (annual.semA.missingTests.length > 0 || annual.semB.missingTests.length > 0) missingCount++;
      });
    });

    const avgOf = arr => (arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
    return { avg: avgOf(allGrades), avgA: avgOf(gradesA), avgB: avgOf(gradesB), totalStudents: data.students.length, totalClasses: data.classes.length, failCount, missingCount };
  }, [data]);

  // Per-class summary
  const summary = useMemo(() => {
    if (studentGrades.length === 0) return null;
    const active = studentGrades.filter(sg => !sg.student.peExempt);
    const grades = active.map(sg => sg.annual.annualGrade).filter(g => g !== null);
    const avg = grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : null;
    const below55 = grades.filter(g => g < redBelow).length;
    return { avg, studentsWithGrades: grades.length, below55, total: students.length, exempt: students.length - active.length };
  }, [studentGrades, students, redBelow]);

  return (
    <Layout title="דוחות">
      <div className="max-w-3xl mx-auto space-y-4 p-4" dir="rtl">
        {/* Global Dashboard */}
        <div className="flex items-center gap-2 px-1">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-sm">תמונת מצב כללית</h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Card className="card-3d rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><School className="w-4 h-4 text-primary" /></div>
              <div>
                <div className="text-lg font-bold">{globalStats.totalClasses}</div>
                <div className="text-[10px] text-muted-foreground">כיתות</div>
              </div>
            </div>
          </Card>
          <Card className="card-3d rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div>
              <div>
                <div className="text-lg font-bold">{globalStats.totalStudents}</div>
                <div className="text-[10px] text-muted-foreground">תלמידים</div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="card-3d rounded-xl p-3">
          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-border/40 text-center">
            <div className="px-2">
              <div className="text-[11px] text-muted-foreground mb-1">מחצית א'</div>
              <div className="text-lg font-bold">{globalStats.avgA ?? '—'}</div>
            </div>
            <div className="px-2">
              <div className="text-[11px] text-muted-foreground mb-1">מחצית ב'</div>
              <div className="text-lg font-bold">{globalStats.avgB ?? '—'}</div>
            </div>
            <div className="px-2">
              <div className="text-[11px] text-primary font-semibold mb-1">שנתי</div>
              <div className="text-lg font-bold text-primary">{globalStats.avg ?? '—'}</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Card className="card-3d rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><Clock className="w-4 h-4 text-muted-foreground" /></div>
              <div>
                <div className={`text-lg font-bold ${globalStats.missingCount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>{globalStats.missingCount}</div>
                <div className="text-[10px] text-muted-foreground">חסרי מבדקים</div>
              </div>
            </div>
          </Card>
          <Card className="card-3d rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><XCircle className="w-4 h-4 text-muted-foreground" /></div>
              <div>
                <div className={`text-lg font-bold ${globalStats.failCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{globalStats.failCount}</div>
                <div className="text-[10px] text-muted-foreground">נכשלים (מתחת ל-{redBelow})</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Class report divider */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-xs font-semibold text-muted-foreground">דוח כיתתי</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        {/* Class selector */}
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="h-10"><SelectValue placeholder="בחר כיתה" /></SelectTrigger>
          <SelectContent>
            {sortedClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Per-class report */}
        {selectedClass && summary && (
          <Card className="card-3d rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">{cls?.name}</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => exportClassReportCSV(cls?.name, studentGrades)}>
                  <Download className="w-3 h-3" /> ייצוא
                </Button>
                <Badge variant="secondary" className="text-[10px]">{summary.total} תלמידים</Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xl font-bold text-primary">{summary.avg ?? '—'}</div>
                <div className="text-[10px] text-muted-foreground">ממוצע שנתי</div>
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{summary.studentsWithGrades}</div>
                <div className="text-[10px] text-muted-foreground">עם ציונים</div>
              </div>
              <div>
                <div className={`text-xl font-bold ${summary.below55 > 0 ? 'text-destructive' : 'text-foreground'}`}>{summary.below55}</div>
                <div className="text-[10px] text-muted-foreground">מתחת 55</div>
              </div>
            </div>

            {/* Student grades list */}
            <div className="space-y-1 mt-4">
              {studentGrades.map(({ student, annual }) => {
                const grade = annual.annualGrade;
                const isLow = grade !== null && grade < redBelow;
                return (
                  <div key={student.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatStudentName(student)}</span>
                      {student.peExempt && <Badge variant="outline" className="text-[8px] px-1 py-0">פטור</Badge>}
                    </div>
                    {grade !== null && (
                      <span className={`text-sm font-bold ${isLow ? 'text-destructive' : 'text-primary'}`}>{grade}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {!selectedClass && (
          <Card className="card-3d rounded-2xl p-8 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-primary mx-auto" />
            <p className="font-bold text-sm">בחר כיתה לצפייה בדוח מפורט</p>
            <p className="text-xs text-muted-foreground">ציונים שנתיים, ממוצעי מחציות וציוני מבדקים לכל תלמיד</p>
          </Card>
        )}
      </div>
    </Layout>
  );
}