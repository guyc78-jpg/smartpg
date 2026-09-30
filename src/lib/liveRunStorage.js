const STATUSES = new Set(['running', 'finished', 'not_completed', 'not_participated']);
const finiteNonNegative = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;

function validParticipant(participant) {
  return participant && typeof participant === 'object'
    && STATUSES.has(participant.status)
    && finiteNonNegative(participant.laps)
    && Array.isArray(participant.lapTimes)
    && participant.lapTimes.every(finiteNonNegative)
    && (participant.finishTimeMs == null || finiteNonNegative(participant.finishTimeMs));
}

// Browser storage is shared by accounts and may contain a legacy or malformed draft.
// Restore only participants that are present in the authenticated owner's data.
export function restoreOwnedRunSession(session, ownerId, students) {
  if (!ownerId || !session || typeof session !== 'object') return null;
  if (typeof session.id !== 'string' || !session.id || session.id.length > 128) return null;
  if (session.ownerId && session.ownerId !== ownerId) return null;
  if (!session.setup?.classId || !['running', 'summary', 'edit'].includes(session.phase)) return null;
  if (!Array.isArray(session.selectedIds) || session.selectedIds.length === 0
    || new Set(session.selectedIds).size !== session.selectedIds.length) return null;
  if (!finiteNonNegative(session.elapsedBeforePause) || typeof session.running !== 'boolean'
    || (session.running && !finiteNonNegative(session.startedAt))) return null;
  const ownedStudents = new Map((students || []).map(student => [student.id, student]));
  if (!session.selectedIds.every(id => {
    const student = ownedStudents.get(id);
    return student && (student.classId || student.class_id) === session.setup.classId
      && validParticipant(session.participants?.[id]);
  })) return null;

  const studentsById = Object.fromEntries(session.selectedIds.map(id => {
    const student = ownedStudents.get(id);
    return [id, {
      id, name: student.name || '',
      firstName: student.firstName || student.first_name || '',
      lastName: student.lastName || student.last_name || '',
      classId: student.classId || student.class_id || '',
    }];
  }));
  const participants = Object.fromEntries(session.selectedIds.map(id => {
    const participant = session.participants[id];
    return [id, {
      ...participant, studentId: id,
      history: Array.isArray(participant.history)
        ? participant.history.filter(validParticipant).slice(-12).map(item => ({ ...item, history: [] })) : [],
    }];
  }));
  return { ...session, ownerId, studentsById, participants };
}
