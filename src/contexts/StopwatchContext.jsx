import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'pe_stopwatch_session_v1';
const StopwatchContext = createContext(null);

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getElapsed(session) {
  if (!session) return 0;
  return session.running ? Date.now() - session.startedAt + session.elapsedBeforePause : session.elapsedBeforePause;
}

export function StopwatchProvider({ children }) {
  const [session, setSession] = useState(readStored);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    if (!session?.running) return;
    const id = setInterval(() => setTick(Date.now()), 100);
    return () => clearInterval(id);
  }, [session?.running]);

  const elapsedMs = useMemo(() => getElapsed(session), [session, tick]);

  const startSession = useCallback((setup) => {
    setSession({
      classId: setup.classId, date: setup.date, period: setup.period, label: setup.label || '',
      running: false, startedAt: null, elapsedBeforePause: 0, laps: [],
    });
  }, []);

  const start = useCallback(() => {
    setSession(prev => (prev && !prev.running ? { ...prev, running: true, startedAt: Date.now() } : prev));
  }, []);

  const pause = useCallback(() => {
    setSession(prev => (prev?.running ? { ...prev, running: false, elapsedBeforePause: getElapsed(prev), startedAt: null } : prev));
  }, []);

  const lap = useCallback(() => {
    setSession(prev => (prev ? { ...prev, laps: [...prev.laps, getElapsed(prev)] } : prev));
  }, []);

  const reset = useCallback(() => {
    setSession(prev => (prev ? { ...prev, running: false, startedAt: null, elapsedBeforePause: 0, laps: [] } : prev));
  }, []);

  const closeSession = useCallback(() => setSession(null), []);

  const value = { session, elapsedMs, hasActiveSession: Boolean(session), startSession, start, pause, lap, reset, closeSession };

  return <StopwatchContext.Provider value={value}>{children}</StopwatchContext.Provider>;
}

export function useStopwatch() {
  const ctx = useContext(StopwatchContext);
  if (!ctx) throw new Error('useStopwatch must be used within StopwatchProvider');
  return ctx;
}