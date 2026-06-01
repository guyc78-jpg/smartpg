export const GRADE_LEVELS = ['ז', 'ח', 'ט', 'י', 'יא', 'יב'];

export const GENDER_TRACK_LABELS = { boys: 'בנים', girls: 'בנות' };

export const TEST_TYPES = {
  running: 'ריצה',
  strength: 'כוח',
  muscular_endurance: 'סבולת שריר',
  flexibility: 'גמישות',
  agility: 'זריזות',
  coordination: 'קואורדינציה',
  theory: 'מבחן עיוני',
  other: 'מבדק חנ״ג אחר',
};

export const TEST_STATUS_LABELS = {
  completed: 'ביצע/ה',
  pending: 'חסר זמני',
  not_completed: 'לא סיים/ה',
  not_participated: 'לא ביצע/ה',
  exempt: 'פטור/ה',
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
  { name: 'ריצת 2000 מטר', testType: 'running', weight: 25, gradeLevel: 'ז', genderTrack: 'boys', unit: 'שניות', conversionTable: [] },
  { name: 'ריצת 2000 מטר', testType: 'running', weight: 25, gradeLevel: 'ח', genderTrack: 'boys', unit: 'שניות', conversionTable: [] },
  { name: 'ריצת 2000 מטר', testType: 'running', weight: 25, gradeLevel: 'ט', genderTrack: 'boys', unit: 'שניות', conversionTable: [] },
  { name: 'ריצת 2000 מטר', testType: 'running', weight: 25, gradeLevel: 'י', genderTrack: 'boys', unit: 'שניות', conversionTable: [] },
  { name: 'ריצת 2000 מטר', testType: 'running', weight: 25, gradeLevel: 'יא', genderTrack: 'boys', unit: 'שניות', conversionTable: [] },
  { name: 'ריצת 2000 מטר', testType: 'running', weight: 25, gradeLevel: 'יב', genderTrack: 'boys', unit: 'שניות', conversionTable: [] },
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
  lessonTopics: [],
};