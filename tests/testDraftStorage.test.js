import test from 'node:test';
import assert from 'node:assert/strict';
import { readTestDrafts, writeTestDrafts, clearTestDrafts } from '../src/lib/testDraftStorage.js';

function storage() {
  const values = new Map();
  return { get length() { return values.size; }, key: index => [...values.keys()][index],
    getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key) };
}

test('test drafts survive navigation and remain isolated between accounts', () => {
  const tab = storage();
  const drafts = { 'test-a': { name: 'ריצה בעברית / English', weight: '' } };
  assert.equal(writeTestDrafts('owner-a', drafts, tab), true);
  assert.deepEqual(readTestDrafts('owner-a', tab), drafts);
  assert.deepEqual(readTestDrafts('owner-b', tab), {});
  assert.equal(writeTestDrafts('owner-a', {}, tab), true);
  assert.deepEqual(readTestDrafts('owner-a', tab), {});
});

test('logout removes only test drafts and corrupted storage cannot break the app', () => {
  const tab = storage();
  writeTestDrafts('owner-a', { 'test-a': { name: 'draft', unknown: {} } }, tab);
  writeTestDrafts('owner-b', { 'test-b': { weight: 0 } }, tab);
  tab.setItem('unrelated', 'keep');
  clearTestDrafts(tab);
  assert.equal(tab.getItem('unrelated'), 'keep');
  assert.deepEqual(readTestDrafts('owner-a', tab), {});
  tab.setItem('pe_test_drafts_owner-a', '{invalid');
  assert.deepEqual(readTestDrafts('owner-a', tab), {});
  assert.equal(writeTestDrafts('owner-a', {}, { removeItem() { throw new Error('unavailable'); } }), false);
});
