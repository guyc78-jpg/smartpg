import { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import AppLoader from '@/components/app/AppLoader';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AppProvider, useApp } from '@/store/AppProvider';
import { LiveRunProvider } from '@/contexts/LiveRunContext';
import FloatingRunTimer from '@/components/live-run/FloatingRunTimer';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import HomePage from './pages/HomePage';
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
const WizardsPage = lazy(() => import('./pages/WizardsPage'));
const MissingGradesPage = lazy(() => import('./pages/MissingGradesPage'));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center" dir="rtl">
    <div className="flex gap-1.5">
      <span className="w-2 h-2 rounded-full bg-primary animate-loading-dot" />
      <span className="w-2 h-2 rounded-full bg-primary animate-loading-dot" style={{ animationDelay: '0.15s' }} />
      <span className="w-2 h-2 rounded-full bg-primary animate-loading-dot" style={{ animationDelay: '0.3s' }} />
    </div>
  </div>
);

const AppShell = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const { loading: isLoadingData } = useApp();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), 700);
    return () => clearTimeout(t);
  }, []);

  const appReady = !isLoadingPublicSettings && !isLoadingAuth && !isLoadingData && minTimeElapsed;

  if (appReady && authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') {
      const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
      if (!authRoutes.includes(window.location.pathname)) {
        window.location.href = '/login';
        return null;
      }
      // On an auth page — fall through and render it so the user can actually log in
    }
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
          <Route path="/class/:classId/bagrut" element={<BagrutTestsPage />} />
          <Route path="/manage-tests" element={<ManageTestsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/lesson-manage" element={<LessonManagePage />} />
          <Route path="/lesson-edit" element={<LessonEditPage />} />
          <Route path="/live-run" element={<LiveRunPage />} />
          <Route path="/substitute-fills" element={<SubstituteFillsPage />} />
          <Route path="/wizards" element={<WizardsPage />} />
          <Route path="/missing-grades" element={<MissingGradesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<AppSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      <FloatingRunTimer />
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
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;