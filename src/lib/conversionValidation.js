export function validateConversionTable(rows = []) {
  if (!Array.isArray(rows)) return { valid: false, message: 'טבלת ההמרה חייבת להכיל רשימת שורות.' };
  const numberOrMissing = value => value === null || value === undefined || String(value).trim() === '' ? null : Number(value);
  const normalized = rows
    .map(row => ({
      minResult: numberOrMissing(row?.minResult),
      maxResult: numberOrMissing(row?.maxResult),
      grade: numberOrMissing(row?.grade),
    }))
    .filter(row => row.minResult !== null || row.maxResult !== null || row.grade !== null);

  for (const row of normalized) {
    if (![row.minResult, row.maxResult, row.grade].every(Number.isFinite)) {
      return { valid: false, message: 'יש למלא בכל שורה תוצאה התחלתית, תוצאה סופית וציון מספריים.' };
    }
    if (row.minResult < 0 || row.maxResult < 0) {
      return { valid: false, message: 'תוצאות בטבלת ההמרה חייבות להיות אפס או מספר חיובי.' };
    }
    if (row.grade < 0 || row.grade > 100) {
      return { valid: false, message: 'הציון בטבלת ההמרה חייב להיות בין 0 ל־100.' };
    }
  }

  const sorted = normalized
    .map(row => ({
      minResult: Math.min(row.minResult, row.maxResult),
      maxResult: Math.max(row.minResult, row.maxResult),
      grade: row.grade,
    }))
    .sort((a, b) => a.minResult - b.minResult || a.maxResult - b.maxResult);

  const seenRanges = new Set();
  for (let i = 0; i < sorted.length; i += 1) {
    const row = sorted[i];
    const key = `${row.minResult}-${row.maxResult}`;
    if (seenRanges.has(key)) {
      return { valid: false, message: 'קיימת כפילות בטווחי התוצאות. יש להשאיר כל טווח פעם אחת בלבד.' };
    }
    seenRanges.add(key);

    const previous = sorted[i - 1];
    if (previous && row.minResult <= previous.maxResult) {
      return { valid: false, message: 'טווחי התוצאות חופפים. תקן את הטווחים לפני שמירה.' };
    }
  }

  return { valid: true, rows: sorted };
}