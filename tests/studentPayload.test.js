import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStudentPayload,
  normalizeStudentGender,
  studentDedupeKey,
} from '../src/lib/studentPayload.js';

test('student payload never emits an invalid empty gender', () => {
  const payload = buildStudentPayload({ name: '  דנה   כהן  ' }, {
    classId: 'class-1',
    fallbackGender: 'girls',
  });
  assert.equal(payload.name, 'דנה כהן');
  assert.equal(payload.gender, 'girls');
});

test('student edits preserve existing class and gender when omitted', () => {
  const payload = buildStudentPayload({ name: 'אורי לוי', peExempt: true }, {
    existing: { classId: 'class-2', gender: 'boys' },
  });
  assert.equal(payload.class_id, 'class-2');
  assert.equal(payload.gender, 'boys');
  assert.equal(payload.pe_exempt, true);
});

test('invalid genders fall back safely and dedupe keys normalize whitespace', () => {
  assert.equal(normalizeStudentGender(''), 'other');
  assert.equal(studentDedupeKey(' נועה   כהן ', 'c1'), studentDedupeKey('נועה כהן', 'c1'));
});
