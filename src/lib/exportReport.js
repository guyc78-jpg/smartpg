import { formatStudentName } from '@/lib/studentName';

function sanitizeCsvCell(value) {
  const str = String(value ?? '');
  return /^[=+\-@]/.test(str) ? `'${str}` : str;
}

export function exportClassReportCSV(className, studentGrades) {
  const headers = ['שם התלמיד', 'מחצית א׳', 'מחצית ב׳', 'שנתי', 'סטטוס'];
  const rows = studentGrades.map(({ student, annual }) => [
    formatStudentName(student),
    annual.semA?.semesterFinalGrade ?? '',
    annual.semB?.semesterFinalGrade ?? '',
    annual.annualGrade ?? '',
    student.peExempt ? 'פטור' : 'פעיל',
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${sanitizeCsvCell(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `דוח_${className || 'כיתה'}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}