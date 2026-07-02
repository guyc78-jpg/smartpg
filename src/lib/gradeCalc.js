// Convert raw score to grade using range match, then nearest defined range edge
export function convertRawToGrade(rawScore, conversionTable) {
  return convertRawToGradeDetailed(rawScore, conversionTable)?.grade ?? null;
}

export function convertRawToGradeDetailed(rawScore, conversionTable) {
  if (rawScore === null || rawScore === undefined || Number.isNaN(Number(rawScore))) {
    return { grade: null, reason: 'invalid_result' };
  }

  const rows = (conversionTable || [])
    .map(row => {
      if (row.minResult === null || row.minResult === undefined || row.maxResult === null || row.maxResult === undefined || row.grade === null || row.grade === undefined) return null;
      return {
        minResult: Number(row.minResult),
        maxResult: Number(row.maxResult),
        grade: Number(row.grade),
      };
    })
    .filter(row => row && [row.minResult, row.maxResult, row.grade].every(Number.isFinite));

  if (rows.length === 0) return { grade: null, reason: 'missing_table' };

  const score = Number(rawScore);
  for (const row of rows) {
    const low = Math.min(row.minResult, row.maxResult);
    const high = Math.max(row.minResult, row.maxResult);
    if (score >= low && score <= high) {
      return { grade: row.grade, rawScore: score, matchType: 'range' };
    }
  }

  const nearest = rows
    .map(row => ({
      grade: row.grade,
      distance: Math.min(Math.abs(score - row.minResult), Math.abs(score - row.maxResult)),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  return { grade: nearest.grade, rawScore: score, matchType: 'nearest' };
}

// Calculate semester grades for a student
export function calculateSemesterGrades(studentId, tests, results, behaviorGrades, settings, conductedTestIds, semester, peExempt) {
  if (peExempt) return { testsAvg: null, behaviorGrade: null, semesterFinalGrade: null, missingTests: [], conductedCount: 0 };

  const semResults = results.filter(r => r.studentId === studentId && r.semester === semester);
  const conductedTests = tests.filter(t => conductedTestIds.includes(t.id));
  const notIncludedStatuses = results.filter(
    r => r.studentId === studentId && r.semester === semester && (r.status === 'not_included' || r.status === 'not_relevant')
  ).map(r => r.testId);
  
  const relevantTests = conductedTests.filter(t => !notIncludedStatuses.includes(t.id));
  
  let weightedSum = 0;
  let totalWeight = 0;
  const missingTests = [];

  for (const test of relevantTests) {
    const result = semResults.find(r => r.testId === test.id);
    const rawScore = result?.rawScore;
    const status = result?.status || 'pending';

    if (status === 'exempt' || status === 'not_relevant' || status === 'not_included') continue;

    if (rawScore !== null && rawScore !== undefined && status === 'completed') {
      const grade = convertRawToGrade(rawScore, test.conversionTable);
      if (grade !== null) {
        const finalGrade = Math.max(grade, settings.minCompletedGrade || 56);
        weightedSum += finalGrade * test.weight;
        totalWeight += test.weight;
      } else {
        missingTests.push(test.name);
      }
    } else if (status === 'not_completed' || status === 'not_participated') {
      weightedSum += (settings.penaltyScore || 15) * test.weight;
      totalWeight += test.weight;
    } else {
      missingTests.push(test.name);
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
  if (testsAvg !== null) {
    if (behaviorGrade !== null) {
      const tw = settings.testsWeight || 40;
      const bw = 100 - tw;
      semesterFinalGrade = Math.round((testsAvg * tw + behaviorGrade * bw) / 100);
    } else {
      semesterFinalGrade = testsAvg;
    }
  } else if (behaviorGrade !== null) {
    semesterFinalGrade = behaviorGrade;
  }

  return { testsAvg, behaviorGrade, semesterFinalGrade, missingTests, conductedCount: relevantTests.length };
}

// Calculate weighted Bagrut grade for a student from component results
export function calculateBagrutGrade(studentId, components, bagrutResults) {
  let weightedSum = 0;
  let totalWeight = 0;
  const missing = [];
  for (const comp of components) {
    const weight = Number(comp.weight) || 0;
    if (weight <= 0) continue;
    const r = bagrutResults.find(x => x.studentId === studentId && x.componentId === comp.id);
    if (r?.status === 'exempt' || r?.status === 'not_relevant') continue;
    if (r?.score !== null && r?.score !== undefined) {
      weightedSum += r.score * weight;
      totalWeight += weight;
    } else {
      missing.push(comp.name);
    }
  }
  return { grade: totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null, missing };
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