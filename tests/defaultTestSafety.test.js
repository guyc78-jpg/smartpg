import test from 'node:test';
import assert from 'node:assert/strict';
import { canRemoveDefaultDuplicate } from '../src/lib/defaultTestSafety.js';

test('default dedupe never deletes a test referenced by grades, attempts or class status', () => {
  const row = { id: 'used', weight: 25, conversion_table: [] };
  assert.equal(canRemoveDefaultDuplicate(row, { weight: 25 }, new Set(['used'])), false);
  assert.equal(canRemoveDefaultDuplicate(row, { weight: 25 }, new Set()), true);
});

test('customized default tests are preserved during startup', () => {
  for (const patch of [
    { weight: 40 }, { conversion_table: [{ minResult: 0, maxResult: 100, grade: 90 }] },
    { test_date: '2026-09-30' }, { semester: 'A' }, { class_id: 'class' },
  ]) {
    assert.equal(canRemoveDefaultDuplicate({ id: 'custom', weight: 25, conversion_table: [], ...patch }, { weight: 25 }), false);
  }
});
