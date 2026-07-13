import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function RouteTelemetry() {
  const location = useLocation();

  useEffect(() => {
    base44.appLogs.logUserInApp(location.pathname).catch(() => {});
  }, [location.pathname]);

  return null;
}
