import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LESSON_ROUTE_ERRORS,
  isValidLessonDate,
  validateLessonRoute,
} from '../src/lib/lessonRoute.js';

const classes = [
  { id: 'active-class', name: 'ז׳1', status: 'active' },
  { id: 'archived-class', name: 'ח׳2', status: 'archived' },
];

const route = (values) => validateLessonRoute(new URLSearchParams(values), classes, '2026-07-13');

test('lesson routes accept an existing active class and valid lesson coordinates', () => {
  const result = route({ classId: 'active-class', date: '2026-07-13', period: '5' });

  assert.equal(result.valid, true);
  assert.equal(result.cls, classes[0]);
  assert.equal(result.period, 5);
});

test('lesson routes reject unknown and archived classes before any write can run', () => {
  assert.equal(route({ classId: 'missing', date: '2026-07-13', period: '5' }).error, LESSON_ROUTE_ERRORS.classNotFound);
  assert.equal(route({ classId: 'archived-class', date: '2026-07-13', period: '5' }).error, LESSON_ROUTE_ERRORS.archivedClass);
});

test('lesson routes reject impossible dates and out-of-range periods', () => {
  assert.equal(isValidLessonDate('2026-02-30'), false);
  assert.equal(route({ classId: 'active-class', date: '2026-02-30', period: '5' }).error, LESSON_ROUTE_ERRORS.invalidDate);
  assert.equal(route({ classId: 'active-class', date: '2026-07-13', period: '0' }).error, LESSON_ROUTE_ERRORS.invalidPeriod);
  assert.equal(route({ classId: 'active-class', date: '2026-07-13', period: '2.5' }).error, LESSON_ROUTE_ERRORS.invalidPeriod);
  assert.equal(route({ classId: 'active-class', date: '2026-07-13', period: '13' }).error, LESSON_ROUTE_ERRORS.invalidPeriod);
});
