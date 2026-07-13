import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countRunParticipants,
  inferRunDistance,
  isEligibleRunStudent,
  isGradeableRunParticipant,
  isGradeableRunStudent,
  isLiveRunCompatibleTest,
  planRunAttempt,
} from '../src/components/live-run/runSetupUtils.js';

test('live-run counters include only current, eligible selected students', () => {
  const students = [
    { id: 'active-running', peExempt: false },
    { id: 'active-finished' },
    { id: 'exempt-finished', peExempt: true },
  ];
  const participants = {
    'active-running': { status: 'running' },
    'active-finished': { status: 'finished' },
    'exempt-finished': { status: 'finished' },
    'stale-running': { status: 'running' },
  };

  assert.deepEqual(countRunParticipants(students, participants), {
    running: 1,
    finished: 1,
    participating: 2,
  });
});

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

test('students with a PE exemption cannot be selected or graded in a live run', () => {
  const exemptStudent = { id: 'student-1', peExempt: true };
  const activeStudent = { id: 'student-2', peExempt: false };
  const finish = { status: 'finished', finishTimeMs: 72500 };

  assert.equal(isEligibleRunStudent(exemptStudent), false);
  assert.equal(isEligibleRunStudent(activeStudent), true);
  assert.equal(isGradeableRunStudent(exemptStudent, finish), false);
  assert.equal(isGradeableRunStudent(activeStudent, finish), true);
});

test('retrying a saved live run restores a missing attempt without duplicating an existing one', () => {
  const result = { live_run_id: 'run-1', attempt_count: 2 };

  assert.deepEqual(planRunAttempt(result, [{ attempt_number: 1 }], 'run-1'), {
    sameRun: true,
    attemptNumber: 2,
    shouldCreate: true,
  });
  assert.deepEqual(planRunAttempt(result, [{ attempt_number: 1 }, { attempt_number: 2 }], 'run-1'), {
    sameRun: true,
    attemptNumber: 2,
    shouldCreate: false,
  });
});

test('a new live run advances to the next attempt number', () => {
  const result = { live_run_id: 'old-run', attempt_count: 2 };
  assert.deepEqual(planRunAttempt(result, [{ attempt_number: 1 }, { attempt_number: 2 }], 'new-run'), {
    sameRun: false,
    attemptNumber: 3,
    shouldCreate: true,
  });
});
