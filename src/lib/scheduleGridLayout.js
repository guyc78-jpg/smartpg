export function getScheduleGridDimensions(maxLessonCount) {
  const normalizedCount = Math.max(0, Math.floor(Number(maxLessonCount) || 0));
  const columns = normalizedCount > 1 ? 2 : 1;
  const rows = Math.max(1, Math.ceil(normalizedCount / columns));
  return { columns, rows };
}
