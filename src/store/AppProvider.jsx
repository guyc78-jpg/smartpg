import { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';
import { base44 } from '@/api/base44Client';
import { DEFAULT_DATA, DEFAULT_TESTS, GRADE_LEVELS } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import { normalizeClassName, scheduleDedupeKey, PE_SUBJECT_NAME } from '@/lib/scheduleImport';
import { applyRemoteBellTimes, resetBellTimes, saveBellTimes } from '@/lib/periodTimes';

function jsonToConversionTable(json) {
  if (!Array.isArray(json)) return [];
  return json.map(entry => {
    const minResult = entry.minResult ?? entry.min_result;
    const maxResult = entry.maxResult ?? entry.max_result;
    const grade = entry.grade;
    return {
      minResult: minResult === null || minResult === undefined ? null : Number(minResult),
      maxResult: maxResult === null || maxResult === undefined ? null : Number(maxResult),
      grade: grade === null || grade === undefined ? null : Number(grade),
    };
  });
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
      const [classesData, studentsData, testsData, resultsData, behaviorData, settingsData, bagrutCompData, bagrutResultsData, classTestStatusData, gradeOverridesData, attemptsData, lessonData, scheduleData, substitutionData] = await Promise.all([
        base44.entities.SchoolClass.list('-created_date', 500),
        base44.entities.Student.list('-created_date', 500),
        base44.entities.TestDefinition.list('-created_date', 500),
        base44.entities.TestResult.list('-created_date', 5000),
        base44.entities.BehaviorGrade.list('-created_date', 5000),
        base44.entities.TeacherSettings.list('-created_date', 100),
        base44.entities.BagrutComponent.list('-created_date', 500),
        base44.entities.BagrutResult.list('-created_date', 5000),
        base44.entities.ClassTestStatus.list('-created_date', 5000),
        base44.entities.GradeOverride.list('-created_date', 5000),
        base44.entities.TestAttempt.list('-created_date', 5000),
        base44.entities.LessonTopic.list('-created_date', 5000),
        base44.entities.TeacherSchedule.list('-created_date', 5000),
        base44.entities.Substitution.list('-created_date', 5000),
      ]);

      const classes = (classesData || []).map(c => ({
        id: c.id, name: c.name, gradeLevel: c.grade_level, genderTrack: c.gender_track || 'boys',
        homeroomTeacher: c.homeroom_teacher || '', studentCount: c.student_count ?? 0,
        notes: c.notes || '', status: c.status || 'active',
        homeroomContacts: Array.isArray(c.homeroom_contacts) ? c.homeroom_contacts : [],
      }));

      const students = (studentsData || []).map(s => ({
        id: s.id, name: s.name, firstName: s.first_name || '', lastName: s.last_name || '',
        gender: s.gender || '', classId: s.class_id, peExempt: s.pe_exempt ?? false,
        medicalLimitations: s.medical_limitations || '', peNotes: s.pe_notes || '',
        studyGroup: s.study_group || '', subClassName: s.sub_class_name,
      }));

      let tests = (testsData || []).map(t => ({
        id: t.id, name: t.name, testType: t.test_type || 'other', weight: t.weight,
        gradeLevel: t.grade_level, classId: t.class_id || '', genderTrack: t.gender_track || 'boys',
        semester: t.semester || '', testDate: t.test_date || '', unit: t.unit || '',
        conversionTable: jsonToConversionTable(t.conversion_table),
      }));

      if (tests.length === 0) {
        const seeded = await Promise.all(
          DEFAULT_TESTS.map(t => base44.entities.TestDefinition.create({
            name: t.name, test_type: t.testType || 'other', weight: t.weight, grade_level: t.gradeLevel,
            gender_track: t.genderTrack, unit: t.unit || '', conversion_table: t.conversionTable,
          }))
        );
        tests = seeded.map(t => ({
          id: t.id, name: t.name, testType: t.test_type || 'other', weight: t.weight,
          gradeLevel: t.grade_level, classId: t.class_id || '', genderTrack: t.gender_track || 'boys',
          semester: t.semester || '', testDate: t.test_date || '', unit: t.unit || '',
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
        bellSchedule: settingsRaw.bell_schedule || null,
      } : DEFAULT_DATA.settings;

      if (settingsRaw?.bell_schedule) applyRemoteBellTimes(settingsRaw.bell_schedule);

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

      const lessonTopics = (lessonData || []).map(r => ({
        id: r.id, classId: r.class_id, date: r.date, period: r.period, semester: r.semester || '',
        topic: r.topic || '', location: r.location || '', objective: r.objective || '',
        equipment: r.equipment || '', activityType: r.activity_type || '', notes: r.notes || '',
        postLessonNotes: r.post_lesson_notes || '',
        isTemplate: r.is_template || false, templateName: r.template_name || '',
      }));

      const scheduleLessons = (scheduleData || []).map(r => ({
        id: r.id, dayOfWeek: r.day_of_week, period: r.period, classId: r.class_id || '',
        className: r.class_name || '', subject: r.subject || '', source: r.source || 'manual', notes: r.notes || '',
      }));

      const substitutions = (substitutionData || []).map(r => ({
        id: r.id, date: r.date, period: r.period,
        originalClassId: r.original_class_id || '', substituteClassId: r.substitute_class_id || '',
        notes: r.notes || '',
      }));

      setData({
        classes, students, tests, results, testAttempts, behaviorGrades, settings,
        bagrutComponents, bagrutResults, bagrutSettings: { enabled: false, autoCalculate: true, showInSummary: true },
        classTestStatuses, gradeOverrides, lessonTopics, scheduleLessons, substitutions,
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

  // --- Realtime subscriptions (debounced reload for cross-session sync) ---
  useEffect(() => {
    if (!isAuthenticated) return;
    let reloadTimer = null;
    const scheduleReload = () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => {
        const active = document.activeElement;
        const isTyping = active && ['INPUT', 'TEXTAREA'].includes(active.tagName);
        if (isTyping) scheduleReload();
        else loadAll();
      }, 1500);
    };
    const entitiesToWatch = [
      'SchoolClass', 'Student', 'TestResult', 'BehaviorGrade',
      'ClassTestStatus', 'LessonTopic', 'TeacherSchedule', 'Substitution',
      'TeacherSettings',
    ];
    const unsubs = entitiesToWatch.map(name => {
      try {
        return base44.entities[name]?.subscribe?.(() => scheduleReload());
      } catch { return null; }
    });
    return () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      unsubs.forEach(fn => fn && fn());
    };
  }, [isAuthenticated, loadAll]);

  // --- Classes ---
  const addClass = useCallback(async (classData, gradeLevel, genderTrack) => {
    const payloadData = typeof classData === 'object'
      ? classData
      : { name: classData, gradeLevel, genderTrack, status: 'active' };
    const created = await base44.entities.SchoolClass.create({
      name: payloadData.name,
      grade_level: payloadData.gradeLevel || null,
      gender_track: payloadData.genderTrack || defaultGenderTrack,
      homeroom_teacher: payloadData.homeroomTeacher || '',
      student_count: payloadData.studentCount || 0,
      notes: payloadData.notes || '',
      status: payloadData.status || 'active',
      homeroom_contacts: [],
    });
    setData(d => ({
      ...d,
      classes: [...d.classes, {
        id: created.id, name: created.name, gradeLevel: created.grade_level,
        genderTrack: created.gender_track || defaultGenderTrack,
        homeroomTeacher: created.homeroom_teacher || '', studentCount: created.student_count ?? 0,
        notes: created.notes || '', status: created.status || 'active', homeroomContacts: [],
      }],
    }));
    return created.id;
  }, [defaultGenderTrack]);

  const deleteClass = useCallback(async (id) => {
    const studentIds = data.students.filter(s => s.classId === id).map(s => s.id);
    await base44.entities.SchoolClass.delete(id);
    if (studentIds.length > 0) {
      await base44.entities.Student.deleteMany({ class_id: id });
      await base44.entities.TestResult.deleteMany({ student_id: { $in: studentIds } });
      await base44.entities.BehaviorGrade.deleteMany({ student_id: { $in: studentIds } });
      await base44.entities.BagrutResult.deleteMany({ student_id: { $in: studentIds } });
      await base44.entities.TestAttempt.deleteMany({ student_id: { $in: studentIds } });
      await base44.entities.GradeOverride.deleteMany({ student_id: { $in: studentIds } });
    }
    await base44.entities.LessonTopic.deleteMany({ class_id: id });
    await base44.entities.TeacherSchedule.deleteMany({ class_id: id });
    await base44.entities.ClassTestStatus.deleteMany({ class_id: id });
    await base44.entities.RunMeasurement.deleteMany({ class_id: id });
    await base44.entities.PeStopwatchLog.deleteMany({ class_id: id });
    setData(d => ({
      ...d,
      classes: d.classes.filter(c => c.id !== id),
      students: d.students.filter(s => s.classId !== id),
      results: d.results.filter(r => !studentIds.includes(r.studentId)),
      behaviorGrades: d.behaviorGrades.filter(b => !studentIds.includes(b.studentId)),
      bagrutResults: d.bagrutResults.filter(r => !studentIds.includes(r.studentId)),
      testAttempts: d.testAttempts.filter(a => !studentIds.includes(a.studentId)),
      gradeOverrides: d.gradeOverrides.filter(o => o.classId !== id),
      lessonTopics: d.lessonTopics.filter(l => l.classId !== id),
      scheduleLessons: d.scheduleLessons.filter(l => l.classId !== id),
      classTestStatuses: d.classTestStatuses.filter(s => s.classId !== id),
    }));
  }, [data.students]);

  const editClass = useCallback(async (id, classData, gradeLevel, genderTrack) => {
    const payloadData = typeof classData === 'object'
      ? classData
      : { name: classData, gradeLevel, genderTrack };
    await base44.entities.SchoolClass.update(id, {
      name: payloadData.name,
      grade_level: payloadData.gradeLevel || null,
      gender_track: payloadData.genderTrack,
      homeroom_teacher: payloadData.homeroomTeacher || '',
      notes: payloadData.notes || '',
      status: payloadData.status || 'active',
    });
    setData(d => ({
      ...d,
      classes: d.classes.map(c => c.id === id ? { ...c, ...payloadData } : c),
    }));
  }, []);

  const archiveClass = useCallback(async (id) => {
    await base44.entities.SchoolClass.update(id, { status: 'archived' });
    setData(d => ({ ...d, classes: d.classes.map(c => c.id === id ? { ...c, status: 'archived' } : c) }));
  }, []);

  const duplicateClass = useCallback(async (id) => {
    const source = data.classes.find(c => c.id === id);
    if (!source) return null;
    return addClass({
      name: `${source.name} - עותק`,
      gradeLevel: source.gradeLevel,
      genderTrack: source.genderTrack,
      homeroomTeacher: source.homeroomTeacher,
      notes: source.notes,
      status: 'active',
    });
  }, [addClass, data.classes]);

  // --- Students ---
  const addStudent = useCallback(async (studentData, classId) => {
    const payloadData = typeof studentData === 'object' ? studentData : { name: studentData, classId };
    const fullName = payloadData.name || [payloadData.lastName, payloadData.firstName].filter(Boolean).join(' ');
    const payload = {
      name: fullName,
      first_name: payloadData.firstName || '',
      last_name: payloadData.lastName || '',
      gender: payloadData.gender || '',
      class_id: payloadData.classId || classId,
      pe_exempt: payloadData.peExempt || false,
      medical_limitations: payloadData.medicalLimitations || '',
      pe_notes: payloadData.peNotes || '',
      study_group: payloadData.studyGroup || '',
      sub_class_name: payloadData.studyGroup || payloadData.subClassName || '',
    };
    const created = await base44.entities.Student.create(payload);
    setData(d => ({ ...d, students: [...d.students, {
      id: created.id, name: created.name, firstName: created.first_name || '', lastName: created.last_name || '',
      gender: created.gender || '', classId: created.class_id, peExempt: created.pe_exempt ?? false,
      medicalLimitations: created.medical_limitations || '', peNotes: created.pe_notes || '',
      studyGroup: created.study_group || '', subClassName: created.sub_class_name,
    }] }));
    return created.id;
  }, []);

  const deleteStudent = useCallback(async (id) => {
    await base44.entities.Student.delete(id);
    setData(d => ({ ...d, students: d.students.filter(s => s.id !== id) }));
  }, []);

  const editStudent = useCallback(async (id, studentData, peExempt, subClassName) => {
    const payloadData = typeof studentData === 'object' ? studentData : { name: studentData, peExempt, subClassName };
    const fullName = payloadData.name || [payloadData.lastName, payloadData.firstName].filter(Boolean).join(' ');
    const payload = {
      name: fullName,
      first_name: payloadData.firstName || '',
      last_name: payloadData.lastName || '',
      gender: payloadData.gender || '',
      class_id: payloadData.classId,
      pe_exempt: payloadData.peExempt || false,
      medical_limitations: payloadData.medicalLimitations || '',
      pe_notes: payloadData.peNotes || '',
      study_group: payloadData.studyGroup || '',
      sub_class_name: payloadData.studyGroup || payloadData.subClassName || '',
    };
    await base44.entities.Student.update(id, payload);
    setData(d => ({ ...d, students: d.students.map(s => s.id === id ? {
      ...s, name: fullName, firstName: payloadData.firstName || '', lastName: payloadData.lastName || '',
      gender: payloadData.gender || '', classId: payloadData.classId || s.classId,
      peExempt: payloadData.peExempt || false, medicalLimitations: payloadData.medicalLimitations || '',
      peNotes: payloadData.peNotes || '', studyGroup: payloadData.studyGroup || '', subClassName: payload.sub_class_name,
    } : s) }));
  }, []);

  const importStudents = useCallback(async (items, classId) => {
    const existing = new Set(data.students.filter(s => s.classId === classId).map(s => s.name));
    const payloads = items.map(item => {
      const payloadData = typeof item === 'object' ? item : { name: item };
      const fullName = payloadData.name || [payloadData.lastName, payloadData.firstName].filter(Boolean).join(' ');
      return {
        name: fullName,
        first_name: payloadData.firstName || '',
        last_name: payloadData.lastName || '',
        gender: payloadData.gender || '',
        class_id: payloadData.classId || classId,
        pe_exempt: payloadData.peExempt || false,
        medical_limitations: payloadData.medicalLimitations || '',
        pe_notes: payloadData.peNotes || '',
        study_group: payloadData.studyGroup || '',
        sub_class_name: payloadData.studyGroup || '',
      };
    }).filter(p => p.name && !existing.has(p.name));
    if (payloads.length === 0) return { added: 0, updated: 0, skipped: items.length, errors: [] };
    const created = await base44.entities.Student.bulkCreate(payloads);
    setData(d => ({ ...d, students: [...d.students, ...created.map(s => ({
      id: s.id, name: s.name, firstName: s.first_name || '', lastName: s.last_name || '',
      gender: s.gender || '', classId: s.class_id, peExempt: s.pe_exempt ?? false,
      medicalLimitations: s.medical_limitations || '', peNotes: s.pe_notes || '',
      studyGroup: s.study_group || '', subClassName: s.sub_class_name,
    }))] }));
    return { added: payloads.length, updated: 0, skipped: items.length - payloads.length, errors: [] };
  }, [data.students]);

  // --- Tests ---
  const addTest = useCallback(async (test) => {
    const created = await base44.entities.TestDefinition.create({
      name: test.name, test_type: test.testType || 'other', weight: test.weight,
      grade_level: test.gradeLevel, class_id: test.classId || '', gender_track: test.genderTrack || 'boys',
      semester: test.semester || undefined, test_date: test.testDate || undefined, unit: test.unit || '',
      conversion_table: test.conversionTable,
    });
    const newTest = {
      id: created.id, name: created.name, testType: created.test_type || 'other', weight: created.weight,
      gradeLevel: created.grade_level, classId: created.class_id || '', genderTrack: created.gender_track || 'boys',
      semester: created.semester || '', testDate: created.test_date || '', unit: created.unit || '',
      conversionTable: jsonToConversionTable(created.conversion_table),
    };
    setData(d => ({ ...d, tests: [...d.tests, newTest] }));
  }, []);

  const updateTest = useCallback(async (test) => {
    await base44.entities.TestDefinition.update(test.id, {
      name: test.name, test_type: test.testType || 'other', weight: test.weight,
      grade_level: test.gradeLevel, class_id: test.classId || '', gender_track: test.genderTrack,
      semester: test.semester || undefined, test_date: test.testDate || undefined, unit: test.unit || '',
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
    const lookup = { student_id: studentId, test_id: testId, semester };
    if (metadata.test_date) lookup.test_date = metadata.test_date;
    const allExisting = await base44.entities.TestResult.filter(lookup);
    const payload = { student_id: studentId, test_id: testId, semester, raw_score: rawScore, status, ...metadata };
    
    if (allExisting.length > 0) {
      await base44.entities.TestResult.update(allExisting[0].id, payload);
    } else {
      await base44.entities.TestResult.create(payload);
    }
    
    setData(d => {
      const filtered = d.results.filter(r => {
        const sameBase = r.studentId === studentId && r.testId === testId && r.semester === semester;
        if (!sameBase) return true;
        return metadata.test_date ? r.testDate !== metadata.test_date : Boolean(r.testDate);
      });
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

  const updateBellSchedule = useCallback(async (bellSchedule) => {
    const existing = await base44.entities.TeacherSettings.list();
    if (existing.length > 0) {
      await base44.entities.TeacherSettings.update(existing[0].id, { bell_schedule: bellSchedule });
    } else {
      await base44.entities.TeacherSettings.create({ bell_schedule: bellSchedule });
    }
    if (bellSchedule) saveBellTimes(bellSchedule);
    else resetBellTimes();
    setData(d => ({ ...d, settings: { ...d.settings, bellSchedule } }));
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

  // --- Schedule Import (PE lessons only) ---
  const importSchedule = useCallback(async (lessons) => {
    const existingClassByKey = new Map(data.classes.map(c => [normalizeClassName(c.name), c]));
    const existingKeys = new Set(
      data.scheduleLessons.map(l => l.classId
        ? scheduleDedupeKey(l.dayOfWeek, l.period, l.classId)
        : scheduleDedupeKey(l.dayOfWeek, l.period, normalizeClassName(`${l.subject}|${l.className}`)))
    );

    let classesCreated = 0;
    const newClasses = [];
    const newScheduleRows = [];

    for (const lesson of lessons) {
      if (lesson.isPe === false) {
        // Non-PE lesson — save as-is without creating a class
        const key = scheduleDedupeKey(lesson.dayOfWeek, lesson.period, lesson.classKey);
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);
        newScheduleRows.push({
          day_of_week: lesson.dayOfWeek, period: lesson.period, class_id: '',
          class_name: lesson.className, subject: lesson.subject, source: 'import',
        });
        continue;
      }
      let cls = existingClassByKey.get(lesson.classKey);
      if (!cls) {
        const gradeLevel = GRADE_LEVELS.find(g => lesson.className.trim().startsWith(g)) || null;
        const genderTrack = /בנות/.test(lesson.className) ? 'girls' : 'boys';
        const created = await base44.entities.SchoolClass.create({
          name: lesson.className, grade_level: gradeLevel, gender_track: genderTrack,
          status: 'active', homeroom_contacts: [],
        });
        cls = {
          id: created.id, name: created.name, gradeLevel: created.grade_level,
          genderTrack: created.gender_track, homeroomTeacher: '', studentCount: 0,
          notes: '', status: 'active', homeroomContacts: [],
        };
        existingClassByKey.set(lesson.classKey, cls);
        newClasses.push(cls);
        classesCreated += 1;
      }

      const key = scheduleDedupeKey(lesson.dayOfWeek, lesson.period, cls.id);
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      newScheduleRows.push({
        day_of_week: lesson.dayOfWeek, period: lesson.period, class_id: cls.id,
        class_name: lesson.className, subject: PE_SUBJECT_NAME, source: 'import',
      });
    }

    let created = [];
    if (newScheduleRows.length > 0) {
      created = await base44.entities.TeacherSchedule.bulkCreate(newScheduleRows);
    }

    setData(d => ({
      ...d,
      classes: [...d.classes, ...newClasses],
      scheduleLessons: [...d.scheduleLessons, ...created.map(r => ({
        id: r.id, dayOfWeek: r.day_of_week, period: r.period, classId: r.class_id,
        className: r.class_name || '', subject: r.subject || '', source: r.source || 'import', notes: '',
      }))],
    }));

    return { classesCreated, lessonsSaved: created.length, duplicatesSkipped: lessons.length - created.length };
  }, [data.classes, data.scheduleLessons]);

  // --- Delete All ---
  const deleteAllData = useCallback(async () => {
    const entities = [
    base44.entities.SchoolClass, base44.entities.Student,
    base44.entities.TestResult, base44.entities.BehaviorGrade,
    base44.entities.ClassTestStatus, base44.entities.GradeOverride,
    base44.entities.TestAttempt, base44.entities.BagrutResult,
    base44.entities.LessonTopic, base44.entities.TeacherSchedule,
    base44.entities.RunMeasurement, base44.entities.PeStopwatchLog,
    base44.entities.Substitution,
    ];
    for (const entity of entities) {
      await entity.deleteMany({});
    }
    setData({ ...DEFAULT_DATA });
    await loadAll();
  }, [loadAll]);

  // --- Lesson Topics ---
  const saveLessonTopic = useCallback(async (classId, date, period, topic) => {
    const existing = await base44.entities.LessonTopic.filter({ class_id: classId, date, period: Number(period), is_template: false });
    const trimmed = (topic || '').trim();
    if (existing.length > 0) {
      if (!trimmed) {
        await base44.entities.LessonTopic.delete(existing[0].id);
        setData(d => ({ ...d, lessonTopics: d.lessonTopics.filter(l => l.id !== existing[0].id) }));
        return;
      }
      await base44.entities.LessonTopic.update(existing[0].id, { topic: trimmed });
      setData(d => ({ ...d, lessonTopics: d.lessonTopics.map(l => l.id === existing[0].id ? { ...l, topic: trimmed } : l) }));
    } else {
      if (!trimmed) return;
      const created = await base44.entities.LessonTopic.create({ class_id: classId, date, period: Number(period), topic: trimmed });
      setData(d => ({ ...d, lessonTopics: [...d.lessonTopics, {
        id: created.id, classId, date, period: Number(period), semester: '', topic: trimmed,
        location: '', objective: '', equipment: '', activityType: '', notes: '', postLessonNotes: '',
        isTemplate: false, templateName: '',
      }] }));
    }
  }, []);

  // --- Substitutions ---
  const addSubstitution = useCallback(async (subData) => {
    const created = await base44.entities.Substitution.create({
      date: subData.date, period: Number(subData.period || 1),
      original_class_id: subData.originalClassId, substitute_class_id: subData.substituteClassId,
      notes: subData.notes || '',
    });
    setData(d => ({ ...d, substitutions: [...d.substitutions, {
      id: created.id, date: created.date, period: created.period,
      originalClassId: created.original_class_id || '', substituteClassId: created.substitute_class_id || '',
      notes: created.notes || '',
    }] }));
  }, []);

  const deleteSubstitution = useCallback(async (id) => {
    await base44.entities.Substitution.delete(id);
    setData(d => ({ ...d, substitutions: d.substitutions.filter(s => s.id !== id) }));
  }, []);

  const seedClasses = useCallback(() => {}, []);
  const closeSemester = useCallback(() => {}, []);

  const value = {
    data, loading, defaultGenderTrack,
    addClass, deleteClass, editClass, archiveClass, duplicateClass,
    addStudent, deleteStudent, editStudent, importStudents,
    addTest, updateTest, deleteTest,
    setTestResult, setBehaviorGrade, setClassTestStatus,
    setGradeOverride, updateSettings, updateDefaultGenderTrack, updateBellSchedule,
    updateBagrutSettings, setBagrutResult, setBagrutTestIncluded,
    deleteAllData, seedClasses, closeSemester, loadAll, importSchedule,
    addSubstitution, deleteSubstitution, saveLessonTopic,
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
