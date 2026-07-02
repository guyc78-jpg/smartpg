export const PERIOD_TIMES = {
  1: ['08:15', '09:05'],
  2: ['09:05', '09:50'],
  3: ['10:15', '11:00'],
  4: ['11:00', '11:45'],
  5: ['12:05', '12:50'],
  6: ['12:50', '13:35'],
  7: ['13:45', '14:30'],
  8: ['14:35', '15:20'],
  9: ['15:25', '16:10'],
  10: ['16:15', '17:00'],
  11: ['17:05', '17:50'],
  12: ['17:55', '18:40'],
};

export const PERIODS = Object.keys(PERIOD_TIMES).map(Number);

function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getPeriodRange(period) {
  const t = PERIOD_TIMES[period];
  if (!t) return { start: 0, end: 0 };
  return { start: toMinutes(t[0]), end: toMinutes(t[1]) };
}

export function formatPeriodStart(period) {
  return PERIOD_TIMES[period]?.[0] || '';
}

export function formatPeriodRange(period) {
  const t = PERIOD_TIMES[period];
  return t ? `${t[0]} – ${t[1]}` : '';
}

// Returns the period number happening right now, or null
export function getCurrentPeriod() {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const p of PERIODS) {
    const { start, end } = getPeriodRange(p);
    if (nowMinutes >= start && nowMinutes < end) return p;
  }
  return null;
}

// lessons: [{ period, ... }] — returns the lesson happening now, or the next upcoming one today
export function findCurrentAndNextLesson(lessons) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const sorted = [...lessons].sort((a, b) => a.period - b.period);
  let current = null;
  let next = null;
  for (const lesson of sorted) {
    const { start, end } = getPeriodRange(lesson.period);
    if (nowMinutes >= start && nowMinutes < end) { current = lesson; break; }
    if (start > nowMinutes && !next) next = lesson;
  }
  return { current, next };
}