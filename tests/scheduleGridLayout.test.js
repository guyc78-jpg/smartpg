import test from 'node:test';
import assert from 'node:assert/strict';
import { getScheduleGridDimensions } from '../src/lib/scheduleGridLayout.js';

test('parallel timetable lessons use a compact two-column grid', () => {
  const expected = [
    { columns: 1, rows: 1 },
    { columns: 1, rows: 1 },
    { columns: 2, rows: 1 },
    { columns: 2, rows: 2 },
    { columns: 2, rows: 2 },
    { columns: 2, rows: 3 },
    { columns: 2, rows: 3 },
  ];

  expected.forEach((dimensions, lessonCount) => {
    assert.deepEqual(getScheduleGridDimensions(lessonCount), dimensions);
  });
});

test('invalid timetable lesson counts fall back to a single empty track', () => {
  assert.deepEqual(getScheduleGridDimensions(undefined), { columns: 1, rows: 1 });
  assert.deepEqual(getScheduleGridDimensions(-3), { columns: 1, rows: 1 });
  assert.deepEqual(getScheduleGridDimensions('not-a-number'), { columns: 1, rows: 1 });
});
