import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTestDefinitionPayload } from '../src/lib/testDefinitionPayload.js';

test('test definition validation preserves zero weight and blocks invalid records', () => {
  assert.equal(buildTestDefinitionPayload({ name: ' ריצה ', weight: 0 }).weight, 0);
  assert.equal(buildTestDefinitionPayload({ name: ' ריצה ', weight: 25 }).name, 'ריצה');
  for (const weight of ['', null, -1, 101, NaN]) {
    assert.throws(() => buildTestDefinitionPayload({ name: 'ריצה', weight }));
  }
  assert.throws(() => buildTestDefinitionPayload({ name: ' ', weight: 25 }));
  assert.throws(() => buildTestDefinitionPayload({ name: 'א'.repeat(161), weight: 25 }));
});

test('test definitions cannot save invalid conversion tables', () => {
  assert.throws(() => buildTestDefinitionPayload({ name: 'ריצה', weight: 25, conversionTable: [{ minResult: 0, maxResult: 1, grade: null }] }));
  const payload = buildTestDefinitionPayload({ name: 'ריצה', weight: 25, conversionTable: [{ minResult: 0, maxResult: 240, grade: 100 }, { minResult: 240.01, maxResult: 300, grade: 50 }] });
  assert.equal(payload.conversion_table[1].minResult, 240.01);
});
