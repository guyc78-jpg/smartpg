// Split combined class names like "ט'1+ט'5" into individual names
export function splitClassName(name) {
  if (!name) return [name];
  const normalized = name.replace(/[״׳"']/g, '').replace(/\s+/g, ' ').trim();
  const tokens = normalized.match(/(?:יב|יא|י|ט|ח|ז)\s*\d{1,2}[א-ת]?/g) ?? [];
  if (tokens.length >= 2) return tokens.map(t => t.replace(/\s+/g, ''));
  return [name];
}