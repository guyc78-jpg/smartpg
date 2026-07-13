import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSemesterGrades, isTestEligibleForClass } from '../src/lib/gradeCalc.js';

const testDefinition = {
  id: 'run-1',
  name: 'ריצת 60 מטר',
  weight: 100,
  gradeLevel: 'ז',
  genderTrack: 'boys',
  conversionTable: [{ minResult: 0, maxResult: 20, grade: 80 }],
};

test('zero penalty and zero minimum grade are respected', () => {
  const result = calculateSemesterGrades(
    'student-1',
    [testDefinition],
    [{ studentId: 'student-1', testId: 'run-1', semester: 'A', rawScore: null, status: 'not_participated' }],
    [],
    { penaltyScore: 0, minCompletedGrade: 0, testsWeight: 0 },
    ['run-1'],
    'A',
    false,
  );
  assert.equal(result.testsAvg, 0);
});

test('autoConvertMissing applies the configured penalty to a pending result', () => {
  const result = calculateSemesterGrades(
    'student-1',
    [testDefinition],
    [],
    [],
    { penaltyScore: 12, autoConvertMissing: true, minCompletedGrade: 0 },
    ['run-1'],
    'A',
    false,
  );
  assert.equal(result.testsAvg, 12);
  assert.deepEqual(result.missingTests, []);
});

test('class-specific and semester-specific eligibility is enforced', () => {
  const cls = { id: 'class-a', gradeLevel: 'ז', genderTrack: 'boys' };
  assert.equal(isTestEligibleForClass({ ...testDefinition, classId: 'class-a', semester: 'A' }, cls, 'A'), true);
  assert.equal(isTestEligibleForClass({ ...testDefinition, classId: 'class-b', semester: 'A' }, cls, 'A'), false);
  assert.equal(isTestEligibleForClass({ ...testDefinition, classId: 'class-a', semester: 'B' }, cls, 'A'), false);
});
