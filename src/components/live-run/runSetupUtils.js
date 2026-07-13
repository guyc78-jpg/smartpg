export function inferRunDistance(test) {
  const match = String(test?.name || '').match(/(\d[\d,]{1,6})\s*(?:מטר(?:ים)?|מ['׳]?|m)/i);
  return match ? Number(match[1].replace(/,/g, '')) : null;
}
