import { assertTextLength, validateStudentName } from './recordValidation.js';

const VALID_GENDERS = new Set(['boys', 'girls', 'other']);

export function normalizeStudentGender(value, fallback = 'other') {
  if (VALID_GENDERS.has(value)) return value;
  return VALID_GENDERS.has(fallback) ? fallback : 'other';
}

export function normalizeStudentName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

export function buildStudentPayload(input, { classId, fallbackGender = 'other', existing, ownerEmail } = {}) {
  const source = input && typeof input === 'object' ? input : { name: input };
  const name = normalizeStudentName(
    source.name || [source.lastName, source.firstName].filter(Boolean).join(' '),
  );
  const resolvedClassId = source.classId || classId || existing?.classId || '';
  validateStudentName(name);
  if (!resolvedClassId) throw new Error('יש לבחור כיתה');

  const resolvedGender = normalizeStudentGender(
    source.gender,
    existing?.gender || fallbackGender,
  );

  const payload = {
    name,
    first_name: normalizeStudentName(source.firstName),
    last_name: normalizeStudentName(source.lastName),
    gender: resolvedGender,
    class_id: resolvedClassId,
    pe_exempt: Boolean(source.peExempt),
    medical_limitations: String(source.medicalLimitations || '').trim(),
    pe_notes: String(source.peNotes || '').trim(),
    study_group: String(source.studyGroup || '').trim(),
    sub_class_name: String(source.studyGroup || source.subClassName || '').trim(),
  };
  for (const [key, limit, label] of [
    ['first_name', 80, 'שם פרטי'], ['last_name', 80, 'שם משפחה'],
    ['study_group', 120, 'קבוצת לימוד'], ['sub_class_name', 120, 'קבוצת לימוד'],
    ['medical_limitations', 2000, 'מגבלות רפואיות'], ['pe_notes', 2000, 'הערות חנ״ג'],
  ]) assertTextLength(payload[key], limit, label);
  if (ownerEmail) payload.owner_email = String(ownerEmail).trim().toLowerCase();
  return payload;
}

export function studentDedupeKey(name, classId) {
  return `${classId || ''}::${normalizeStudentName(name).toLocaleLowerCase('he')}`;
}
