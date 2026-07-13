import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTelemetryPath } from '../src/lib/telemetry.js';

test('telemetry replaces class and student identifiers with route parameters', () => {
  assert.equal(normalizeTelemetryPath('/class/class-secret'), '/class/:classId');
  assert.equal(
    normalizeTelemetryPath('/class/class-secret/student/student-secret'),
    '/class/:classId/student/:studentId',
  );
  assert.equal(normalizeTelemetryPath('/class/class-secret/tests'), '/class/:classId/tests');
});

test('telemetry preserves known static routes and collapses unknown paths', () => {
  assert.equal(normalizeTelemetryPath('/schedule?token=secret'), '/schedule');
  assert.equal(normalizeTelemetryPath('/some/private/value'), '/unknown');
});
