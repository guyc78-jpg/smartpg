import test from 'node:test';
import assert from 'node:assert/strict';
import { validateConversionTable } from '../src/lib/conversionValidation.js';

test('blank conversion cells are missing values, not fabricated zeros', () => {
  assert.deepEqual(validateConversionTable([{ minResult: null, maxResult: undefined, grade: ' ' }]), { valid: true, rows: [] });
  assert.equal(validateConversionTable([{ minResult: 0, maxResult: 10, grade: null }]).valid, false);
  assert.equal(validateConversionTable([{ minResult: undefined, maxResult: 10, grade: 50 }]).valid, false);
});

test('conversion validation rejects negative, nonfinite and overlapping ranges', () => {
  for (const row of [
    { minResult: -1, maxResult: 5, grade: 80 },
    { minResult: 0, maxResult: Infinity, grade: 80 },
    { minResult: 0, maxResult: 5, grade: 101 },
  ]) assert.equal(validateConversionTable([row]).valid, false);
  assert.equal(validateConversionTable([{ minResult: 0, maxResult: 5, grade: 80 }, { minResult: 5, maxResult: 8, grade: 60 }]).valid, false);
});

test('zero scores and fractional non-overlapping boundaries remain valid', () => {
  const result = validateConversionTable([{ minResult: 240.01, maxResult: 300, grade: 0 }, { minResult: 240, maxResult: 0, grade: 100 }]);
  assert.equal(result.valid, true);
  assert.deepEqual(result.rows, [{ minResult: 0, maxResult: 240, grade: 100 }, { minResult: 240.01, maxResult: 300, grade: 0 }]);
});
