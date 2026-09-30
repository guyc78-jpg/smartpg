// Format and parse measurement times without losing hundredths at minute boundaries.
export function formatLongTime(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds === '') return '';
  const value = Number(totalSeconds);
  if (!Number.isFinite(value) || value < 0) return '';
  const hundredths = Math.round(value * 100);
  const minutes = Math.floor(hundredths / 6000);
  const seconds = Math.floor(hundredths / 100) % 60;
  const fraction = hundredths % 100;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}${fraction ? `.${String(fraction).padStart(2, '0')}` : ''}`;
}

export function formatShortTime(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds === '') return '';
  const value = Number(totalSeconds);
  if (!Number.isFinite(value) || value < 0) return '';
  return (Math.round(value * 100) / 100).toFixed(2);
}

function parsePositiveDecimal(value) {
  const text = String(value ?? '').trim();
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return null;
  const number = Number(text);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function parseLongTime(value) {
  const text = String(value ?? '').trim();
  if (!text.includes(':')) return parsePositiveDecimal(text);
  const match = /^(\d+):([0-5]?\d(?:\.\d+)?)$/.exec(text);
  if (!match) return null;
  const seconds = Number(match[1]) * 60 + Number(match[2]);
  return Number.isFinite(seconds) ? seconds : null;
}

export function parseShortTime(value) {
  return parsePositiveDecimal(value);
}

export function isTimeBasedTest(name) {
  if (!name) return false;
  return name.includes('ריצת') || name.includes('הליכת') || name.includes('פלאנק') || name.includes('זריזות');
}

export function isShortSprintTest(name) {
  if (!name) return false;
  return name.includes('זריזות');
}
