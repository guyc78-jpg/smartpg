import test from 'node:test';
import assert from 'node:assert/strict';
import { buildThresholdRows, parseThresholdValue } from '../base44/functions/parseTestDocx/conversionRanges.js';

test('DOCX time thresholds retain precise, non-overlapping hundredth-second ranges', () => {
  const rows = buildThresholdRows([{ test_name: 'ריצת 1000 מטר', lower_is_better: true,
    thresholds: [{ result: '4:00', grade: 100 }, { result: '5:00', grade: 80 }, { result: '6:00', grade: 0 }] }]);
  assert.deepEqual(rows.map(row => [row.min_result, row.max_result, row.grade]),
    [[0, 240, 100], [240.01, 300, 80], [300.01, 360, 0]]);
});

test('higher-is-better thresholds preserve the established range semantics', () => {
  const rows = buildThresholdRows([{ test_name: 'כפיפות בטן', lower_is_better: false,
    thresholds: [{ result: '10', grade: 50 }, { result: '20', grade: 100 }] }]);
  assert.deepEqual(rows.map(row => [row.min_result, row.max_result]), [[10, 19.99], [20, 200]]);
});

test('malformed times and duplicate threshold values fail instead of fabricating overlapping rows', () => {
  for (const value of ['', 'junk', '-1', '1:60', '1:99', '1:20:30']) assert.ok(Number.isNaN(parseThresholdValue(value)));
  assert.equal(parseThresholdValue('1:02.50'), 62.5);
  assert.throws(() => buildThresholdRows([{ lower_is_better: true,
    thresholds: [{ result: '4:00', grade: 100 }, { result: '4:00', grade: 80 }] }]));
  assert.throws(() => buildThresholdRows([{ thresholds: [{ result: '5', grade: 101 }] }]));
});
