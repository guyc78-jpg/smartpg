const DEFAULT_WEEKDAY_TIMES = {
  1: ['08:15', '09:05'], 2: ['09:05', '09:50'], 3: ['10:15', '11:00'],
  4: ['11:00', '11:45'], 5: ['12:05', '12:50'], 6: ['12:50', '13:35'],
  7: ['13:45', '14:30'], 8: ['14:35', '15:20'], 9: ['15:25', '16:10'],
  10: ['16:10', '16:55'], 11: ['16:55', '17:40'], 12: ['17:40', '18:25'],
};

const DEFAULT_FRIDAY_TIMES = {
  1: ['08:15', '09:05'], 2: ['09:05', '09:50'], 3: ['10:15', '11:00'],
  4: ['11:00', '11:45'], 5: ['11:50', '12:35'], 6: ['12:35', '13:20'],
  7: ['13:25', '14:10'],
};

const FRIDAY = 5;
const SATURDAY = 6;
const STORAGE_KEY = 'bellSchedule.v2';
const LEGACY_STORAGE_KEY = 'bellSchedule.v1';
const CHANGE_EVENT = 'smartpg:bell-schedule-change';
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function cloneSchedule(schedule) {
  return Object.fromEntries(Object.entries(schedule).map(([period, range]) => [period, [...range]]));
}

export function timeToMinutes(time) {
  if (!TIME_PATTERN.test(String(time || ''))) return Number.NaN;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function validateBellTimes(value) {
  const errors = [];
  for (const group of ['weekday', 'friday']) {
    const entries = Object.entries(value?.[group] || {}).sort(([a], [b]) => Number(a) - Number(b));
    if (entries.length === 0) errors.push(group === 'weekday' ? 'חסרות שעות לימי א׳–ה׳' : 'חסרות שעות ליום ו׳');
    let previousEnd = null;
    for (const [period, range] of entries) {
      const [start, end] = Array.isArray(range) ? range : [];
      const startMinutes = timeToMinutes(start);
      const endMinutes = timeToMinutes(end);
      if (!Number.isInteger(Number(period)) || Number(period) < 1 || !Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
        errors.push(`שעה ${period}: פורמט הזמן אינו תקין`);
        continue;
      }
      if (endMinutes <= startMinutes) errors.push(`שעה ${period}: שעת הסיום חייבת להיות אחרי שעת ההתחלה`);
      if (previousEnd !== null && startMinutes < previousEnd) errors.push(`שעה ${period}: קיימת חפיפה עם השעה הקודמת`);
      previousEnd = endMinutes;
    }
  }
  return { valid: errors.length === 0, errors };
}

function normalizeBellTimes(value) {
  const fallback = getDefaultBellTimes();
  const candidate = {
    weekday: { ...fallback.weekday, ...(value?.weekday || {}) },
    friday: { ...fallback.friday, ...(value?.friday || {}) },
  };
  return validateBellTimes(candidate).valid ? candidate : fallback;
}

function loadCustom() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return validateBellTimes(parsed).valid ? parsed : null;
  } catch {
    return null;
  }
}

let custom = loadCustom();

function notifyScheduleChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getBellTimes() {
  return custom ? { weekday: cloneSchedule(custom.weekday), friday: cloneSchedule(custom.friday) } : getDefaultBellTimes();
}

export function saveBellTimes(value) {
  const normalized = normalizeBellTimes(value);
  const validation = validateBellTimes(value);
  if (!validation.valid) throw new Error(validation.errors[0]);
  custom = normalized;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  notifyScheduleChanged();
  return getBellTimes();
}

export function applyRemoteBellTimes(value) {
  if (!value) return resetBellTimes();
  const validation = validateBellTimes(value);
  if (!validation.valid) return false;
  saveBellTimes(value);
  return true;
}

export function resetBellTimes() {
  custom = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
  notifyScheduleChanged();
  return getBellTimes();
}

export function subscribeToBellTimes(callback) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

export function getDefaultBellTimes() {
  return { weekday: cloneSchedule(DEFAULT_WEEKDAY_TIMES), friday: cloneSchedule(DEFAULT_FRIDAY_TIMES) };
}

function timesForDay(day) {
  if (day === SATURDAY) return {};
  const { weekday, friday } = getBellTimes();
  return day === FRIDAY ? friday : weekday;
}

export const PERIODS = Object.keys(DEFAULT_WEEKDAY_TIMES).map(Number);

export function periodsForDay(day) {
  return Object.keys(timesForDay(day)).map(Number).sort((a, b) => a - b);
}

export function getPeriodRange(period, day = 0) {
  const range = timesForDay(day)[period];
  if (!range) return null;
  return { start: timeToMinutes(range[0]), end: timeToMinutes(range[1]), startLabel: range[0], endLabel: range[1] };
}

export function formatPeriodStart(period, day = 0) {
  return getPeriodRange(period, day)?.startLabel || '';
}

export function formatPeriodRange(period, day = 0) {
  const range = getPeriodRange(period, day);
  return range ? `${range.startLabel}–${range.endLabel}` : '';
}

export function getCurrentPeriod(date = new Date()) {
  const day = date.getDay();
  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  for (const period of periodsForDay(day)) {
    const range = getPeriodRange(period, day);
    if (range && nowMinutes >= range.start && nowMinutes < range.end) return period;
  }
  return null;
}

export function findCurrentAndNextLesson(lessons, date = new Date()) {
  const day = date.getDay();
  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  const sorted = [...(lessons || [])].sort((a, b) => Number(a.period) - Number(b.period));
  let next = null;
  for (const lesson of sorted) {
    const range = getPeriodRange(lesson.period, day);
    if (!range) continue;
    if (nowMinutes >= range.start && nowMinutes < range.end) return { current: lesson, next: null };
    if (range.start > nowMinutes && !next) next = lesson;
  }
  return { current: null, next };
}
