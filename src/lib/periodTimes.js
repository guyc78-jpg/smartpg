const PERIOD_DURATION_MIN = 45;
const BREAK_MIN = 5;
const SCHOOL_DAY_START_MIN = 8 * 60; // 08:00

function getPeriodRange(period) {
  const start = SCHOOL_DAY_START_MIN + (period - 1) * (PERIOD_DURATION_MIN + BREAK_MIN);
  return { start, end: start + PERIOD_DURATION_MIN };
}

export function formatPeriodStart(period) {
  const { start } = getPeriodRange(period);
  const h = Math.floor(start / 60).toString().padStart(2, '0');
  const m = (start % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
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