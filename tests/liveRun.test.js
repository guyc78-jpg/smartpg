import test from 'node:test';
import assert from 'node:assert/strict';
import { inferRunDistance } from '../src/components/live-run/runSetupUtils.js';

test('run distance is inferred from Hebrew test names', () => {
  assert.equal(inferRunDistance({ name: 'ריצת 60 מטר' }), 60);
  assert.equal(inferRunDistance({ name: 'ריצת 2,000 מטרים' }), 2000);
});

test('non-running names without a distance do not invent one', () => {
  assert.equal(inferRunDistance({ name: 'כפיפות בטן בדקה' }), null);
});
