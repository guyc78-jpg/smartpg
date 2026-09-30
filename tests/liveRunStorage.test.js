import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreOwnedRunSession } from '../src/lib/liveRunStorage.js';

const students = [{ id: 'student-a', classId: 'class-a', name: 'תלמיד', medicalNotes: 'private' }];
const session = {
  id: 'run-a', ownerId: 'owner-a', setup: { classId: 'class-a' }, phase: 'running',
  selectedIds: ['student-a'], running: false, startedAt: null, elapsedBeforePause: 100,
  studentsById: { 'student-a': { name: 'stale name', medicalNotes: 'private' } },
  participants: { 'student-a': { status: 'running', laps: 0, lapTimes: [], finishTimeMs: null } },
};

test('stored runs restore only for their authenticated owner', () => {
  assert.equal(restoreOwnedRunSession(session, 'owner-b', students), null);
  assert.equal(restoreOwnedRunSession(session, null, students), null);
  const restored = restoreOwnedRunSession(session, 'owner-a', students);
  assert.equal(restored.studentsById['student-a'].name, 'תלמיד');
  assert.equal('medicalNotes' in restored.studentsById['student-a'], false);
});

test('legacy drafts migrate only when every participant belongs to the current class and account', () => {
  const legacy = { ...session, ownerId: undefined };
  assert.equal(restoreOwnedRunSession(legacy, 'owner-a', students).ownerId, 'owner-a');
  assert.equal(restoreOwnedRunSession(legacy, 'owner-b', []), null);
  assert.equal(restoreOwnedRunSession(legacy, 'owner-a', [{ ...students[0], classId: 'class-b' }]), null);
});

test('corrupted stored drafts cannot crash or create orphan participants', () => {
  for (const draft of [null, {}, { ...session, elapsedBeforePause: '100' },
    { ...session, selectedIds: ['missing'] }, { ...session, participants: {} },
    { ...session, running: true, startedAt: null },
    { ...session, selectedIds: ['student-a', 'student-a'] },
  ]) assert.equal(restoreOwnedRunSession(draft, 'owner-a', students), null);
  const malformed = { ...session, participants: { ...session.participants,
    'student-a': { ...session.participants['student-a'], history: 'invalid' },
    missing: { status: 'running' },
  } };
  const restored = restoreOwnedRunSession(malformed, 'owner-a', students);
  assert.deepEqual(restored.participants['student-a'].history, []);
  assert.equal('missing' in restored.participants, false);
});
