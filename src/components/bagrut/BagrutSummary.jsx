import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { calculateBagrutGrade } from '@/lib/gradeCalc';
import { formatStudentName } from '@/lib/studentName';

export default function BagrutSummary({ cls, students, components, bagrutResults, redBelow }) {
  const rows = useMemo(() => students.map(student => {
    if (student.peExempt) return { student, exempt: true, compGrades: [], grade: null, missingCount: 0 };
    const compGrades = components.map(comp => {
      const r = bagrutResults.find(x => x.studentId === student.id && x.componentId === comp.id);
      if (r?.status === 'exempt') return 'פטור';
      return r?.score ?? null;
    });
    const { grade, missing } = calculateBagrutGrade(student.id, components, bagrutResults);
    return { student, exempt: false, compGrades, grade, missingCount: missing.length };
  }), [students, components, bagrutResults]);

  const exportCsv = () => {
    const csvCell = value => {
      const text = String(value ?? '');
      const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const header = ['שם התלמיד', ...components.map(c => `${c.name} (${c.weight}%)`), 'ציון סופי', 'רכיבים חסרים'];
    const lines = rows.map(r => [
      formatStudentName(r.student),
      ...(r.exempt ? components.map(() => 'פטור') : r.compGrades.map(g => g ?? '')),
      r.grade ?? '',
      r.exempt ? '' : r.missingCount,
    ].map(csvCell).join(','));
    const csv = '\uFEFF' + [header.map(csvCell).join(','), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `בגרות_${cls.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {rows.filter(r => !r.exempt && r.grade !== null && r.missingCount === 0).length} / {rows.filter(r => !r.exempt).length} תלמידים עם ציון מלא
        </span>
        <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1.5">
          <Download className="w-3.5 h-3.5" />
          ייצוא CSV
        </Button>
      </div>

      <div className="card-3d rounded-2xl overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-right font-bold p-2.5 sticky right-0 bg-card/80 backdrop-blur-sm">תלמיד</th>
              {components.map(c => (
                <th key={c.id} className="text-center font-medium p-2.5 whitespace-nowrap">
                  <div>{c.name}</div>
                  <div className="text-[9px] text-muted-foreground font-normal">{c.weight}%</div>
                </th>
              ))}
              <th className="text-center font-bold p-2.5 whitespace-nowrap">ציון סופי</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ student, exempt, compGrades, grade, missingCount }) => (
              <tr key={student.id} className="border-b border-border/30 last:border-0">
                <td className="text-right font-medium p-2.5 sticky right-0 bg-card/80 backdrop-blur-sm whitespace-nowrap">
                  {formatStudentName(student)}
                  {exempt && <Badge variant="outline" className="mr-1.5 text-[9px] border-destructive/40 text-destructive">פטור</Badge>}
                </td>
                {exempt ? (
                  <td colSpan={components.length + 1} className="text-center text-muted-foreground p-2.5">—</td>
                ) : (
                  <>
                    {compGrades.map((g, i) => (
                      <td key={i} className={`text-center p-2.5 ${g === null ? 'text-muted-foreground' : typeof g === 'number' && g < redBelow ? 'text-destructive font-bold' : 'font-medium'}`}>
                        {g ?? '—'}
                      </td>
                    ))}
                    <td className="text-center p-2.5">
                      {grade !== null ? (
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-bold ${grade < redBelow ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                          {grade}
                          {missingCount > 0 && <span className="text-[9px] font-normal text-amber-600 dark:text-amber-300">({missingCount} חסר)</span>}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
