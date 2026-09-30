import { DocxSafetyError } from './docxSafety.js';

export function parseThresholdValue(value) {
  const text = String(value ?? '').trim();
  const time = /^(\d+):(\d{1,2}(?:\.\d+)?)$/.exec(text);
  if (time) {
    const seconds = Number(time[2]);
    return seconds < 60 ? Number(time[1]) * 60 + seconds : NaN;
  }
  return /^\d+(?:\.\d+)?$/.test(text) ? Number(text) : NaN;
}

export function buildThresholdRows(tests) {
  const rows = [];
  for (const test of tests || []) {
    const thresholds = (test.thresholds || []).map(threshold => ({
      value: parseThresholdValue(threshold.result), grade: threshold.grade,
    }));
    if (thresholds.some(threshold => !Number.isFinite(threshold.value)
      || !Number.isFinite(threshold.grade) || threshold.grade < 0 || threshold.grade > 100)) {
      throw new DocxSafetyError('Document contains an invalid threshold', 422);
    }
    thresholds.sort((a, b) => a.value - b.value);
    for (let i = 0; i < thresholds.length; i++) {
      const threshold = thresholds[i];
      const min = test.lower_is_better
        ? (i === 0 ? 0 : thresholds[i - 1].value + 0.01)
        : threshold.value;
      const max = test.lower_is_better
        ? threshold.value
        : (i === thresholds.length - 1 ? threshold.value * 10 : thresholds[i + 1].value - 0.01);
      const minimum = Math.round(min * 100) / 100;
      const maximum = Math.round(max * 100) / 100;
      if (minimum > maximum) throw new DocxSafetyError('Document contains overlapping thresholds', 422);
      rows.push({
        test_name: test.test_name, unit: test.unit || '',
        min_result: minimum, max_result: maximum, grade: threshold.grade,
      });
    }
  }
  return rows;
}
