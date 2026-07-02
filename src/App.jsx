import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import AppLoader from '@/components/app/AppLoader';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AppProvider } from '@/store/AppProvider';
import { LiveRunProvider } from '@/contexts/LiveRunContext';
import FloatingRunTimer from '@/components/live-run/FloatingRunTimer';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import HomePage from './pages/HomePage';
import ClassPage from './pages/ClassPage';
import StudentProfilePage from './pages/StudentProfilePage';
import TestsPage from './pages/TestsPage';
import ManageTestsPage from './pages/ManageTestsPage';
import AppSettingsPage from './pages/AppSettingsPage';
import ReportsPage from './pages/ReportsPage';
import BagrutTestsPage from './pages/BagrutTestsPage';
import SchedulePage from './pages/SchedulePage';
import LiveRunPage from './pages/LiveRunPage';
import LessonManagePage from './pages/LessonManagePage';
import LessonEditPage from './pages/LessonEditPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), 2200);
    return () => clearTimeout(t);
  }, []);

  const appReady = !isLoadingPublicSettings && !isLoadingAuth && minTimeElapsed;

  if (appReady && authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <>
    {!loaderGone && <AppLoader exiting={appReady} onExited={() => setLoaderGone(true)} />}
    {appReady && (
    <ErrorBoundary>
    <AppProvider>
      <LiveRunProvider>
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
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<AppSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FloatingRunTimer />
      </LiveRunProvider>
    </AppProvider>
    </ErrorBoundary>
    )}
    </>
  );
};

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