const CLASS_LIMITS = { name: [120, 'שם הכיתה'], gradeLevel: [40, 'שכבה'], homeroomTeacher: [160, 'שם המחנך/ת'], notes: [2000, 'הערות הכיתה'] };

export function assertTextLength(value, limit, label) {
  if (String(value ?? '').trim().length > limit) {
    throw new Error(`${label}: ניתן להזין עד ${limit} תווים`);
  }
}

export function validateClassFields(source, { requireName = false } = {}) {
  if ((requireName || Object.hasOwn(source, 'name')) && !String(source.name ?? '').trim()) {
    throw new Error('יש להזין שם כיתה');
  }
  for (const [key, [limit, label]] of Object.entries(CLASS_LIMITS)) {
    if (Object.hasOwn(source, key)) assertTextLength(source[key], limit, label);
  }
}

export function validateStudentName(value) {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!name) throw new Error('יש להזין שם תלמיד/ה');
  assertTextLength(name, 160, 'שם התלמיד/ה');
  return name;
}
