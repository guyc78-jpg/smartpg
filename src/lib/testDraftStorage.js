const PREFIX = 'pe_test_drafts_';
const FIELDS = new Set(['name', 'testType', 'weight', 'gradeLevel', 'classId', 'genderTrack', 'semester', 'testDate', 'unit']);

function normalizedDrafts(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([id, fields]) => {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id) || ['__proto__', 'constructor', 'prototype'].includes(id)
      || !fields || typeof fields !== 'object' || Array.isArray(fields)) return [];
    const draft = Object.fromEntries(Object.entries(fields).filter(([key, field]) =>
      FIELDS.has(key) && (typeof field === 'string' || (typeof field === 'number' && Number.isFinite(field)))));
    return Object.keys(draft).length ? [[id, draft]] : [];
  }));
}

export function readTestDrafts(ownerId, storage) {
  if (!ownerId) return {};
  try {
    return normalizedDrafts(JSON.parse((storage || globalThis.sessionStorage)?.getItem(PREFIX + ownerId) || '{}'));
  } catch { return {}; }
}

export function writeTestDrafts(ownerId, drafts, storage) {
  if (!ownerId) return false;
  try {
    const target = storage || globalThis.sessionStorage;
    if (!target) return false;
    const normalized = normalizedDrafts(drafts);
    if (Object.keys(normalized).length) target.setItem(PREFIX + ownerId, JSON.stringify(normalized));
    else target.removeItem(PREFIX + ownerId);
    return true;
  } catch { return false; }
}

export function clearTestDrafts(storage) {
  try {
    const target = storage || globalThis.sessionStorage;
    if (!target) return;
    const keys = Array.from({ length: target.length }, (_, index) => target.key(index));
    for (const key of keys) if (key?.startsWith(PREFIX)) target.removeItem(key);
  } catch { /* Storage may be unavailable; auth cleanup must still continue. */ }
}
