import { base44 } from '@/api/base44Client';

const safeRoute = () => {
  if (typeof window === 'undefined') return 'server';
  return window.location.pathname.replace(/[a-f0-9]{12,}/gi, ':id').slice(0, 120);
};

export function reportClientError(error, context = {}) {
  try {
    const value = error instanceof Error ? error : new Error(String(error || 'Unknown error'));
    base44.analytics.track({
      eventName: 'client_error',
      properties: {
        error_name: String(value.name || 'Error').slice(0, 60),
        status: Number(value.status || context.status || 0),
        source: String(context.source || 'runtime').slice(0, 80),
        route: safeRoute(),
      },
    });
  } catch {
    // Telemetry must never interfere with the user flow.
  }
}

export function installGlobalErrorMonitoring() {
  if (typeof window === 'undefined') return () => {};
  const onError = event => reportClientError(event.error || event.message, { source: 'window.error' });
  const onRejection = event => reportClientError(event.reason, { source: 'unhandledrejection' });
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}
