const EXCLUDED_STATUSES = ['exempt', 'not_relevant', 'not_included'];
const PENALTY_STATUSES = ['not_completed', 'not_participated', 'pending'];

const STATUS_LABELS = {
  completed: 'ביצע/ה',
  not_completed: 'לא סיים/ה',
  not_participated: 'לא ביצע/ה',
  pending: 'לא הוזן',
  exempt: 'פטור/ה',
  not_relevant: 'לא רלוונטי',
  not_included: 'לא נכלל',
};

function isValidNumber(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
}

function normalizedConversionRows(conversionTable) {
  if (!Array.isArray(conversionTable)) return [];
  return conversionTable
    .map(row => ({
      minResult: Number(row.minResult),
      maxResult: Number(row.maxResult),
      grade: Number(row.grade),
    }))
    .filter(row => Number.isFinite(row.minResult) && Number.isFinite(row.maxResult) && Number.isFinite(row.grade));
}

// Convert raw score to grade using a range match, or nearest defined range when no exact range matches.
export function convertRawToGrade(rawScore, conversionTable) {
  if (!isValidNumber(rawScore)) return null;
  const rows = normalizedConversionRows(conversionTable);
  if (rows.length === 0) return null;

  const numericScore = Number(rawScore);
  for (const entry of rows) {
    const low = Math.min(entry.minResult, entry.maxResult);
    const high = Math.max(entry.minResult, entry.maxResult);
    if (numericScore >= low && numericScore <= high) return entry.grade;
  }

  const nearest = rows.reduce((best, entry) => {
    const low = Math.min(entry.minResult, entry.maxResult);
    const high = Math.max(entry.minResult, entry.maxResult);
    const distance = numericScore < low ? low - numericScore : numericScore - high;
    return !best || distance < best.distance ? { grade: entry.grade, distance } : best;
  }, null);

  return nearest?.grade ?? null;
}

export function convertRawToGradeDetailed(rawScore, conversionTable) {
  const grade = convertRawToGrade(rawScore, conversionTable);
  if (grade === null) return null;
  return { grade, rawScore };
}

function buildDetail(test, status, rawScore, grade, finalGrade, included, reason) {
  return {
    testId: test.id,
    testName: test.name,
    weight: test.weight || 1,
    status,
    statusLabel: STATUS_LABELS[status] || status,
    rawScore,
    grade,
    finalGrade,
    included,
    reason,
  };
}

