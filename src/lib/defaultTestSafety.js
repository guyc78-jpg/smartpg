export function canRemoveDefaultDuplicate(row, defaultTest, referencedIds = new Set()) {
  if (!row?.id || !defaultTest || referencedIds.has(row.id)) return false;
  if (row.class_id || row.classId || row.semester || row.test_date || row.testDate) return false;
  const table = row.conversion_table ?? row.conversionTable ?? [];
  if (!Array.isArray(table) || table.length !== 0) return false;
  return Number(row.weight) === Number(defaultTest.weight);
}
