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
