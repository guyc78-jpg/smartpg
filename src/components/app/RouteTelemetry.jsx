import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { normalizeTelemetryPath } from '@/lib/telemetry';

export default function RouteTelemetry() {
  const location = useLocation();

  useEffect(() => {
    base44.appLogs.logUserInApp(normalizeTelemetryPath(location.pathname)).catch(() => {});
  }, [location.pathname]);

  return null;
}
