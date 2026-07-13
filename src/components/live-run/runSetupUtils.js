export function inferRunDistance(test) {
  const match = String(test?.name || '').match(/(\d[\d,]{1,6})\s*(?:מטר(?:ים)?|מ['׳]?|m)/i);
  return match ? Number(match[1].replace(/,/g, '')) : null;
}

export function isLiveRunCompatibleTest(test) {
  if (!test) return false;
  if (test.testType === 'running') return true;
  return /ריצ/u.test(String(test.name || '')) && inferRunDistance(test) !== null;
}

export function isGradeableRunParticipant(participant) {
  if (participant?.finishTimeMs == null) return false;
  const finishTimeMs = Number(participant?.finishTimeMs);
  return participant?.status === 'finished' && Number.isFinite(finishTimeMs) && finishTimeMs >= 0;
}

export function isEligibleRunStudent(student) {
  return Boolean(student && student.peExempt !== true);
}

export function isGradeableRunStudent(student, participant) {
  return isEligibleRunStudent(student) && isGradeableRunParticipant(participant);
}

export function countRunParticipants(students = [], participants = {}) {
  const selectedParticipants = students
    .filter(isEligibleRunStudent)
    .map(student => participants?.[student.id])
    .filter(Boolean);

  return {
    running: selectedParticipants.filter(participant => participant.status === 'running').length,
    finished: selectedParticipants.filter(participant => participant.status === 'finished').length,
    participating: selectedParticipants.filter(participant => participant.status === 'running' || participant.status === 'finished').length,
  };
}

export function planRunAttempt(existingResult, previousAttempts = [], liveRunId) {
  const sameRun = Boolean(existingResult && existingResult.live_run_id === liveRunId);
  const highestAttempt = Math.max(
    0,
    ...previousAttempts.map(attempt => Number(attempt.attempt_number) || 0),
  );
  const storedAttemptCount = Number(existingResult?.attempt_count) || 0;
  const attemptNumber = sameRun
    ? Math.max(1, storedAttemptCount, highestAttempt)
    : highestAttempt + 1;
  const attemptExists = previousAttempts.some(
    attempt => Number(attempt.attempt_number) === attemptNumber,
  );

  return {
    sameRun,
    attemptNumber,
    shouldCreate: !attemptExists,
  };
}
