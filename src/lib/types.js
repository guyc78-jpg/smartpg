export const GRADE_LEVELS = ['ז', 'ח', 'ט', 'י', 'יא', 'יב'];

export const GENDER_TRACK_LABELS = { boys: 'בנים', girls: 'בנות' };

export const TEST_STATUS_LABELS = {
  completed: 'בוצע',
  pending: 'חסר זמני',
  not_completed: 'לא הושלם',
  not_participated: 'לא השתתף/ה',
  exempt: 'פטור',
  not_relevant: 'לא רלוונטי',
  not_included: 'לא נכלל',
};

export const QUARTER_LABELS = {
  parentA: 'יום הורים מחצית א׳',
  semesterA: 'מחצית א׳',
  parentB: 'יום הורים מחצית ב׳',
  semesterB: 'מחצית ב׳',
};

export const SEMESTER_LABELS = { A: 'מחצית א׳', B: 'מחצית ב׳' };

export const CLASS_TEST_STATUS_LABELS = {
  not_conducted: 'טרם בוצע',
  partial: 'בוצע חלקית',
  conducted: 'בוצע',
  not_included: 'לא נכלל',
};

export const BAGRUT_STATUS_LABELS = {
  entered: 'הוזן',
  missing: 'חסר',
  exempt: 'פטור',
  not_relevant: 'לא רלוונטי',
  completed_late: 'הושלם בהשלמה',
};

export const BAGRUT_STUDENT_STATUS_LABELS = {
  completed: 'הושלם',
  missing_component: 'חסר רכיב',
  pending: 'ממתין להזנה',
  exempt: 'פטור',
  partial: 'הושלם חלקית',
};

export const CONTACT_ROLE_LABELS = {
  homeroom: 'מחנך/ת',
  coordinator: 'רכז/ת',
  counselor: 'יועץ/ת',
  other: 'אחר',
};

export const DEFAULT_TESTS = [
  { name: 'ריצת 2000 מטר', weight: 25, gradeLevel: 'ז', genderTrack: 'boys', conversionTable: [] },
  { name: 'ריצת 2000 מטר', weight: 25, gradeLevel: 'ח', genderTrack: 'boys', conversionTable: [] },
  { name: 'ריצת 2000 מטר', weight: 25, gradeLevel: 'ט', genderTrack: 'boys', conversionTable: [] },
  { name: 'ריצת 2000 מטר', weight: 25, gradeLevel: 'י', genderTrack: 'boys', conversionTable: [] },
  { name: 'ריצת 2000 מטר', weight: 25, gradeLevel: 'יא', genderTrack: 'boys', conversionTable: [] },
  { name: 'ריצת 2000 מטר', weight: 25, gradeLevel: 'יב', genderTrack: 'boys', conversionTable: [] },
];

export const DEFAULT_DATA = {
  classes: [],
  students: [],
  tests: [],
  results: [],
  testAttempts: [],
  behaviorGrades: [],
  settings: {
    parentBehaviorWeight: 30,
    semesterBehaviorWeight: 30,
    testsWeight: 40,
    penaltyScore: 15,
    autoConvertMissing: false,
    completionPenaltyFactor: 0,
    minCompletedGrade: 56,
    gradeColorThresholds: { redBelow: 55, greenAt: 100 },
  },
  bagrutComponents: [],
  bagrutResults: [],
  bagrutSettings: { enabled: false, autoCalculate: true, showInSummary: true },
  classTestStatuses: [],
  gradeOverrides: [],
};