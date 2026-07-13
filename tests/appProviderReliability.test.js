import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const provider = readFileSync(new URL('../src/store/AppProvider.jsx', import.meta.url), 'utf8');

test('application loads are owner-scoped, generation guarded and replay concurrent realtime events', () => {
  assert.match(provider, /normalizeOwnerEmail\(user\?\.email\)/);
  assert.match(provider, /loadGenerationRef\.current === generation/);
  assert.match(provider, /ownerEmailRef\.current === requestOwner/);
  assert.match(provider, /startRealtimeSequence/);
  assert.match(provider, /replayRealtimeEventRef\.current/);
  assert.match(provider, /force = false/);
  assert.doesNotMatch(provider, /owner_email:\s*user\?\.email/);
});

test('settings are merged without destructive cleanup and runtime side effects can be reset', () => {
  assert.match(provider, /mergeTeacherSettings\(settingsRows\)/);
  assert.doesNotMatch(provider, /settingsData\.slice\(1\).*TeacherSettings\.delete/s);
  assert.match(provider, /resetSettingsRuntime\(setDefaultGenderTrack\)/);
  assert.match(provider, /localStorage\.removeItem\(key\)/);
});

test('default test seeding performs a deterministic best-effort multi-tab dedupe', () => {
  assert.match(provider, /const DEFAULT_TEST_KEYS = new Set\(DEFAULT_TESTS\.map\(defaultTestKey\)\)/);
  assert.match(provider, /testRows = await listAll\(base44\.entities\.TestDefinition\)/);
  assert.match(provider, /duplicateRows\.map\(row => base44\.entities\.TestDefinition\.delete\(row\.id\)\)/);
  assert.match(provider, /String\(a\.id\)\.localeCompare\(String\(b\.id\)\)/);
});

test('oversized realtime payloads are hydrated before being applied', () => {
  assert.match(provider, /row\?\._oversize/);
  assert.match(provider, /base44\.entities\[entityName\]\.get\(event\.id\)/);
  assert.match(provider, /loadAll\(\{ seedDefaults: false, force: true \}\)/);
});

test('semantic singleton mutations retain the saved backend id', () => {
  assert.match(provider, /behaviorGrades: saved \? upsertById\(filtered, mapBehavior\(saved\)\)/);
  assert.match(provider, /classTestStatuses: upsertById\(filtered, mapClassStatus\(saved\)\)/);
  assert.match(provider, /gradeOverrides: saved \? upsertById\(filtered, mapGradeOverride\(saved\)\)/);
  assert.match(provider, /bagrutResults: saved \? upsertById\(filtered, mapBagrutResult\(saved\)\)/);
});

test('class edits preserve omitted notes and synchronize the primary homeroom contact', () => {
  assert.match(provider, /hasOwn\('notes'\) \? \(payloadData\.notes \|\| ''\) : existing\.notes/);
  assert.match(provider, /homeroom_contacts: homeroomContacts/);
  assert.match(provider, /\{ \.\.\.homeroomContacts\[0\], name: homeroomTeacher \}/);
});

test('Bagrut payloads normalize numbers and never send a nullable raw score update', () => {
  assert.match(provider, /const normalizedRawScore = shouldDelete \? null : Number\(rawScore\)/);
  assert.match(provider, /raw_score: normalizedRawScore/);
  assert.match(provider, /\.\.\.\(hasScore \? \{ score: normalizedScore \} : \{\}\)/);
  assert.match(provider, /if \(shouldDelete\) \{[\s\S]*BagrutResult\.delete/);
});

test('destructive cascades query remote dependents, reconcile failures and clear auxiliary data', () => {
  assert.match(provider, /filterAll\(base44\.entities\.Student, \{ class_id: id \}\)/);
  assert.match(provider, /filterAll\(base44\.entities\.TestDefinition, \{ class_id: id \}\)/);
  assert.match(provider, /base44\.entities\.WizardConfig/);
  assert.match(provider, /מחיקת הכיתה לא הושלמה במלואה/);
  assert.match(provider, /מחיקת כל הנתונים לא הושלמה במלואה/);
});

test('a corrected live-run result updates its existing attempt instead of creating a duplicate', () => {
  assert.match(provider, /attempts\.find\(attempt => attempt\.live_run_id === metadata\.live_run_id\)/);
  assert.match(provider, /TestAttempt\.update\(sameLiveRunAttempt\.id/);
  assert.match(provider, /&& !sameLiveRunAttempt/);
});

test('lesson topic saves clean all semantic duplicates', () => {
  assert.match(provider, /existing\.map\(row => base44\.entities\.LessonTopic\.delete\(row\.id\)\)/);
  assert.match(provider, /existing\.slice\(1\)\.map\(row => base44\.entities\.LessonTopic\.delete\(row\.id\)\)/);
  assert.match(provider, /lessonTopics: saved \? upsertById\(filtered, mapLessonTopic\(saved\)\) : filtered/);
});
