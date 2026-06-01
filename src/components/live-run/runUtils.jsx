import { formatStudentName } from '@/lib/studentName';

export const RUN_STATUS_LABELS = {
  running: 'רץ/ה',
  finished: 'סיים/ה',
  not_completed: 'לא סיים/ה',
  not_participated: 'לא השתתף/ה',
};

export function formatRunTime(ms) {
  const totalCentis = Math.floor((ms || 0) / 10);
  const centis = totalCentis % 100;
  const totalSeconds = Math.floor(totalCentis / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

export function secondsFromMs(ms) {
  return Math.round((ms || 0) / 10) / 100;
}

export function splitHebrewName(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: parts[0] || '', last: '' };
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

export function compareStudentsByLastName(a, b) {
  return formatStudentName(a).localeCompare(formatStudentName(b), 'he');
}

export function sortRunStudents(students, participants) {
  const order = { running: 0, finished: 1, not_completed: 2, not_participated: 3 };
  return [...students].sort((a, b) => {
    const pa = participants[a.id];
    const pb = participants[b.id];
    const statusDiff = (order[pa?.status] ?? 9) - (order[pb?.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;
    if (pa?.status === 'finished' && pb?.status === 'finished') {
      const timeDiff = (pa.finishTimeMs || 0) - (pb.finishTimeMs || 0);
      if (timeDiff !== 0) return timeDiff;
    }
    return compareStudentsByLastName(a, b);
  });
}