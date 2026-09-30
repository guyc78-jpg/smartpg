import test from 'node:test';
import assert from 'node:assert/strict';
import { validateClassFields, validateStudentName } from '../src/lib/recordValidation.js';
import { buildStudentPayload } from '../src/lib/studentPayload.js';

test('class writes reject invalid lengths and allow exact boundaries and partial updates', () => {
  assert.doesNotThrow(() => validateClassFields({ name: 'א'.repeat(120), notes: 'א'.repeat(2000) }, { requireName: true }));
  assert.doesNotThrow(() => validateClassFields({ status: 'archived' }));
  assert.throws(() => validateClassFields({ name: 'א'.repeat(121) }), /120/);
  assert.throws(() => validateClassFields({ name: '   ' }, { requireName: true }), /שם כיתה/);
  assert.throws(() => validateClassFields({ homeroomTeacher: 'א'.repeat(161) }), /160/);
  assert.throws(() => validateClassFields({ notes: 'א'.repeat(2001) }), /2000/);
});

test('student preflight validates pasted names and full payloads before writing', () => {
  assert.equal(validateStudentName('  QA   תלמיד  '), 'QA תלמיד');
  assert.throws(() => validateStudentName('א'.repeat(161)), /160/);
  assert.throws(() => buildStudentPayload({ name: 'QA', firstName: 'א'.repeat(81) }, { classId: 'own-class' }), /80/);
  assert.throws(() => buildStudentPayload({ name: 'QA', medicalLimitations: 'א'.repeat(2001) }, { classId: 'own-class' }), /2000/);
  assert.doesNotThrow(() => buildStudentPayload({ name: 'QA', studyGroup: 'א'.repeat(120) }, { classId: 'own-class' }));
});
