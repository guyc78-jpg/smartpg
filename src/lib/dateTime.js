export function toLocalISODate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalISODate(value) {
  if (value instanceof Date) return new Date(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return new Date(value);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatLocalDate(value, options = {}) {
  const date = parseLocalISODate(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('he-IL', options);
}
