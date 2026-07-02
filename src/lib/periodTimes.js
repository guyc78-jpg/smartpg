// לוח צלצולים בית ספרי — ברירת מחדל
// ימים א'-ה'
const DEFAULT_WEEKDAY_TIMES = {
  1: ['08:15', '09:05'],
  2: ['09:05', '09:50'],
  3: ['10:15', '11:00'],
  4: ['11:00', '11:45'],
  5: ['12:05', '12:50'],
  6: ['12:50', '13:35'],
  7: ['13:45', '14:30'],
  8: ['14:35', '15:20'],
  9: ['15:25', '16:10'],
  10: ['16:10', '16:55'],
  11: ['16:55', '17:40'],
  12: ['17:40', '18:25'],
};

// יום ו'
const DEFAULT_FRIDAY_TIMES = {
  1: ['08:15', '09:05'],
  2: ['09:05', '09:50'],
  3: ['10:15', '11:00'],
  4: ['11:00', '11:45'],
  5: ['11:50', '12:35'],
  6: ['12:35', '13:20'],
  7: ['13:25', '14:10'],
};

const FRIDAY = 5;
const STORAGE_KEY = 'bellSchedule.v1';

function loadCustom() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

let custom = loadCustom();

export function getBellTimes() {
  return {
    weekday: { ...DEFAULT_WEEKDAY_TIMES, ...(custom?.weekday || {}) },
    friday: { ...DEFAULT_FRIDAY_TIMES, ...(custom?.friday || {}) },
  };
}

export function saveBellTimes({ weekday, friday }) {
  custom = { weekday, friday };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}

export function resetBellTimes() {
  custom = null;
  localStorage.removeItem(STORAGE_KEY);
}

export function getDefaultBellTimes() {
  return { weekday: { ...DEFAULT_WEEKDAY_TIMES }, friday: { ...DEFAULT_FRIDAY_TIMES } };
}

function timesForDay(day) {
  const { weekday, friday } = getBellTimes();
  return day === FRIDAY ? friday : weekday;
}

export const PERIODS = Object.keys(DEFAULT_WEEKDAY_TIMES).map(Number);

export function periodsForDay(day) {
  return Object.keys(timesForDay(day)).map(Number);
}

function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getPeriodRange(period, day = 0) {
  const t = timesForDay(day)[period];
  if (!t) return { start: 0, end: 0 };
  return { start: toMinutes(t[0]), end: toMinutes(t[1]) };
}

export function formatPeriodStart(period, day = 0) {
  return timesForDay(day)[period]?.[0] || '';
}

export function formatPeriodRange(period, day = 0) {
  const t = timesForDay(day)[period];
  return t ? `${t[0]} – ${t[1]}` : '';
}

// Returns the period number happening right now (per today's bell schedule), or null
export function getCurrentPeriod() {
  const now = new Date();
  const day = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const p of periodsForDay(day)) {
    const { start, end } = getPeriodRange(p, day);
    if (nowMinutes >= start && nowMinutes < end) return p;
  }
  return null;
}

// lessons: [{ period, ... }] — returns the lesson happening now, or the next upcoming one today
export function findCurrentAndNextLesson(lessons) {
  const now = new Date();
  const day = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const sorted = [...lessons].sort((a, b) => a.period - b.period);
  let current = null;
  let next = null;
  for (const lesson of sorted) {
    const { start, end } = getPeriodRange(lesson.period, day);
    if (nowMinutes >= start && nowMinutes < end) { current = lesson; break; }
    if (start > nowMinutes && !next) next = lesson;
  }
  return { current, next };
}