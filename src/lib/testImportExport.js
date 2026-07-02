import { formatLongTime, parseLongTime, isTimeBasedTest, isShortSprintTest } from '@/lib/timeFormat';
import { GENDER_TRACK_LABELS, TEST_TYPES } from '@/lib/types';

export const usesTimeFormat = (name) => isTimeBasedTest(name) && !isShortSprintTest(name);

export function formatResultValue(value, testName) {
  if (value === null || value === undefined || value === '') return '';
  return usesTimeFormat(testName) ? formatLongTime(Number(value)) : String(value);
}

export function parseResultValue(value) {
  if (value === null || value === undefined || value === '') return null;
  const str = String(value).trim();
  if (str.includes(':')) return parseLongTime(str);
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function downloadFile(content, filename, mime) {
  const blob = new Blob(['\ufeff' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const EXPORT_HEADERS = ['שם מבדק', 'שכבה', 'מגדר', 'סוג', 'יחידה', 'משקל', 'מינימום', 'מקסימום', 'ציון'];

function testFlatRows(test) {
  const rows = (test.conversionTable || []).length > 0 ? test.conversionTable : [{ minResult: null, maxResult: null, grade: null }];
  return rows.map(row => [
    test.name, test.gradeLevel || '', GENDER_TRACK_LABELS[test.genderTrack || 'boys'] || '',
    TEST_TYPES[test.testType || 'other'] || '', test.unit || '', test.weight ?? '',
    formatResultValue(row.minResult, test.name),
    formatResultValue(row.maxResult, test.name),
    row.grade ?? '',
  ]);
}

export function exportTestsToExcel(tests) {
  const bodyRows = tests.flatMap(testFlatRows);
  const html = `<html dir="rtl"><head><meta charset="utf-8"></head><body>
<table border="1" dir="rtl">
<tr>${EXPORT_HEADERS.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
${bodyRows.map(cells => `<tr>${cells.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('\n')}
</table></body></html>`;
  downloadFile(html, 'tests.xls', 'application/vnd.ms-excel');
}

export function exportTestsToWord(tests) {
  const sections = tests.map(test => {
    const meta = [
      test.gradeLevel ? `שכבה ${test.gradeLevel}׳` : '',
      GENDER_TRACK_LABELS[test.genderTrack || 'boys'] || '',
      TEST_TYPES[test.testType || 'other'] || '',
      test.unit ? `יחידה: ${test.unit}` : '',
      `משקל: ${test.weight ?? ''}`,
    ].filter(Boolean).join(' • ');
    const rows = (test.conversionTable || []).map(row =>
      `<tr><td>${escapeHtml(formatResultValue(row.minResult, test.name))}</td><td>${escapeHtml(formatResultValue(row.maxResult, test.name))}</td><td>${escapeHtml(row.grade ?? '')}</td></tr>`
    ).join('\n');
    return `<h2>${escapeHtml(test.name)}</h2><p>${escapeHtml(meta)}</p>
<table border="1" dir="rtl" style="border-collapse:collapse" cellpadding="4">
<tr><th>מינימום</th><th>מקסימום</th><th>ציון</th></tr>
${rows}
</table>`;
  }).join('<br/>');
  const html = `<html dir="rtl"><head><meta charset="utf-8"></head><body style="font-family:Arial;direction:rtl">${sections}</body></html>`;
  downloadFile(html, 'tests.doc', 'application/msword');
}

const TYPE_BY_LABEL = Object.fromEntries(Object.entries(TEST_TYPES).map(([value, label]) => [label, value]));

const INVALID_TEST_NAMES = new Set(['מינימום', 'מקסימום', 'ציון', 'טבלת המרה', 'שם', 'שם מבדק']);

export function rowsToTests(rows) {
  const groups = new Map();
  for (const row of rows) {
    const name = (row.test_name || row.name || '').toString().trim();
    if (!name || INVALID_TEST_NAMES.has(name)) continue;
    const gradeLevel = (row.grade_level || '').toString().replace('׳', '').trim();
    const genderRaw = (row.gender || '').toString();
    const genderTrack = genderRaw.includes('בנות') || genderRaw.toLowerCase().includes('girls') ? 'girls' : 'boys';
    const key = `${name}|${gradeLevel}|${genderTrack}`;
    if (!groups.has(key)) {
      groups.set(key, {
        name,
        gradeLevel: gradeLevel || 'ז',
        genderTrack,
        testType: TYPE_BY_LABEL[(row.test_type || '').toString().trim()] || 'other',
        unit: (row.unit || '').toString(),
        weight: Number(row.weight) || 25,
        classId: '', semester: '', testDate: '',
        conversionTable: [],
      });
    }
    const min = parseResultValue(row.min_result ?? row.min);
    const max = parseResultValue(row.max_result ?? row.max);
    const grade = parseResultValue(row.grade);
    if (min !== null && max !== null && grade !== null) {
      groups.get(key).conversionTable.push({
        minResult: Math.min(min, max),
        maxResult: Math.max(min, max),
        grade,
      });
    }
  }
  return Array.from(groups.values());
}