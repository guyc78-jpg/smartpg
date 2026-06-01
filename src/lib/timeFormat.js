// Format seconds to MM:SS
export function formatLongTime(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined) return '';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(Math.round(seconds)).padStart(2, '0')}`;
}

// Format seconds for short sprint (SS.CC)
export function formatShortTime(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined) return '';
  const secs = Math.floor(totalSeconds);
  const centis = Math.round((totalSeconds - secs) * 100);
  return `${secs}.${String(centis).padStart(2, '0')}`;
}

// Parse MM:SS to total seconds
export function parseLongTime(str) {
  if (!str) return null;
  const parts = str.split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0]);
    const s = parseInt(parts[1]);
    if (!isNaN(m) && !isNaN(s)) return m * 60 + s;
  }
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

// Parse SS.CC to seconds
export function parseShortTime(str) {
  if (!str) return null;
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

export function isTimeBasedTest(name) {
  if (!name) return false;
  return name.includes('ריצת') || name.includes('הליכת') || name.includes('פלאנק') || name.includes('זריזות');
}

export function isShortSprintTest(name) {
  if (!name) return false;
  return name.includes('זריזות');
}