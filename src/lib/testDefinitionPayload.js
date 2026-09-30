import { validateConversionTable } from './conversionValidation.js';

export function buildTestDefinitionPayload(test) {
  const name = String(test?.name || '').trim();
  const weight = Number(test?.weight);
  if (!name || name.length > 160) throw new Error('שם המבדק חייב להכיל בין 1 ל־160 תווים.');
  if (test?.weight === '' || test?.weight === null || !Number.isFinite(weight) || weight < 0 || weight > 100) {
    throw new Error('משקל המבדק חייב להיות מספר בין 0 ל־100.');
  }
  const table = validateConversionTable(test?.conversionTable || []);
  if (!table.valid) throw new Error(table.message);
  return {
    name, test_type: test.testType || 'other', weight,
    grade_level: test.gradeLevel || undefined,
    class_id: test.classId || '', gender_track: test.genderTrack || 'boys',
    semester: test.semester || undefined, test_date: test.testDate || undefined,
    unit: String(test.unit || '').trim(), conversion_table: table.rows,
  };
}
