import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'pe_live_run_session_v2';
const LEGACY_KEY = 'pe_live_run_session_v1';
const LiveRunContext = createContext(null);

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getElapsed(session) {
  if (!session) return 0;
  return session.running ? Date.now() - session.startedAt + session.elapsedBeforePause : session.elapsedBeforePause;
}

function withHistory(participant, next) {
  return { ...next, history: [...(participant.history || []), { ...participant, history: [] }].slice(-12), unsaved: true };
}

export function LiveRunProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_KEY);
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

  const startSession = useCallback((setup, students) => {
    const participants = Object.fromEntries(students.map(student => [
      student.id,
      { studentId: student.id, laps: 0, lapTimes: [], status: 'running', finishTimeMs: null, history: [], unsaved: true }
    ]));
    setSession({
      id: `run_${Date.now()}`,
      setup,
      participants,
      selectedIds: students.map(s => s.id),
      running: false,
      startedAt: null,
      elapsedBeforePause: 0,
      phase: 'running',
      createdAt: new Date().toISOString(),
      saved: false,
    });
  }, []);

  const startTimer = useCallback(() => {
    setSession(prev => prev && !prev.running ? { ...prev, running: true, startedAt: Date.now() } : prev);
  }, []);

  const pauseTimer = useCallback(() => {
    setSession(prev => prev?.running ? { ...prev, running: false, elapsedBeforePause: getElapsed(prev), startedAt: null } : prev);
  }, []);

  const resetRun = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      const participants = Object.fromEntries(Object.entries(prev.participants).map(([id, p]) => [
        id,
        { ...p, laps: 0, lapTimes: [], status: 'running', finishTimeMs: null, history: [], unsaved: true }
      ]));
      return { ...prev, running: false, startedAt: null, elapsedBeforePause: 0, phase: 'running', participants, saved: false };
    });
  }, []);

  const closeSession = useCallback(() => setSession(null), []);

  const markLap = useCallback((studentId) => {
    setSession(prev => {
      if (!prev) return prev;
      const participant = prev.participants[studentId];
      if (!participant || participant.status !== 'running') return prev;
      const elapsed = getElapsed(prev);
      const laps = participant.laps + 1;
      const nextParticipant = withHistory(participant, {
        ...participant,
        laps,
        lapTimes: [...(participant.lapTimes || []), elapsed],
      });
      return { ...prev, participants: { ...prev.participants, [studentId]: nextParticipant }, saved: false };
    });
  }, []);

  const setLaps = useCallback((studentId, laps) => {
    setSession(prev => {
      if (!prev) return prev;
      const participant = prev.participants[studentId];
      if (!participant || participant.status !== 'running') return prev;
      const elapsed = getElapsed(prev);
      const nextParticipant = withHistory(participant, {
        ...participant,
        laps,
        lapTimes: [...(participant.lapTimes || []), elapsed],
      });
      return { ...prev, participants: { ...prev.participants, [studentId]: nextParticipant }, saved: false };
    });
  }, []);

  const finishStudent = useCallback((studentId) => {
    setSession(prev => {
      if (!prev) return prev;
      const participant = prev.participants[studentId];
      if (!participant || participant.status === 'finished') return prev;
      const elapsed = getElapsed(prev);
      const nextParticipant = withHistory(participant, {
        ...participant,
        status: 'finished',
        finishTimeMs: elapsed,
        laps: prev.setup?.totalLaps ?? participant.laps,
        lapTimes: participant.lapTimes?.length ? participant.lapTimes : [elapsed],
      });
      return { ...prev, participants: { ...prev.participants, [studentId]: nextParticipant }, saved: false };
    });
  }, []);

  const setStudentStatus = useCallback((studentId, status) => {
    setSession(prev => {
      if (!prev) return prev;
      const participant = prev.participants[studentId];
      if (!participant) return prev;
      const nextParticipant = withHistory(participant, {
        ...participant,
        status,
        finishTimeMs: status === 'finished' ? participant.finishTimeMs ?? getElapsed(prev) : null,
      });
      return { ...prev, participants: { ...prev.participants, [studentId]: nextParticipant }, saved: false };
    });
  }, []);

  const undoStudent = useCallback((studentId) => {
    setSession(prev => {
      const participant = prev?.participants?.[studentId];
      const history = participant?.history || [];
      if (!prev || history.length === 0) return prev;
      const previous = history[history.length - 1];
      return { ...prev, participants: { ...prev.participants, [studentId]: { ...previous, history: history.slice(0, -1), unsaved: true } }, saved: false };
    });
  }, []);

  const finishRun = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      const elapsed = getElapsed(prev);
      const participants = Object.fromEntries(Object.entries(prev.participants).map(([id, p]) => [
        id,
        p.status === 'running' && (p.laps || 0) > 0 ? { ...p, status: 'not_completed', finishTimeMs: null, unsaved: true } : p.status === 'running' ? { ...p, status: 'not_participated', finishTimeMs: null, unsaved: true } : p
      ]));
      return { ...prev, running: false, startedAt: null, elapsedBeforePause: elapsed, phase: 'summary', participants };
    });
  }, []);

  const reopenRun = useCallback(() => setSession(prev => prev ? { ...prev, phase: 'running' } : prev), []);

  const updateSummaryResult = useCallback((studentId, patch) => {
    setSession(prev => {
      if (!prev) return prev;
      const participant = prev.participants[studentId];
      if (!participant) return prev;
      return { ...prev, participants: { ...prev.participants, [studentId]: { ...participant, ...patch, unsaved: true } }, saved: false };
    });
  }, []);

  const markSaved = useCallback(() => setSession(prev => prev ? { ...prev, saved: true } : prev), []);

  const hasUnsavedWork = useMemo(() => Boolean(session && (!session.saved || Object.values(session.participants || {}).some(p => p.unsaved))), [session]);

  const value = {
    session,
    elapsedMs,
    hasActiveRun: Boolean(session),
    hasUnsavedWork,
    startSession,
    startTimer,
    pauseTimer,
    resumeTimer: startTimer,
    resetRun,
    closeSession,
    markLap,
    setLaps,
    finishStudent,
    setStudentStatus,
    undoStudent,
    finishRun,
    reopenRun,
    updateSummaryResult,
    markSaved,
  };

  return <LiveRunContext.Provider value={value}>{children}</LiveRunContext.Provider>;
}

export function useLiveRun() {
  const ctx = useContext(LiveRunContext);
  if (!ctx) throw new Error('useLiveRun must be used within LiveRunProvider');
  return ctx;
}