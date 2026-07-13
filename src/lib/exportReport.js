import { formatStudentName } from '@/lib/studentName';
import { toLocalISODate } from '@/lib/dateTime';

function sanitizeCsvCell(value) {
  const str = String(value ?? '');
  return /^[=+\-@]/.test(str) ? `'${str}` : str;
}

export function exportClassReportCSV(className, studentGrades, tests = [], results = []) {
  const testHeaders = tests.flatMap(test => [`${test.name} — א׳`, `${test.name} — ב׳`]);
  const headers = ['שם התלמיד', 'מחצית א׳', 'מחצית ב׳', 'שנתי', 'סטטוס', ...testHeaders];
  const rows = studentGrades.map(({ student, annual }) => [
    formatStudentName(student),
    annual.semA?.semesterFinalGrade ?? '',
    annual.semB?.semesterFinalGrade ?? '',
    annual.annualGrade ?? '',
    student.peExempt ? 'פטור' : 'פעיל',
    ...tests.flatMap(test => ['A', 'B'].map(semester => {
      const result = results.find(row => row.studentId === student.id && row.testId === test.id && row.semester === semester);
      if (!result) return '';
      return result.status === 'completed' ? result.rawScore ?? '' : result.status;
    })),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${sanitizeCsvCell(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `דוח_${className || 'כיתה'}_${toLocalISODate()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
