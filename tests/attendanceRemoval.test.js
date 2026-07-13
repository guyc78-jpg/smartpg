import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('attendance feature stays removed while legacy links redirect to the class', () => {
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const classCardSource = readFileSync(new URL('../src/components/home/ClassCard.jsx', import.meta.url), 'utf8');

  assert.equal(existsSync(new URL('../src/pages/AttendancePage.jsx', import.meta.url)), false);
  assert.equal(existsSync(new URL('../base44/entities/attendance-record.jsonc', import.meta.url)), false);
  assert.doesNotMatch(appSource, /AttendancePage/);
  assert.equal(
    appSource.includes('path="/class/:classId/attendance" element={<Navigate to=".." relative="path" replace />}'),
    true,
  );
  assert.doesNotMatch(classCardSource, /\/attendance|UserCheck|נוכחות/);
});
