import test from 'node:test';
import assert from 'node:assert/strict';
import { readTestDrafts, writeTestDrafts, clearTestDrafts, isNewTestDraft } from '../src/lib/testDraftStorage.js';

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

test('unsaved new tests survive refresh without changing saved test identity', () => {
  const tab = storage();
  const draft = { id: 'local_123_1', _isNew: true, name: 'QA מבדק', gradeLevel: 'ז', genderTrack: 'boys', testType: 'running', weight: 0, conversionTable: [] };
  assert.equal(writeTestDrafts('owner-a', { local_123_1: draft }, tab), true);
  assert.deepEqual(readTestDrafts('owner-a', tab), { local_123_1: draft });
  assert.deepEqual(readTestDrafts('owner-b', tab), {});
  assert.equal(isNewTestDraft('local_123_1', readTestDrafts('owner-a', tab).local_123_1), true);
  assert.equal(isNewTestDraft('saved-test', { ...draft, id: 'saved-test' }), false);
  tab.setItem('pe_test_drafts_owner-a', JSON.stringify({ local_bad: { _isNew: true, name: {} }, saved: { _isNew: true, name: 'edit' } }));
  assert.deepEqual(readTestDrafts('owner-a', tab), { saved: { name: 'edit' } });
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
