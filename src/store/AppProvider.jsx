import { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';
import { base44 } from '@/api/base44Client';
import { DEFAULT_DATA, DEFAULT_TESTS } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

function jsonToConversionTable(json) {
  if (!Array.isArray(json)) return [];
  return json.map(entry => ({
    minResult: Number(entry.minResult ?? entry.min_result ?? 0),
    maxResult: Number(entry.maxResult ?? entry.max_result ?? 0),
    grade: Number(entry.grade ?? 0),
  }));
}

let idCounter = 0;
export function generateId() {
  return `local_${Date.now()}_${++idCounter}`;
}

export const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState({ ...DEFAULT_DATA });
  const [loading, setLoading] = useState(true);
  const [defaultGenderTrack, setDefaultGenderTrack] = useState('boys');
  const loadedRef = useRef(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [classesData, studentsData, testsData, resultsData, behaviorData, settingsData, bagrutCompData, bagrutResultsData, classTestStatusData, gradeOverridesData, attemptsData] = await Promise.all([
        base44.entities.SchoolClass.list(),
        base44.entities.Student.list(),
        base44.entities.TestDefinition.list(),
        base44.entities.TestResult.list(),
        base44.entities.BehaviorGrade.list(),
        base44.entities.TeacherSettings.list(),
        base44.entities.BagrutComponent.list(),
        base44.entities.BagrutResult.list(),
        base44.entities.ClassTestStatus.list(),
        base44.entities.GradeOverride.list(),
        base44.entities.TestAttempt.list(),
      ]);

      const classes = (classesData || []).map(c => ({
        id: c.id, name: c.name, gradeLevel: c.grade_level, genderTrack: c.gender_track || 'boys',
        homeroomContacts: Array.isArray(c.homeroom_contacts) ? c.homeroom_contacts : [],
      }));

      const students = (studentsData || []).map(s => ({
        id: s.id, name: s.name, classId: s.class_id, peExempt: s.pe_exempt ?? false, subClassName: s.sub_class_name,
      }));

      let tests = (testsData || []).map(t => ({
        id: t.id, name: t.name, weight: t.weight, gradeLevel: t.grade_level, genderTrack: t.gender_track || 'boys',
        conversionTable: jsonToConversionTable(t.conversion_table),
      }));

      if (tests.length === 0) {
        const seeded = await Promise.all(
          DEFAULT_TESTS.map(t => base44.entities.TestDefinition.create({
            name: t.name, weight: t.weight, grade_level: t.gradeLevel, gender_track: t.genderTrack, conversion_table: t.conversionTable,
          }))
        );
        tests = seeded.map(t => ({
          id: t.id, name: t.name, weight: t.weight, gradeLevel: t.grade_level, genderTrack: t.gender_track || 'boys',
          conversionTable: jsonToConversionTable(t.conversion_table),
        }));
      }

      const results = (resultsData || []).map(r => ({
        studentId: r.student_id, testId: r.test_id, semester: r.semester, rawScore: r.raw_score ?? null,
        status: r.status || 'completed', attemptCount: r.attempt_count ?? 1,
        testDate: r.test_date, runTimeSeconds: r.run_time_seconds, lapsCompleted: r.laps_completed,
        routeName: r.route_name, liveRunId: r.live_run_id,
      }));

      const testAttempts = (attemptsData || []).map(a => ({
        id: a.id, studentId: a.student_id, testId: a.test_id, semester: a.semester,
        rawScore: Number(a.raw_score), attemptNumber: a.attempt_number, attemptedAt: a.created_date,
      }));

      const behaviorGrades = (behaviorData || []).map(b => ({
        studentId: b.student_id, quarter: b.quarter, grade: b.grade,
      }));

      const settingsRaw = settingsData?.[0];
      const settings = settingsRaw ? {
        parentBehaviorWeight: settingsRaw.parent_behavior_weight ?? 30,
        semesterBehaviorWeight: settingsRaw.semester_behavior_weight ?? 30,
        testsWeight: settingsRaw.tests_weight ?? 40,
        penaltyScore: settingsRaw.penalty_score ?? 15,
        autoConvertMissing: settingsRaw.auto_convert_missing ?? false,
        completionPenaltyFactor: settingsRaw.completion_penalty_factor ?? 0,
        minCompletedGrade: settingsRaw.min_completed_grade ?? 56,
        gradeColorThresholds: settingsRaw.grade_color_thresholds ?? { redBelow: 55, greenAt: 100 },
      } : DEFAULT_DATA.settings;

      if (settingsRaw?.default_gender_track) setDefaultGenderTrack(settingsRaw.default_gender_track);

      const bagrutExclusions = (bagrutCompData || []).filter(c => c.is_required === false).map(c => ({ name: c.name, genderTrack: c.gender_track }));
      
      const bagrutComponents = buildBagrutComponentsFromTests(tests, bagrutExclusions);
      const bagrutResults = (bagrutResultsData || []).map(r => ({
        id: r.id, studentId: r.student_id, componentId: r.component_id, rawScore: r.raw_score ?? null,
        score: r.score, status: r.status || 'missing', notes: r.notes || '',
      }));

      const classTestStatuses = (classTestStatusData || []).map(r => ({
        classId: r.class_id, testId: r.test_id, semester: r.semester, status: r.status,
      }));

      const gradeOverrides = (gradeOverridesData || []).map(r => ({
        studentId: r.student_id, classId: r.class_id, overrideType: r.override_type, grade: r.grade,
      }));

      setData({
        classes, students, tests, results, testAttempts, behaviorGrades, settings,
        bagrutComponents, bagrutResults, bagrutSettings: { enabled: false, autoCalculate: true, showInSummary: true },
        classTestStatuses, gradeOverrides,
      });
      setLoading(false);
      return true;
    } catch (e) {
      console.error('Failed to load data:', e);
      setLoading(false);
      return false;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !loadedRef.current) {
      loadedRef.current = true;
      loadAll();
    } else if (!isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, loadAll]);

  // --- Classes ---
  const addClass = useCallback(async (name, gradeLevel, genderTrack) => {
    const created = await base44.entities.SchoolClass.create({
      name, grade_level: gradeLevel || null, gender_track: genderTrack || defaultGenderTrack, homeroom_contacts: [],
    });
    setData(d => ({
      ...d,
      classes: [...d.classes, { id: created.id, name: created.name, gradeLevel: created.grade_level, genderTrack: created.gender_track || defaultGenderTrack, homeroomContacts: [] }],
    }));
    return created.id;
  }, [defaultGenderTrack]);

  const deleteClass = useCallback(async (id) => {
    await base44.entities.SchoolClass.delete(id);
    setData(d => ({ ...d, classes: d.classes.filter(c => c.id !== id), students: d.students.filter(s => s.classId !== id) }));
  }, []);

  const editClass = useCallback(async (id, name, gradeLevel, genderTrack) => {
    await base44.entities.SchoolClass.update(id, { name, grade_level: gradeLevel || null, gender_track: genderTrack });
    setData(d => ({ ...d, classes: d.classes.map(c => c.id === id ? { ...c, name, gradeLevel, genderTrack } : c) }));
  }, []);

  // --- Students ---
  const addStudent = useCallback(async (name, classId) => {
    const created = await base44.entities.Student.create({ name, class_id: classId });
    setData(d => ({ ...d, students: [...d.students, { id: created.id, name, classId }] }));
  }, []);

  const deleteStudent = useCallback(async (id) => {
    await base44.entities.Student.delete(id);
    setData(d => ({ ...d, students: d.students.filter(s => s.id !== id) }));
  }, []);

  const editStudent = useCallback(async (id, name, peExempt, subClassName) => {
    const payload = { name, pe_exempt: peExempt };
    if (subClassName !== undefined) payload.sub_class_name = subClassName || null;
    await base44.entities.Student.update(id, payload);
    setData(d => ({ ...d, students: d.students.map(s => s.id === id ? { ...s, name, peExempt, ...(subClassName !== undefined ? { subClassName } : {}) } : s) }));
  }, []);

  const importStudents = useCallback(async (names, classId) => {
    const existing = data.students.filter(s => s.classId === classId).map(s => s.name);
    const newNames = names.filter(n => !existing.includes(n));
    if (newNames.length === 0) return 0;
    const created = await base44.entities.Student.bulkCreate(newNames.map(n => ({ name: n, class_id: classId })));
    setData(d => ({ ...d, students: [...d.students, ...created.map(s => ({ id: s.id, name: s.name, classId: s.class_id }))] }));
    return newNames.length;
  }, [data.students]);

  // --- Tests ---
  const addTest = useCallback(async (test) => {
    const created = await base44.entities.TestDefinition.create({
      name: test.name, weight: test.weight, grade_level: test.gradeLevel, gender_track: test.genderTrack || 'boys',
      conversion_table: test.conversionTable,
    });
    const newTest = { id: created.id, name: created.name, weight: created.weight, gradeLevel: created.grade_level, genderTrack: created.gender_track || 'boys', conversionTable: jsonToConversionTable(created.conversion_table) };
    setData(d => ({ ...d, tests: [...d.tests, newTest] }));
  }, []);

  const updateTest = useCallback(async (test) => {
    await base44.entities.TestDefinition.update(test.id, {
      name: test.name, weight: test.weight, grade_level: test.gradeLevel, gender_track: test.genderTrack,
      conversion_table: test.conversionTable,
    });
    setData(d => ({ ...d, tests: d.tests.map(t => t.id === test.id ? test : t) }));
  }, []);

  const deleteTest = useCallback(async (id) => {
    await base44.entities.TestDefinition.delete(id);
    setData(d => ({ ...d, tests: d.tests.filter(t => t.id !== id) }));
  }, []);

  // --- Test Results ---
  const setTestResult = useCallback(async (studentId, testId, semester, rawScore, status, metadata = {}) => {
    const allExisting = await base44.entities.TestResult.filter({ student_id: studentId, test_id: testId, semester });
    const payload = { student_id: studentId, test_id: testId, semester, raw_score: rawScore, status, ...metadata };
    
    if (allExisting.length > 0) {
      await base44.entities.TestResult.update(allExisting[0].id, payload);
    } else {
      await base44.entities.TestResult.create(payload);
    }
    
    setData(d => {
      const filtered = d.results.filter(r => !(r.studentId === studentId && r.testId === testId && r.semester === semester));
      return { ...d, results: [...filtered, {
        studentId, testId, semester, rawScore, status,
        testDate: metadata.test_date, runTimeSeconds: metadata.run_time_seconds,
        lapsCompleted: metadata.laps_completed, routeName: metadata.route_name, liveRunId: metadata.live_run_id,
      }] };
    });
  }, []);

  // --- Behavior Grades ---
  const setBehaviorGrade = useCallback(async (studentId, quarter, grade) => {
    const existing = await base44.entities.BehaviorGrade.filter({ student_id: studentId, quarter });
    if (existing.length > 0) {
      await base44.entities.BehaviorGrade.update(existing[0].id, { grade });
    } else {
      await base44.entities.BehaviorGrade.create({ student_id: studentId, quarter, grade });
    }
    setData(d => {
      const filtered = d.behaviorGrades.filter(b => !(b.studentId === studentId && b.quarter === quarter));
      return { ...d, behaviorGrades: [...filtered, { studentId, quarter, grade }] };
    });
  }, []);

  // --- Class Test Status ---
  const setClassTestStatus = useCallback(async (classId, testId, semester, status) => {
    const existing = await base44.entities.ClassTestStatus.filter({ class_id: classId, test_id: testId, semester });
    if (existing.length > 0) {
      await base44.entities.ClassTestStatus.update(existing[0].id, { status });
    } else {
      await base44.entities.ClassTestStatus.create({ class_id: classId, test_id: testId, semester, status });
    }
    setData(d => {
      const filtered = d.classTestStatuses.filter(s => !(s.classId === classId && s.testId === testId && s.semester === semester));
      return { ...d, classTestStatuses: [...filtered, { classId, testId, semester, status }] };
    });
  }, []);

  // --- Grade Overrides ---
  const setGradeOverride = useCallback(async (studentId, classId, overrideType, grade) => {
    if (grade === null) {
      const existing = await base44.entities.GradeOverride.filter({ student_id: studentId, class_id: classId, override_type: overrideType });
      if (existing.length > 0) await base44.entities.GradeOverride.delete(existing[0].id);
      setData(d => ({ ...d, gradeOverrides: d.gradeOverrides.filter(o => !(o.studentId === studentId && o.classId === classId && o.overrideType === overrideType)) }));
      return;
    }
    const existing = await base44.entities.GradeOverride.filter({ student_id: studentId, class_id: classId, override_type: overrideType });
    if (existing.length > 0) {
      await base44.entities.GradeOverride.update(existing[0].id, { grade });
    } else {
      await base44.entities.GradeOverride.create({ student_id: studentId, class_id: classId, override_type: overrideType, grade });
    }
    setData(d => {
      const filtered = d.gradeOverrides.filter(o => !(o.studentId === studentId && o.classId === classId && o.overrideType === overrideType));
      return { ...d, gradeOverrides: [...filtered, { studentId, classId, overrideType, grade }] };
    });
  }, []);

  // --- Settings ---
  const updateSettings = useCallback(async (newSettings) => {
    const existing = await base44.entities.TeacherSettings.list();
    const payload = {
      penalty_score: newSettings.penaltyScore, auto_convert_missing: newSettings.autoConvertMissing,
      completion_penalty_factor: newSettings.completionPenaltyFactor, min_completed_grade: newSettings.minCompletedGrade,
      grade_color_thresholds: newSettings.gradeColorThresholds,
    };
    if (existing.length > 0) {
      await base44.entities.TeacherSettings.update(existing[0].id, payload);
    } else {
      await base44.entities.TeacherSettings.create(payload);
    }
    setData(d => ({ ...d, settings: { ...d.settings, ...newSettings } }));
  }, []);

  const updateDefaultGenderTrack = useCallback(async (track) => {
    const existing = await base44.entities.TeacherSettings.list();
    if (existing.length > 0) {
      await base44.entities.TeacherSettings.update(existing[0].id, { default_gender_track: track });
    } else {
      await base44.entities.TeacherSettings.create({ default_gender_track: track });
    }
    setDefaultGenderTrack(track);
  }, []);

  const updateBagrutSettings = useCallback(async (s) => {
    setData(d => ({ ...d, bagrutSettings: { ...d.bagrutSettings, ...s } }));
  }, []);

  // --- Bagrut Results ---
  const setBagrutResult = useCallback(async (studentId, componentId, score, status, notes, rawScore) => {
    const existing = await base44.entities.BagrutResult.filter({ student_id: studentId, component_id: componentId });
    const payload = { student_id: studentId, component_id: componentId, score, status, notes: notes || '', raw_score: rawScore };
    if (existing.length > 0) {
      await base44.entities.BagrutResult.update(existing[0].id, payload);
    } else {
      await base44.entities.BagrutResult.create(payload);
    }
    setData(d => {
      const filtered = d.bagrutResults.filter(r => !(r.studentId === studentId && r.componentId === componentId));
      return { ...d, bagrutResults: [...filtered, { studentId, componentId, score, status, notes: notes || '', rawScore }] };
    });
  }, []);

  const setBagrutTestIncluded = useCallback(async (name, genderTrack, included) => {
    const existing = await base44.entities.BagrutComponent.filter({ name, gender_track: genderTrack });
    if (included) {
      if (existing.length > 0) await base44.entities.BagrutComponent.update(existing[0].id, { is_required: true });
    } else {
      if (existing.length > 0) {
        await base44.entities.BagrutComponent.update(existing[0].id, { is_required: false });
      } else {
        await base44.entities.BagrutComponent.create({ name, gender_track: genderTrack, is_required: false });
      }
    }
    loadAll();
  }, [loadAll]);

  // --- Delete All ---
  const deleteAllData = useCallback(async () => {
    const entities = [
      base44.entities.SchoolClass, base44.entities.Student,
      base44.entities.TestResult, base44.entities.BehaviorGrade,
      base44.entities.ClassTestStatus, base44.entities.GradeOverride,
      base44.entities.TestAttempt, base44.entities.BagrutResult,
    ];
    for (const entity of entities) {
      const rows = await entity.list();
      await Promise.all((rows || []).map(r => entity.delete(r.id)));
    }
    setData({ ...DEFAULT_DATA });
    await loadAll();
  }, [loadAll]);

  const seedClasses = useCallback(() => {}, []);
  const closeSemester = useCallback(() => {}, []);

  const value = {
    data, loading, defaultGenderTrack,
    addClass, deleteClass, editClass,
    addStudent, deleteStudent, editStudent, importStudents,
    addTest, updateTest, deleteTest,
    setTestResult, setBehaviorGrade, setClassTestStatus,
    setGradeOverride, updateSettings, updateDefaultGenderTrack,
    updateBagrutSettings, setBagrutResult, setBagrutTestIncluded,
    deleteAllData, seedClasses, closeSemester, loadAll,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function buildBagrutComponentsFromTests(tests, exclusions = []) {
  const grade12Tests = tests.filter(t => t.gradeLevel === 'יב');
  if (grade12Tests.length === 0) return [];
  const excludedKeys = new Set(exclusions.map(e => `${e.genderTrack}::${e.name}`));
  return ['boys', 'girls'].flatMap(track =>
    grade12Tests
      .filter(test => (test.genderTrack || 'boys') === track)
      .filter(test => !excludedKeys.has(`${track}::${test.name}`))
      .sort((a, b) => a.name.localeCompare(b.name, 'he'))
      .map((test, index) => ({
        id: test.id, name: test.name, weight: test.weight, sortOrder: index,
        isRequired: true, genderTrack: track, conversionTable: test.conversionTable,
      }))
  );
}