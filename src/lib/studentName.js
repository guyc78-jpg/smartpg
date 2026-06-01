export function formatStudentName(student) {
  if (!student) return '';
  const firstName = (student.firstName || student.first_name || '').trim();
  const lastName = (student.lastName || student.last_name || '').trim();
  if (lastName || firstName) return [lastName, firstName].filter(Boolean).join(' ');
  return student.name || '';
}

export function buildStudentName(firstName, lastName, fallback = '') {
  const first = (firstName || '').trim();
  const last = (lastName || '').trim();
  return [last, first].filter(Boolean).join(' ') || fallback.trim();
}