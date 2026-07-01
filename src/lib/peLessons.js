export function dayOfWeekFromDateIso(dateIso) {
  return new Date(`${dateIso}T00:00:00`).getDay();
}

export function getPeLessonsForDate(scheduleLessons, dateIso) {
  const dow = dayOfWeekFromDateIso(dateIso);
  return (scheduleLessons || []).filter(l => l.dayOfWeek === dow).sort((a, b) => a.period - b.period);
}

export function getPeClassIdsForDate(scheduleLessons, dateIso) {
  return [...new Set(getPeLessonsForDate(scheduleLessons, dateIso).map(l => l.classId))];
}

export function getPeriodsForClassAndDate(scheduleLessons, dateIso, classId) {
  return getPeLessonsForDate(scheduleLessons, dateIso).filter(l => l.classId === classId).map(l => l.period);
}