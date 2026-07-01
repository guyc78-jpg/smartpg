import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppProvider } from '@/store/AppProvider';
import { LiveRunProvider } from '@/contexts/LiveRunContext';
import FloatingRunTimer from '@/components/live-run/FloatingRunTimer';
import { StopwatchProvider } from '@/contexts/StopwatchContext';
import FloatingStopwatch from '@/components/stopwatch/FloatingStopwatch';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import HomePage from './pages/HomePage';
import ClassPage from './pages/ClassPage';
import TestsPage from './pages/TestsPage';
import ManageTestsPage from './pages/ManageTestsPage';
import AppSettingsPage from './pages/AppSettingsPage';
import ReportsPage from './pages/ReportsPage';
import BagrutTestsPage from './pages/BagrutTestsPage';
import SchedulePage from './pages/SchedulePage';
import LiveRunPage from './pages/LiveRunPage';
import LessonManagePage from './pages/LessonManagePage';
import LessonEditPage from './pages/LessonEditPage';
import StopwatchPage from './pages/StopwatchPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">חנ״ג</span>
          </div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary/60 animate-loading-dot" style={{ animationDelay: `${i * 0.16}s` }} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">יומן חנ״ג חכם</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <AppProvider>
      <LiveRunProvider>
      <StopwatchProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/class/:classId" element={<ClassPage />} />
          <Route path="/class/:classId/tests" element={<TestsPage />} />
          <Route path="/class/:classId/bagrut" element={<BagrutTestsPage />} />
          <Route path="/manage-tests" element={<ManageTestsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/lesson-manage" element={<LessonManagePage />} />
          <Route path="/lesson-edit" element={<LessonEditPage />} />
          <Route path="/stopwatch" element={<StopwatchPage />} />
          <Route path="/live-run" element={<LiveRunPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<AppSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FloatingRunTimer />
      <FloatingStopwatch />
      </StopwatchProvider>
      </LiveRunProvider>
    </AppProvider>
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