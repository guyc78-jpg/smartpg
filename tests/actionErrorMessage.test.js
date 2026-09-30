import test from 'node:test';
import assert from 'node:assert/strict';
import { getActionErrorMessage } from '../src/lib/actionErrorMessage.js';

const fallback = 'השמירה נכשלה. נסו שוב.';

test('permission and validation failures have Hebrew messages without server internals', () => {
  assert.match(getActionErrorMessage({ response: { status: 403, data: { detail: 'data.owner_email permission denied' } } }, fallback), /אין הרשאה/);
  assert.match(getActionErrorMessage({ response: { status: 422, data: { detail: 'database_field schema exception' } } }, fallback), /הנתונים לא תקינים/);
  assert.equal(getActionErrorMessage({ response: { status: 500 }, message: 'תקלה בשרת: private_database_field' }, fallback), fallback);
});

test('local validation remains useful while network and unknown errors stay human readable', () => {
  assert.equal(getActionErrorMessage(new Error('שם הכיתה ארוך מדי'), fallback), 'שם הכיתה ארוך מדי');
  assert.equal(getActionErrorMessage(new Error('Failed to fetch'), fallback), fallback);
  assert.equal(getActionErrorMessage(null, fallback), fallback);
  assert.match(getActionErrorMessage({ response: { status: 401 } }, fallback), /ההתחברות פגה/);
  assert.match(getActionErrorMessage({ response: { status: 504 } }, fallback), /ארכה זמן רב/);
});
