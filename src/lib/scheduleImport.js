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

function parseCsvRows(text) {
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
  return rows;
}

export function parseScheduleCsv(text) {
  const rows = parseCsvRows(text);
  const headers = rows[0] || [];
  return rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header || `עמודה ${index + 1}`, values[index] || ''])));
}

// Matches class tokens like: ח' 1, ט' 5, י' 2, י"א 7, י"ב 3
const CLASS_TOKEN_RE = /(י["״][אב]|[א-ת]['׳])\s*(\d{1,2})/g;

// Parses "teacher schedule report" CSVs where each row is: period, day name,
// and a combined cell of "subject,  class class class". Returns null if the
// file doesn't look like this format.
export function parseTeacherReportCsv(text) {
  const rows = parseCsvRows(text);
  const dataRows = rows.filter(cols => {
    const period = Number(String(cols[0] || '').trim());
    return Number.isFinite(period) && period >= 1 && period <= 15 && DAY_NAME_MAP[normalizeText(cols[1])] !== undefined;
  });
  if (dataRows.length < 5) return null;

  const seen = new Set();
  const lessons = [];
  let matched = 0;
  let duplicates = 0;
  let invalid = 0;

  dataRows.forEach(cols => {
    const period = Number(String(cols[0]).trim());
    const dayOfWeek = DAY_NAME_MAP[normalizeText(cols[1])];
    const cell = String(cols[2] || '').trim();
    if (!cell) return;

    const commaIdx = cell.indexOf(',');
    const subject = commaIdx === -1 ? cell : cell.slice(0, commaIdx);
    const rest = commaIdx === -1 ? '' : cell.slice(commaIdx + 1);
    if (!isPeSubject(subject)) return;
    matched += 1;

    const tokens = [...rest.matchAll(CLASS_TOKEN_RE)];
    if (tokens.length === 0) {
      invalid += 1;
      return;
    }
    tokens.forEach(m => {
      const className = `${m[1]} ${m[2]}`;
      const classKey = normalizeClassName(className);
      const key = scheduleDedupeKey(dayOfWeek, period, classKey);
      if (seen.has(key)) {
        duplicates += 1;
        return;
      }
      seen.add(key);
      lessons.push({ dayOfWeek, period, className, classKey, subject: PE_SUBJECT_NAME });
    });
  });

  return { lessons, scanned: dataRows.length, matched, duplicates, invalid };
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