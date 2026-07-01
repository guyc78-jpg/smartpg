export const PE_SUBJECT_NAME = 'חינוך גופני';

const PE_ALIASES = [
  'חינוך גופני',
  'חנג',
  'ספורט',
  'חינוך גופני בנים',
  'חינוך גופני בנות',
  'ספורט בנים',
  'ספורט בנות',
];

const DAY_NAME_MAP = {
  'ראשון': 0, 'יום ראשון': 0, 'א': 0,
  'שני': 1, 'יום שני': 1, 'ב': 1,
  'שלישי': 2, 'יום שלישי': 2, 'ג': 2,
  'רביעי': 3, 'יום רביעי': 3, 'ד': 3,
  'חמישי': 4, 'יום חמישי': 4, 'ה': 4,
  'שישי': 5, 'יום שישי': 5, 'ו': 5,
  'שבת': 6, 'יום שבת': 6, 'ש': 6,
};

export const DAY_LABELS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function normalizeText(value) {
  return String(value ?? '')
    .replace(/["'׳״]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isPeSubject(rawSubject) {
  const normalized = normalizeText(rawSubject);
  if (!normalized) return false;
  return PE_ALIASES.includes(normalized);
}

export function normalizeDayOfWeek(rawDay) {
  const text = normalizeText(rawDay);
  if (!text) return null;
  if (DAY_NAME_MAP[text] !== undefined) return DAY_NAME_MAP[text];
  const numeric = Number(text);
  if (Number.isNaN(numeric)) return null;
  if (numeric >= 0 && numeric <= 6) return numeric;
  if (numeric >= 1 && numeric <= 7) return numeric - 1;
  return null;
}

export function normalizeClassName(rawName) {
  return normalizeText(rawName);
}

export function scheduleDedupeKey(dayOfWeek, period, classKey) {
  return `${dayOfWeek}::${period}::${classKey}`;
}

export function guessScheduleMapping(columns) {
  const find = (...words) => columns.find(col => words.some(w => col.toLowerCase().includes(w.toLowerCase()))) || '';
  return {
    day: find('יום', 'day'),
    period: find('שעה', 'שיעור', 'period', 'hour'),
    className: find('כיתה', 'class'),
    subject: find('מקצוע', 'subject'),
  };
}

export function parseScheduleCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  const headers = rows[0] || [];
  return rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header || `עמודה ${index + 1}`, values[index] || ''])));
}

// Given raw imported rows + column mapping, returns only the PE lessons, deduped.
export function extractPeLessons(rows, mapping) {
  const scanned = rows.length;
  const seenKeys = new Set();
  const lessons = [];
  let matched = 0;
  let duplicates = 0;
  let invalid = 0;

  rows.forEach(row => {
    const subjectRaw = mapping.subject ? row[mapping.subject] : '';
    if (!isPeSubject(subjectRaw)) return;
    matched += 1;

    const dayOfWeek = normalizeDayOfWeek(mapping.day ? row[mapping.day] : '');
    const period = Number(mapping.period ? row[mapping.period] : NaN);
    const className = mapping.className ? String(row[mapping.className] || '').trim() : '';
    const classKey = normalizeClassName(className);

    if (dayOfWeek === null || !Number.isFinite(period) || !classKey) {
      invalid += 1;
      return;
    }

    const key = scheduleDedupeKey(dayOfWeek, period, classKey);
    if (seenKeys.has(key)) {
      duplicates += 1;
      return;
    }
    seenKeys.add(key);
    lessons.push({ dayOfWeek, period, className, classKey, subject: PE_SUBJECT_NAME });
  });

  return { lessons, scanned, matched, duplicates, invalid };
}