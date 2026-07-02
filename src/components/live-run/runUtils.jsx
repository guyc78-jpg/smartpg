import { formatStudentName } from '@/lib/studentName';

export function formatRunTime(ms) {
  const safeMs = Math.max(0, Number(ms || 0));
  const totalCentis = Math.floor(safeMs / 10);
  const centis = totalCentis % 100;
  const totalSeconds = Math.floor(totalCentis / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const base = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${base}` : base;
}

export function formatClockTime(ms) {
  const totalSeconds = Math.floor(Math.max(0, Number(ms || 0)) / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const base = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${base}` : base;
}

export function secondsFromMs(ms) {
  return Math.round((Number(ms || 0)) / 10) / 100;
}

export function formatResultSeconds(ms) {
  const s = secondsFromMs(ms);
  return s < 60 ? s.toFixed(2) : formatRunTime(ms);
}

export function msFromSeconds(seconds) {
  const value = Number(seconds);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 1000) : null;
}

export function displayRunStudentName(student) {
  const first = (student.firstName || student.first_name || '').trim();
  const last = (student.lastName || student.last_name || '').trim();
  return [first, last].filter(Boolean).join(' ') || formatStudentName(student);
}

export function compareStudentsByFirstName(a, b) {
  const firstA = (a.firstName || a.first_name || '').trim();
  const firstB = (b.firstName || b.first_name || '').trim();
  const lastA = (a.lastName || a.last_name || '').trim();
  const lastB = (b.lastName || b.last_name || '').trim();
  return firstA.localeCompare(firstB, 'he') || lastA.localeCompare(lastB, 'he') || displayRunStudentName(a).localeCompare(displayRunStudentName(b), 'he');
}

export function sortRunStudents(students, participants = {}) {
  const order = { running: 0, finished: 1, not_completed: 2, not_participated: 3, exempt: 4, not_relevant: 5 };
  return [...students].sort((a, b) => {
    const pa = participants[a.id];
    const pb = participants[b.id];
    const statusDiff = (order[pa?.status] ?? 9) - (order[pb?.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;
    if (pa?.status === 'finished' && pb?.status === 'finished') {
      const timeDiff = (pa.finishTimeMs || 0) - (pb.finishTimeMs || 0);
      if (timeDiff !== 0) return timeDiff;
    }
    return compareStudentsByFirstName(a, b);
  });
}