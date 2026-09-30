import test from 'node:test';
import assert from 'node:assert/strict';
import { rowsToTests, parseResultValue } from '../src/lib/testImportExport.js';

test('test imports preserve a zero weight and distinguish empty values from zero', () => {
  assert.equal(rowsToTests([{ test_name: 'ריצה', weight: 0 }])[0].weight, 0);
  assert.equal(rowsToTests([{ test_name: 'ריצה', weight: '' }])[0].weight, 25);
  assert.equal(parseResultValue(' '), null);
  assert.equal(parseResultValue(0), 0);
});

test('incomplete, invalid and overlapping imported conversion tables fail before a preview can be saved', () => {
  for (const row of [
    { min: 0, max: 10, grade: '' }, { min: 'junk', max: 10, grade: 50 },
    { min: -1, max: 10, grade: 50 }, { min: 0, max: 10, grade: '1:00' },
    { min: 0, max: 10, grade: 101 },
  ]) assert.throws(() => rowsToTests([{ test_name: 'ריצה', ...row }]));
  assert.throws(() => rowsToTests([
    { test_name: 'ריצה', min: 0, max: 10, grade: 100 },
    { test_name: 'ריצה', min: 10, max: 20, grade: 80 },
  ]));
  assert.throws(() => rowsToTests([{ test_name: 'ריצה', weight: -1 }]));
});

test('Hebrew time imports preserve hundredth-second boundaries and a zero grade', () => {
  const tests = rowsToTests([
    { test_name: 'ריצת 1000 מטר', min: '0:00', max: '4:00', grade: 100 },
    { test_name: 'ריצת 1000 מטר', min: '4:00.01', max: '5:00', grade: 0 },
  ]);
  assert.equal(tests[0].conversionTable[1].minResult, 240.01);
  assert.equal(tests[0].conversionTable[1].grade, 0);
});
