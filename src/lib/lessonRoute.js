import { parseLocalISODate, toLocalISODate } from './dateTime.js';

export const LESSON_ROUTE_ERRORS = {
  missingClass: 'missing_class',
  classNotFound: 'class_not_found',
  archivedClass: 'archived_class',
  invalidDate: 'invalid_date',
  invalidPeriod: 'invalid_period',
};

export function isValidLessonDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const parsed = parseLocalISODate(value);
  return Number.isFinite(parsed.getTime()) && toLocalISODate(parsed) === value;
}

export function validateLessonRoute(searchParams, classes = [], fallbackDate = toLocalISODate()) {
  const classId = String(searchParams?.get?.('classId') || '').trim();
  const date = String(searchParams?.get?.('date') || fallbackDate).trim();
  const periodRaw = String(searchParams?.get?.('period') || '1').trim();
  const period = Number(periodRaw);
  const cls = classes.find(item => item.id === classId) || null;

  let error = '';
  if (!classId) error = LESSON_ROUTE_ERRORS.missingClass;
  else if (!cls) error = LESSON_ROUTE_ERRORS.classNotFound;
  else if ((cls.status || 'active') !== 'active') error = LESSON_ROUTE_ERRORS.archivedClass;
  else if (!isValidLessonDate(date)) error = LESSON_ROUTE_ERRORS.invalidDate;
  else if (!Number.isInteger(period) || period < 1 || period > 12) error = LESSON_ROUTE_ERRORS.invalidPeriod;

  return { valid: !error, error, classId, date, period, cls };
}

export function lessonRouteErrorMessage(error) {
  if (error === LESSON_ROUTE_ERRORS.missingClass || error === LESSON_ROUTE_ERRORS.classNotFound) return 'הכיתה שבקישור אינה קיימת או אינה זמינה.';
  if (error === LESSON_ROUTE_ERRORS.archivedClass) return 'לא ניתן לערוך שיעור של כיתה שנמצאת בארכיון. יש לשחזר את הכיתה תחילה.';
  if (error === LESSON_ROUTE_ERRORS.invalidDate) return 'התאריך שבקישור אינו תקין.';
  if (error === LESSON_ROUTE_ERRORS.invalidPeriod) return 'שעת המערכת שבקישור אינה תקינה.';
  return 'הקישור לשיעור אינו תקין.';
}
