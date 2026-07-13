const HEBREW_CLASS_RE = /^(.+?)([0-9]+)$/u;

function normalizeClassName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeClassPrefix(value) {
  const compact = String(value || '').replace(/\s/g, '').replace(/'/g, '׳').replace(/"/g, '״');
  if (compact.includes('׳') || compact.includes('״')) return compact;
  const letters = compact.replace(/[^\u05d0-\u05ea]/gu, '');
  return `${compact}${letters.length > 1 ? '״' : '׳'}`;
}

export function formatCombinedClassNames(classNames) {
  const names = [...new Set((classNames || []).map(normalizeClassName).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'he', { numeric: true, sensitivity: 'base' }));
  if (names.length <= 1) return names[0] || '';

  const parts = names.map(name => name.match(HEBREW_CLASS_RE));
  const prefixes = parts.map(match => match ? normalizeClassPrefix(match[1]) : '');
  if (parts.every(Boolean) && prefixes.every(prefix => prefix === prefixes[0])) {
    const prefix = prefixes[0];
    const numbers = parts.map(match => Number(match[2])).sort((a, b) => a - b);
    return `${prefix}${numbers.join(',')}`;
  }

  return names.join(', ');
}

export function groupScheduleLessonsForDisplay(lessons, classById = {}) {
  const groups = new Map();
  const standalone = [];

  for (const lesson of lessons || []) {
    const className = classById[lesson.classId]?.name || lesson.className || '';
    const subject = String(lesson.subject || '').trim();
    if (!lesson.classId || !className || !subject) {
      standalone.push({ ...lesson, displayClassName: className, groupedLessons: [lesson], isGrouped: false });
      continue;
    }

    const key = subject.toLocaleLowerCase('he');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(lesson);
  }

  const combined = [...groups.values()].map(groupedLessons => {
    const first = groupedLessons[0];
    const classNames = groupedLessons.map(lesson => classById[lesson.classId]?.name || lesson.className || '');
    return {
      ...first,
      id: groupedLessons.length > 1 ? `group:${groupedLessons.map(item => item.id).sort().join('|')}` : first.id,
      displayClassName: formatCombinedClassNames(classNames),
      groupedLessons,
      isGrouped: groupedLessons.length > 1,
    };
  });

  return [...combined, ...standalone];
}
