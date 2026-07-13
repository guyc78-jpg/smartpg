import { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import AppLoader from '@/components/app/AppLoader';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AppProvider, useApp } from '@/store/AppProvider';
import { LiveRunProvider } from '@/contexts/LiveRunContext';
import FloatingRunTimer from '@/components/live-run/FloatingRunTimer';
import NewUserGuide from '@/components/onboarding/NewUserGuide';
import RouteTelemetry from '@/components/app/RouteTelemetry';
import ScrollToTop from '@/components/ScrollToTop';

const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));

const HomePage = lazy(() => import('./pages/HomePage'));
const ClassPage = lazy(() => import('./pages/ClassPage'));
const StudentProfilePage = lazy(() => import('./pages/StudentProfilePage'));
const TestsPage = lazy(() => import('./pages/TestsPage'));
const ManageTestsPage = lazy(() => import('./pages/ManageTestsPage'));
const AppSettingsPage = lazy(() => import('./pages/AppSettingsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const BagrutTestsPage = lazy(() => import('./pages/BagrutTestsPage'));
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const LiveRunPage = lazy(() => import('./pages/LiveRunPage'));
const LessonManagePage = lazy(() => import('./pages/LessonManagePage'));
const LessonEditPage = lazy(() => import('./pages/LessonEditPage'));
const SubstituteFillsPage = lazy(() => import('./pages/SubstituteFillsPage'));
const MissingGradesPage = lazy(() => import('./pages/MissingGradesPage'));
const StopwatchPage = lazy(() => import('./pages/StopwatchPage'));
const PageNotFound = lazy(() => import('./lib/PageNotFound'));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center" dir="rtl" role="status" aria-live="polite">
    <div className="flex gap-1.5" aria-hidden="true">
      <span className="w-2 h-2 rounded-full bg-primary animate-loading-dot" />
      <span className="w-2 h-2 rounded-full bg-primary animate-loading-dot" style={{ animationDelay: '0.15s' }} />
      <span className="w-2 h-2 rounded-full bg-primary animate-loading-dot" style={{ animationDelay: '0.3s' }} />
    </div>
    <span className="sr-only">טוען את העמוד</span>
  </div>
);

const AppShell = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const { loading: isLoadingData, loadError, loadAll } = useApp();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), 700);
    return () => clearTimeout(t);
  }, []);

  const appReady = !isLoadingPublicSettings && !isLoadingAuth && !isLoadingData && minTimeElapsed;

  if (appReady && authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
  }

  if (appReady && loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center p-5" dir="rtl">
        <section className="glass-surface w-full max-w-md rounded-3xl p-6 text-center space-y-4" role="alert">
          <h1 className="text-xl font-black">לא הצלחנו לטעון את נתוני היומן</h1>
          <p className="text-sm text-muted-foreground">הנתונים שלך לא נמחקו. בדוק את החיבור ונסה שוב.</p>
          <button
            type="button"
            onClick={() => loadAll()}
            className="btn-3d min-h-12 w-full rounded-xl bg-primary px-4 font-bold text-primary-foreground"
          >
            נסה לטעון מחדש
          </button>
        </section>
      </main>
    );
  }

  return (
    <>
    {!loaderGone && <AppLoader exiting={appReady} onExited={() => setLoaderGone(true)} />}
    {(appReady || loaderGone) && (
    <ErrorBoundary>
      <LiveRunProvider>
      <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/class/:classId" element={<ClassPage />} />
          <Route path="/class/:classId/student/:studentId" element={<StudentProfilePage />} />
          <Route path="/class/:classId/tests" element={<TestsPage />} />
          <Route path="/class/:classId/attendance" element={<Navigate to=".." relative="path" replace />} />
          <Route path="/class/:classId/bagrut" element={<BagrutTestsPage />} />
          <Route path="/manage-tests" element={<ManageTestsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/lesson-manage" element={<LessonManagePage />} />
          <Route path="/lesson-edit" element={<LessonEditPage />} />
          <Route path="/live-run" element={<LiveRunPage />} />
          <Route path="/stopwatch" element={<StopwatchPage />} />
          <Route path="/substitute-fills" element={<SubstituteFillsPage />} />
          <Route path="/missing-grades" element={<MissingGradesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<AppSettingsPage />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      </Suspense>
      <FloatingRunTimer />
      <NewUserGuide enabled={appReady} />
      </LiveRunProvider>
    </ErrorBoundary>
    )}
    </>
  );
};

const AuthenticatedApp = () => (
  <AppProvider>
    <AppShell />
  </AppProvider>
);

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <RouteTelemetry />
        <AuthenticatedApp />
      </Router>
      <Toaster />
      <SonnerToaster position="top-center" richColors closeButton />
    </AuthProvider>
  );
}

export default App;
