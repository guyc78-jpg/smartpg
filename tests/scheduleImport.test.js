import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPeLessons, normalizeDayOfWeek } from '../src/lib/scheduleImport.js';

const mapping = { day: 'day', period: 'period', className: 'className', subject: 'subject' };

test('numeric day convention maps 1 to Sunday and 7 to Saturday', () => {
  assert.equal(normalizeDayOfWeek('1'), 0);
  assert.equal(normalizeDayOfWeek('7'), 6);
  assert.equal(normalizeDayOfWeek('0'), 0);
});

test('invalid periods are rejected instead of creating invisible lessons', () => {
  const result = extractPeLessons([
    { day: 'ראשון', period: '99', className: 'ז 1', subject: 'חינוך גופני' },
    { day: 'ראשון', period: '1.5', className: 'ז 1', subject: 'חינוך גופני' },
  ], mapping);
  assert.equal(result.lessons.length, 0);
  assert.equal(result.invalid, 2);
});

test('mapped imports retain valid non-PE lessons without creating a class', () => {
  const result = extractPeLessons([
    { day: 'ראשון', period: '2', className: '', subject: 'שהייה' },
  ], mapping);
  assert.equal(result.lessons.length, 1);
  assert.equal(result.lessons[0].isPe, false);
  assert.equal(result.lessons[0].subject, 'שהייה');
});
