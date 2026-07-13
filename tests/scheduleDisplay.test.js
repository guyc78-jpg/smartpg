import test from 'node:test';
import assert from 'node:assert/strict';
import { formatClassLabel, formatCombinedClassNames, getAdaptiveClassLabels, groupScheduleLessonsForDisplay } from '../src/lib/scheduleDisplay.js';

test('combined Hebrew class names are compressed into one readable label', () => {
  assert.equal(formatCombinedClassNames(["ח' 3", "ח' 1", "ח' 2"]), 'ח׳1,2,3');
  assert.equal(formatCombinedClassNames(['י״א 7', 'י״א 5']), 'י״א5,7');
});

test('individual class labels stay explicit and use Hebrew punctuation', () => {
  assert.equal(formatClassLabel("יב' 2"), 'יב׳2');
  assert.equal(formatClassLabel('י״א 5'), 'י״א5');
});

test('adaptive labels show every class up to four and collapse larger groups', () => {
  assert.deepEqual(getAdaptiveClassLabels(["ח' 1", "ח' 2", "ח' 3", "ח' 4"]).visibleLabels, ['ח׳1', 'ח׳2', 'ח׳3', 'ח׳4']);
  const largeGroup = getAdaptiveClassLabels(["ז' 1", "ז' 2", "ז' 3", "ז' 4", "ז' 5", "ז' 6"]);
  assert.deepEqual(largeGroup.visibleLabels, ['ז׳1', 'ז׳2', 'ז׳3']);
  assert.equal(largeGroup.overflowCount, 3);
});

test('same-subject class lessons share one display card and retain source records', () => {
  const classes = { a: { name: "ח' 1" }, b: { name: "ח' 2" } };
  const lessons = [
    { id: 'one', classId: 'a', subject: 'חינוך גופני' },
    { id: 'two', classId: 'b', subject: 'חינוך גופני' },
    { id: 'meeting', subject: 'ישיבת צוות' },
  ];
  const grouped = groupScheduleLessonsForDisplay(lessons, classes);
  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].displayClassName, 'ח׳1,2');
  assert.deepEqual(grouped[0].classLabels, ['ח׳1', 'ח׳2']);
  assert.deepEqual(grouped[0].groupedLessons.map(item => item.id), ['one', 'two']);
  assert.equal(grouped[1].id, 'meeting');
});
