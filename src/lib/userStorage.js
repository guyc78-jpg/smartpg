import { clearTestDrafts } from './testDraftStorage.js';

const USER_SCOPED_KEYS = [
  'pe_live_run_session_v2',
  'pe_live_run_session_v1',
  'teacherName',
  'schoolName',
  'defaultSemester',
  'bellSchedule.v2',
  'bellSchedule.v1',
];

export function clearUserScopedStorage() {
  if (typeof window === 'undefined') return;
  for (const key of USER_SCOPED_KEYS) {
    try { window.localStorage.removeItem(key); } catch { /* Continue authentication cleanup if storage is unavailable. */ }
  }
  clearTestDrafts();
}
