const STATIC_ROUTES = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/manage-tests',
  '/schedule',
  '/lesson-manage',
  '/lesson-edit',
  '/live-run',
  '/stopwatch',
  '/substitute-fills',
  '/missing-grades',
  '/reports',
  '/settings',
]);

const CLASS_CHILD_ROUTES = new Set(['tests', 'bagrut', 'attendance']);

export function normalizeTelemetryPath(pathname) {
  const rawPath = String(pathname || '/').split(/[?#]/, 1)[0];
  const segments = rawPath.split('/').filter(Boolean);

  if (segments[0] === 'class' && segments[1]) {
    if (segments[2] === 'student' && segments[3]) {
      return '/class/:classId/student/:studentId';
    }
    if (CLASS_CHILD_ROUTES.has(segments[2])) return `/class/:classId/${segments[2]}`;
    return '/class/:classId';
  }

  const normalized = `/${segments.join('/')}` || '/';
  return STATIC_ROUTES.has(normalized) ? normalized : '/unknown';
}