// Calculate semester grades for a student
export function calculateSemesterGrades(studentId, tests, results, behaviorGrades, settings, conductedTestIds, semester, peExempt) {
  if (peExempt) {
    return {
      testsAvg: null,
      behaviorGrade: null,
      semesterFinalGrade: null,
      missingTests: [],
      conductedCount: 0,
      includedCount: 0,
      excludedCount: 0,
      testDetails: [],
      explanation: ['התלמיד/ה מסומן/ת כפטור/ה ולכן אינו/ה נכנס/ת לחישוב.'],
    };
  }

  const penaltyScore = settings.penaltyScore || 15;
  const minCompletedGrade = settings.minCompletedGrade || 56;
  const semResults = results.filter(r => r.studentId === studentId && r.semester === semester);
  const conductedTests = tests.filter(t => conductedTestIds.includes(t.id));
  const excludedByStudent = semResults
    .filter(r => EXCLUDED_STATUSES.includes(r.status))
    .map(r => r.testId);

  const relevantTests = conductedTests.filter(t => !excludedByStudent.includes(t.id));
  const details = [];
  const missingTests = [];
  const ungradedTests = [];
  let weightedSum = 0;
  let totalWeight = 0;
  let completedCount = 0;
  let includedCount = 0;

  for (const test of conductedTests) {
    const result = semResults.find(r => r.testId === test.id);
    const rawScore = result?.rawScore ?? null;
    const status = result?.status || 'pending';
    const weight = test.weight || 1;

    if (EXCLUDED_STATUSES.includes(status)) {
      details.push(buildDetail(test, status, rawScore, null, null, false, 'לא נכנס לחישוב לפי סטטוס התלמיד/ה.'));
      continue;
    }

    if (status === 'completed' && isValidNumber(rawScore)) {
      completedCount += 1;
      const grade = convertRawToGrade(rawScore, test.conversionTable);
      if (grade === null) {
        ungradedTests.push(test.name);
        details.push(buildDetail(test, status, rawScore, null, null, false, 'נשמרה תוצאה אך חסרה טבלת המרה מתאימה.'));
        continue;
      }

      const finalGrade = Math.max(grade, minCompletedGrade);
      weightedSum += finalGrade * weight;
      totalWeight += weight;
      includedCount += 1;
      details.push(buildDetail(test, status, rawScore, grade, finalGrade, true, finalGrade > grade ? `בוצע — הועלה למינימום ${minCompletedGrade}.` : 'בוצע ונכנס לחישוב.'));
      continue;
    }

    if (PENALTY_STATUSES.includes(status) || status === 'completed') {
      weightedSum += penaltyScore * weight;
      totalWeight += weight;
      includedCount += 1;
      missingTests.push(test.name);
      const penaltyStatus = status === 'completed' ? 'not_completed' : status;
      details.push(buildDetail(test, penaltyStatus, rawScore, null, penaltyScore, true, `המבדק התקיים אך לא בוצע/לא הושלם — ציון ${penaltyScore}.`));
    }
  }

  const testsAvg = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;

  const quarterA = semester === 'A' ? 'parentA' : 'parentB';
  const quarterB = semester === 'A' ? 'semesterA' : 'semesterB';
  const bGradeA = behaviorGrades.find(b => b.studentId === studentId && b.quarter === quarterA)?.grade ?? null;
  const bGradeB = behaviorGrades.find(b => b.studentId === studentId && b.quarter === quarterB)?.grade ?? null;
  const behaviorGrade = bGradeA !== null && bGradeB !== null
    ? Math.round((bGradeA + bGradeB) / 2)
    : bGradeA ?? bGradeB ?? null;

  let semesterFinalGrade = null;
  if (relevantTests.length > 0 && completedCount === 0 && includedCount > 0) {
    semesterFinalGrade = penaltyScore;
  } else if (testsAvg !== null) {
    if (behaviorGrade !== null) {
      const tw = settings.testsWeight || 40;
      const bw = 100 - tw;
      semesterFinalGrade = Math.round((testsAvg * tw + behaviorGrade * bw) / 100);
    } else {
      semesterFinalGrade = testsAvg;
    }
  } else if (behaviorGrade !== null && relevantTests.length === 0) {
    semesterFinalGrade = behaviorGrade;
  }

  const excludedCount = conductedTests.length - relevantTests.length;
  const explanation = [
    relevantTests.length > 0
      ? `${includedCount} מתוך ${relevantTests.length} מבדקים שהתקיימו נכנסו לחישוב.`
      : 'לא היו מבדקים שהתקיימו ונכנסים לחישוב במחצית זו.',
    excludedCount > 0 ? `${excludedCount} מבדקים לא נכנסו לחישוב בגלל פטור/לא רלוונטי/לא נכלל.` : null,
    ungradedTests.length > 0 ? `יש תוצאות שמורות ללא ציון: ${ungradedTests.join(', ')} — יש להגדיר טבלת המרה.` : null,
    relevantTests.length > 0 && completedCount === 0 && includedCount > 0 ? `לא בוצע אף מבדק שהתקיים — ציון המחצית נקבע ל-${penaltyScore}.` : null,
  ].filter(Boolean);

  return {
    testsAvg,
    behaviorGrade,
    semesterFinalGrade,
    missingTests,
    ungradedTests,
    conductedCount: relevantTests.length,
    includedCount,
    excludedCount,
    testDetails: details,
    explanation,
  };
}

// Calculate annual grade for a student
export function calculateAnnualGrade(studentId, tests, results, behaviorGrades, settings, conductedTestIdsA, conductedTestIdsB, peExempt) {
  const semA = calculateSemesterGrades(studentId, tests, results, behaviorGrades, settings, conductedTestIdsA, 'A', peExempt);
  const semB = calculateSemesterGrades(studentId, tests, results, behaviorGrades, settings, conductedTestIdsB, 'B', peExempt);

  let annualGrade = null;
  if (semA.semesterFinalGrade !== null && semB.semesterFinalGrade !== null) {
    annualGrade = Math.round((semA.semesterFinalGrade + semB.semesterFinalGrade) / 2);
  } else if (semA.semesterFinalGrade !== null) {
    annualGrade = semA.semesterFinalGrade;
  } else if (semB.semesterFinalGrade !== null) {
    annualGrade = semB.semesterFinalGrade;
  }

  return { semA, semB, annualGrade };
}