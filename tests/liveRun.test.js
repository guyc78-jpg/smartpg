import test from 'node:test';
import assert from 'node:assert/strict';
import { inferRunDistance, isGradeableRunParticipant, isLiveRunCompatibleTest } from '../src/components/live-run/runSetupUtils.js';

test('run distance is inferred from Hebrew test names', () => {
  assert.equal(inferRunDistance({ name: 'ריצת 60 מטר' }), 60);
  assert.equal(inferRunDistance({ name: 'ריצת 2,000 מטרים' }), 2000);
});

test('non-running names without a distance do not invent one', () => {
  assert.equal(inferRunDistance({ name: 'כפיפות בטן בדקה' }), null);
});

test('legacy running tests remain selectable even when their stored type is other', () => {
  assert.equal(isLiveRunCompatibleTest({ name: 'ריצת 600 מטר', testType: 'other' }), true);
  assert.equal(isLiveRunCompatibleTest({ name: 'כפיפות בטן בדקה', testType: 'other' }), false);
});

test('only a finished participant with a valid time can receive a test grade', () => {
  assert.equal(isGradeableRunParticipant({ status: 'finished', finishTimeMs: 72500 }), true);
  assert.equal(isGradeableRunParticipant({ status: 'not_completed', finishTimeMs: 72500 }), false);
  assert.equal(isGradeableRunParticipant({ status: 'finished', finishTimeMs: null }), false);
});
