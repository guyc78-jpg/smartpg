import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (relativePath) => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('lesson and substitute screens expose recoverable loading failures', () => {
  const lessonManage = source('src/pages/LessonManagePage.jsx');
  const lessonEdit = source('src/pages/LessonEditPage.jsx');
  const substituteFills = source('src/pages/SubstituteFillsPage.jsx');

  for (const page of [lessonManage, lessonEdit, substituteFills]) {
    assert.match(page, /loadError/);
    assert.match(page, /catch \(error\)/);
    assert.match(page, /finally/);
    assert.match(page, /נסו שוב/);
    assert.match(page, /role="alert"/);
  }
});

test('route changes provide titles, focus announcements and a skip link without a dormant query provider', () => {
  const app = source('src/App.jsx');
  const routeAccessibility = source('src/components/ScrollToTop.jsx');
  const login = source('src/pages/Login.jsx');
  const authLayout = source('src/components/AuthLayout.jsx');

  assert.match(app, /<ScrollToTop \/>/);
  assert.doesNotMatch(app, /QueryClientProvider|queryClientInstance/);
  assert.match(routeAccessibility, /document\.title/);
  assert.match(routeAccessibility, /MutationObserver/);
  assert.match(routeAccessibility, /דלג לתוכן הראשי/);
  assert.match(routeAccessibility, /aria-live="polite"/);
  assert.match(login, /<main/);
  assert.match(login, /id="route-main-content"/);
  assert.match(authLayout, /<main/);
  assert.match(authLayout, /id="route-main-content"/);
});

test('grade controls and onboarding progress retain accessible names and semantics', () => {
  const testsPage = source('src/pages/TestsPage.jsx');
  const bagrutPage = source('src/pages/BagrutTestsPage.jsx');
  const behavior = source('src/components/student-profile/BehaviorSection.jsx');
  const runSummary = source('src/components/live-run/RunSummary.jsx');
  const settings = source('src/pages/AppSettingsPage.jsx');
  const guide = source('src/components/onboarding/NewUserGuide.jsx');

  assert.match(testsPage, /aria-label={`תוצאה עבור/);
  assert.match(bagrutPage, /aria-label={`תוצאה עבור/);
  assert.match(behavior, /htmlFor={`behavior-grade-/);
  assert.match(runSummary, /aria-label={`זמן בשניות עבור/);
  assert.match(settings, /settings-penalty-score-help/);
  assert.match(settings, /gradeValues\.some/);
  assert.match(guide, /role="progressbar"/);
  assert.match(guide, /aria-valuenow={step \+ 1}/);
});

test('custom grade pickers expose truthful button-group semantics', () => {
  const testsPage = source('src/pages/TestsPage.jsx');
  const bagrutPage = source('src/pages/BagrutTestsPage.jsx');

  for (const page of [testsPage, bagrutPage]) {
    assert.doesNotMatch(page, /aria-haspopup="listbox"/);
    assert.match(page, /role="group"/);
    assert.match(page, /aria-pressed=/);
    assert.match(page, /aria-controls=/);
  }
});

test('editable grades retain drafts and expose busy state while async saves run', () => {
  const testsPage = source('src/pages/TestsPage.jsx');
  const bagrutPage = source('src/pages/BagrutTestsPage.jsx');
  const behavior = source('src/components/student-profile/BehaviorSection.jsx');

  for (const page of [testsPage, bagrutPage]) {
    assert.match(page, /savingKeys/);
    assert.match(page, /aria-busy=/);
    assert.match(page, /toast\.error/);
  }
  assert.match(behavior, /drafts/);
  assert.match(behavior, /onBlur=/);
  assert.match(behavior, /toast\.error/);
});

test('run history loading failures are recoverable and never masquerade as empty history', () => {
  const profile = source('src/pages/StudentProfilePage.jsx');
  const history = source('src/components/student-profile/RunHistorySection.jsx');
  const stopwatch = source('src/pages/StopwatchPage.jsx');

  assert.match(profile, /runError/);
  assert.match(profile, /setRunReloadKey/);
  assert.match(history, /onRetry/);
  assert.match(history, /role="alert"/);
  assert.match(stopwatch, /setHistory\(\[\]\)/);
  assert.match(stopwatch, /historyError/);
});

test('the heavy run history chart is loaded only when chart data is rendered', () => {
  const section = source('src/components/student-profile/RunHistorySection.jsx');
  const chart = source('src/components/student-profile/RunHistoryChart.jsx');

  assert.match(section, /lazy\(\(\) => import\('\.\/RunHistoryChart'\)\)/);
  assert.doesNotMatch(section, /from 'recharts'/);
  assert.match(chart, /from 'recharts'/);
  assert.match(chart, /role="img"/);
});
