import { useState, useCallback, useEffect, useRef, createContext, useContext, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { DEFAULT_DATA, DEFAULT_TESTS, GRADE_LEVELS } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import { normalizeClassName, scheduleDedupeKey, PE_SUBJECT_NAME } from '@/lib/scheduleImport';
import { applyRemoteBellTimes, resetBellTimes } from '@/lib/periodTimes';
import { buildStudentPayload, studentDedupeKey } from '@/lib/studentPayload';

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

function clampScore(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : fallback;
}

function clampUnit(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : fallback;
}

let idCounter = 0;
export function generateId() {
  return `local_${Date.now()}_${++idCounter}`;
}

const mutationQueues = new Map();

function enqueueMutation(key, task) {
  const previous = mutationQueues.get(key) || Promise.resolve();
  const next = previous.catch(() => {}).then(task);
  mutationQueues.set(key, next);
  return next.finally(() => {
    if (mutationQueues.get(key) === next) mutationQueues.delete(key);
  });
}

async function withRetry(task, attempts = 2) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        const delay = 250 * (2 ** attempt) + Math.floor(Math.random() * 150);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

async function listAll(entity, sort = '-created_date') {
  const pageSize = 5000;
  const rows = [];
  for (let skip = 0; ; skip += pageSize) {
    const page = await withRetry(() => entity.list(sort, pageSize, skip));
    rows.push(...(page || []));
    if (!page || page.length < pageSize) return rows;
  }
}

async function filterAll(entity, query, sort = '-created_date') {
  const pageSize = 5000;
  const rows = [];
  for (let skip = 0; ; skip += pageSize) {
    const page = await withRetry(() => entity.filter(query, sort, pageSize, skip));
    rows.push(...(page || []));
    if (!page || page.length < pageSize) return rows;
  }
}

function normalizeOwnerEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function requireOwnerEmail(value, action = 'לביצוע הפעולה') {
  const email = normalizeOwnerEmail(value);
  if (!email) throw new Error(`נדרש משתמש מחובר ${action}`);
  return email;
}

function upsertById(items, item) {
  const index = items.findIndex(value => value.id === item.id);
  if (index < 0) return [...items, item];
  const next = [...items];
  next[index] = item;
  return next;
}

const mapClass = c => ({
  id: c.id, name: c.name, gradeLevel: c.grade_level, genderTrack: c.gender_track || 'boys',
  homeroomTeacher: c.homeroom_teacher || '', studentCount: c.student_count ?? 0,
  notes: c.notes || '', status: c.status || 'active',
  homeroomContacts: Array.isArray(c.homeroom_contacts) ? c.homeroom_contacts : [],
});

const mapStudent = s => ({
  id: s.id, name: s.name, firstName: s.first_name || '', lastName: s.last_name || '',
  gender: s.gender || '', classId: s.class_id, peExempt: s.pe_exempt ?? false,
  medicalLimitations: s.medical_limitations || '', peNotes: s.pe_notes || '',
  studyGroup: s.study_group || '', subClassName: s.sub_class_name,
});

const mapTest = t => ({
  id: t.id, name: t.name, testType: t.test_type || 'other', weight: t.weight,
  gradeLevel: t.grade_level, classId: t.class_id || '', genderTrack: t.gender_track || 'boys',
  semester: t.semester || '', testDate: t.test_date || '', unit: t.unit || '',
  conversionTable: jsonToConversionTable(t.conversion_table),
});

const mapResult = r => ({
  id: r.id, studentId: r.student_id, testId: r.test_id, semester: r.semester,
  rawScore: r.raw_score ?? null, status: r.status || 'completed', attemptCount: r.attempt_count ?? 1,
  testDate: r.test_date, runTimeSeconds: r.run_time_seconds, lapsCompleted: r.laps_completed,
  routeName: r.route_name, liveRunId: r.live_run_id,
});

const mapAttempt = a => ({
  id: a.id, studentId: a.student_id, testId: a.test_id, semester: a.semester,
  rawScore: Number(a.raw_score), attemptNumber: a.attempt_number, attemptedAt: a.created_date,
  liveRunId: a.live_run_id || '',
});

const mapBehavior = b => ({ id: b.id, studentId: b.student_id, quarter: b.quarter, grade: b.grade });
const mapBagrutResult = r => ({
  id: r.id, studentId: r.student_id, componentId: r.component_id, rawScore: r.raw_score ?? null,
  score: r.score, status: r.status || 'missing', notes: r.notes || '',
});
const mapClassStatus = r => ({ id: r.id, classId: r.class_id, testId: r.test_id, semester: r.semester, status: r.status });
const mapGradeOverride = r => ({ id: r.id, studentId: r.student_id, classId: r.class_id, overrideType: r.override_type, grade: r.grade });
const mapLessonTopic = r => ({
  id: r.id, classId: r.class_id, date: r.date, period: r.period, semester: r.semester || '',
  topic: r.topic || '', location: r.location || '', objective: r.objective || '',
  equipment: r.equipment || '', activityType: r.activity_type || '', notes: r.notes || '',
  postLessonNotes: r.post_lesson_notes || '', isTemplate: r.is_template || false,
  templateName: r.template_name || '',
});
const mapSchedule = r => ({
  id: r.id, dayOfWeek: r.day_of_week, period: r.period, classId: r.class_id || '',
  className: r.class_name || '', subject: r.subject || '', source: r.source || 'manual', notes: r.notes || '',
});
const mapSubstitution = r => ({
  id: r.id, date: r.date, period: r.period, originalClassId: r.original_class_id || '',
  substituteClassId: r.substitute_class_id || '', notes: r.notes || '',
});

function mapSettings(settingsRaw) {
  if (!settingsRaw) return DEFAULT_DATA.settings;
  return {
    parentBehaviorWeight: settingsRaw.parent_behavior_weight ?? 30,
    semesterBehaviorWeight: settingsRaw.semester_behavior_weight ?? 30,
    testsWeight: settingsRaw.tests_weight ?? 40,
    penaltyScore: settingsRaw.penalty_score ?? 15,
    autoConvertMissing: settingsRaw.auto_convert_missing ?? false,
    completionPenaltyFactor: settingsRaw.completion_penalty_factor ?? 0,
    minCompletedGrade: settingsRaw.min_completed_grade ?? 56,
    gradeColorThresholds: settingsRaw.grade_color_thresholds ?? { redBelow: 55, greenAt: 100 },
    bellSchedule: settingsRaw.bell_schedule || null,
    teacherName: settingsRaw.teacher_name || '',
    schoolName: settingsRaw.school_name || '',
    defaultSemester: settingsRaw.default_semester || 'A',
  };
}

function settingsTimestamp(row) {
  const value = Date.parse(row?.updated_date || row?.created_date || '');
  return Number.isFinite(value) ? value : 0;
}

function mergeTeacherSettings(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const ordered = [...rows].sort((a, b) => {
    const timestampDifference = settingsTimestamp(a) - settingsTimestamp(b);
    return timestampDifference || String(a?.id || '').localeCompare(String(b?.id || ''));
  });
  const canonical = ordered[ordered.length - 1];
  const merged = {};
  for (const row of ordered) {
    for (const [key, value] of Object.entries(row || {})) {
      if (value !== undefined) merged[key] = value;
    }
  }
  merged.id = canonical.id;
  merged.created_date = canonical.created_date;
  merged.updated_date = canonical.updated_date;
  merged.defaults_seeded = ordered.some(row => row?.defaults_seeded === true);
  return merged;
}

function applySettingsRuntime(settingsRaw, setDefaultGenderTrack) {
  if (!settingsRaw) {
    resetSettingsRuntime(setDefaultGenderTrack);
    return;
  }
  if (settingsRaw?.bell_schedule) applyRemoteBellTimes(settingsRaw.bell_schedule);
  else resetBellTimes();

  const track = settingsRaw?.default_gender_track === 'girls' ? 'girls' : 'boys';
  setDefaultGenderTrack(track);
  if (typeof window === 'undefined') return;

  const values = {
    teacherName: String(settingsRaw?.teacher_name || '').trim(),
    schoolName: String(settingsRaw?.school_name || '').trim(),
    defaultSemester: settingsRaw?.default_semester === 'B' ? 'B' : 'A',
  };
  for (const [key, value] of Object.entries(values)) {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  }
}

function resetSettingsRuntime(setDefaultGenderTrack) {
  resetBellTimes();
  setDefaultGenderTrack('boys');
  if (typeof window === 'undefined') return;
  ['teacherName', 'schoolName', 'defaultSemester'].forEach(key => localStorage.removeItem(key));
}

function defaultTestKey(test) {
  return [
    test?.name || '',
    test?.grade_level ?? test?.gradeLevel ?? '',
    test?.gender_track ?? test?.genderTrack ?? 'boys',
    test?.test_type ?? test?.testType ?? 'other',
    test?.unit || '',
    test?.class_id ?? test?.classId ?? '',
  ].join('::');
}

const DEFAULT_TEST_KEYS = new Set(DEFAULT_TESTS.map(defaultTestKey));

export const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const ownerEmail = normalizeOwnerEmail(user?.email);
  const [data, setData] = useState({ ...DEFAULT_DATA });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [defaultGenderTrack, setDefaultGenderTrack] = useState('boys');
  const loadedOwnerRef = useRef('');
  const loadPromiseRef = useRef(null);
  const loadGenerationRef = useRef(0);
  const ownerEmailRef = useRef(ownerEmail);
  const realtimeSequenceRef = useRef(0);
  const realtimeEventLogRef = useRef([]);
  const replayRealtimeEventRef = useRef(null);
  const bagrutExclusionsRef = useRef([]);
  const teacherSettingsRowsRef = useRef([]);
  ownerEmailRef.current = ownerEmail;

  const listOwnSettings = useCallback(() => {
    const email = requireOwnerEmail(ownerEmail, 'לשמירת הגדרות');
    return filterAll(base44.entities.TeacherSettings, { created_by: email }, '-updated_date');
  }, [ownerEmail]);

  const loadAll = useCallback(async ({ seedDefaults = true, force = false } = {}) => {
    let requestOwner;
    try {
      requestOwner = requireOwnerEmail(ownerEmail, 'לטעינת הנתונים');
    } catch (error) {
      if (ownerEmailRef.current === ownerEmail) {
        setLoadError(error);
        setLoading(false);
      }
      return false;
    }

    const requestKey = `${requestOwner}:${seedDefaults ? 'seed' : 'no-seed'}`;
    if (!force && loadPromiseRef.current?.key === requestKey) {
      return loadPromiseRef.current.promise;
    }
    const generation = ++loadGenerationRef.current;
    const startRealtimeSequence = realtimeSequenceRef.current;
    const isCurrentRequest = () => (
      loadGenerationRef.current === generation
      && ownerEmailRef.current === requestOwner
    );
    const request = (async () => {
      if (isCurrentRequest()) {
        setLoading(true);
        setLoadError(null);
      }
      try {
      const requests = [
        base44.entities.SchoolClass, base44.entities.Student, base44.entities.TestDefinition,
        base44.entities.TestResult, base44.entities.BehaviorGrade, base44.entities.TeacherSettings,
        base44.entities.BagrutComponent, base44.entities.BagrutResult, base44.entities.ClassTestStatus,
        base44.entities.GradeOverride, base44.entities.TestAttempt, base44.entities.LessonTopic,
        base44.entities.TeacherSchedule, base44.entities.Substitution,
      ].map(entity => listAll(entity));
      const settled = await Promise.allSettled(requests);
      const failed = settled.filter(result => result.status === 'rejected');
      if (failed.length > 0) throw new AggregateError(failed.map(result => result.reason), 'Failed to load application data');
      if (!isCurrentRequest()) return false;
      const [classesData, studentsData, initialTestsData, resultsData, behaviorData, settingsData, bagrutCompData, bagrutResultsData, classTestStatusData, gradeOverridesData, attemptsData, lessonData, scheduleData, substitutionData] = settled.map(result => result.value);

      const classes = (classesData || []).map(mapClass);

      const students = (studentsData || []).map(mapStudent);

      let settingsRows = settingsData || [];
      let settingsRaw = mergeTeacherSettings(settingsRows);
      let testRows = initialTestsData || [];
      let tests = testRows.map(mapTest);

      if (seedDefaults && settingsRaw?.defaults_seeded !== true) {
        const existingDefaultKeys = new Set(testRows.map(defaultTestKey));
        const missingDefaults = DEFAULT_TESTS.filter(test => !existingDefaultKeys.has(defaultTestKey(test)));
        await Promise.all(missingDefaults.map(test => base44.entities.TestDefinition.create({
          name: test.name,
          test_type: test.testType || 'other',
          weight: test.weight,
          grade_level: test.gradeLevel,
          gender_track: test.genderTrack,
          unit: test.unit || '',
          conversion_table: test.conversionTable,
        })));
        if (!isCurrentRequest()) return false;
        const savedSettings = settingsRaw
          ? await base44.entities.TeacherSettings.update(settingsRaw.id, { defaults_seeded: true })
          : await base44.entities.TeacherSettings.create({ defaults_seeded: true });
        settingsRows = upsertById(settingsRows, savedSettings);
        settingsRaw = { ...settingsRaw, ...savedSettings, defaults_seeded: true };
        // A second read lets concurrent browser tabs converge on the same seeded rows.
        testRows = await listAll(base44.entities.TestDefinition);
      }

      if (seedDefaults) {
        const groups = new Map();
        for (const row of testRows) {
          const key = defaultTestKey(row);
          if (!DEFAULT_TEST_KEYS.has(key)) continue;
          const group = groups.get(key) || [];
          group.push(row);
          groups.set(key, group);
        }
        const duplicateRows = [];
        for (const group of groups.values()) {
          group.sort((a, b) => {
            const timestampDifference = Date.parse(a.created_date || '') - Date.parse(b.created_date || '');
            return (Number.isFinite(timestampDifference) ? timestampDifference : 0)
              || String(a.id).localeCompare(String(b.id));
          });
          duplicateRows.push(...group.slice(1));
        }
        if (duplicateRows.length > 0) {
          const outcomes = await Promise.allSettled(
            duplicateRows.map(row => base44.entities.TestDefinition.delete(row.id))
          );
          const deletedIds = new Set(duplicateRows
            .filter((_, index) => outcomes[index].status === 'fulfilled')
            .map(row => row.id));
          testRows = testRows.filter(row => !deletedIds.has(row.id));
        }
      }
      if (!isCurrentRequest()) return false;
      tests = testRows.map(mapTest);

      const results = (resultsData || []).map(mapResult);

      const testAttempts = (attemptsData || []).map(mapAttempt);

      const behaviorGrades = (behaviorData || []).map(mapBehavior);

      const settings = mapSettings(settingsRaw);

      applySettingsRuntime(settingsRaw, setDefaultGenderTrack);
      teacherSettingsRowsRef.current = settingsRows;

      const bagrutExclusions = (bagrutCompData || []).filter(c => c.is_required === false).map(c => ({
        id: c.id,
        name: c.name,
        genderTrack: c.gender_track,
        isRequired: false,
      }));
      bagrutExclusionsRef.current = bagrutExclusions;

      const bagrutComponents = buildBagrutComponentsFromTests(tests, bagrutExclusions);
      const bagrutResults = (bagrutResultsData || []).map(mapBagrutResult);

      const classTestStatuses = (classTestStatusData || []).map(mapClassStatus);

      const gradeOverrides = (gradeOverridesData || []).map(mapGradeOverride);

      const lessonTopics = (lessonData || []).map(mapLessonTopic);

      const scheduleLessons = (scheduleData || []).map(mapSchedule);

      const substitutions = (substitutionData || []).map(mapSubstitution);

      setData({
        classes, students, tests, results, testAttempts, behaviorGrades, settings,
        bagrutComponents, bagrutResults, bagrutSettings: { enabled: false, autoCalculate: true, showInSummary: true },
        classTestStatuses, gradeOverrides, lessonTopics, scheduleLessons, substitutions,
      });
      bagrutExclusionsRef.current = bagrutExclusions;
      realtimeEventLogRef.current
        .filter(entry => entry.sequence > startRealtimeSequence && entry.ownerEmail === requestOwner)
        .forEach(entry => replayRealtimeEventRef.current?.(entry.entityName, entry.event, true));
      loadedOwnerRef.current = requestOwner;
      setLoading(false);
      return true;
      } catch (error) {
        if (!isCurrentRequest()) return false;
        console.error('Failed to load data:', error);
        setLoadError(error);
        setLoading(false);
        return false;
      }
    })();
    const requestRecord = { key: requestKey, generation, promise: request };
    loadPromiseRef.current = requestRecord;
    try {
      return await request;
    } finally {
      if (loadPromiseRef.current === requestRecord) loadPromiseRef.current = null;
    }
  }, [ownerEmail]);

  useEffect(() => {
    let retryTimer = null;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 3;
    const boot = async () => {
      if (cancelled) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setLoadError(new Error('offline'));
        setLoading(false);
        loadedOwnerRef.current = '';
        return;
      }
      attempts += 1;
      const ok = await loadAll();
      if (!ok && !cancelled && attempts < maxAttempts) {
        const delay = 1000 * (2 ** (attempts - 1)) + Math.floor(Math.random() * 300);
        retryTimer = setTimeout(boot, delay);
      } else if (!ok) {
        loadedOwnerRef.current = '';
      }
    };
    const retryWhenOnline = () => {
      if (cancelled || loadedOwnerRef.current === ownerEmail) return;
      attempts = 0;
      loadedOwnerRef.current = ownerEmail;
      boot();
    };
    if (typeof window !== 'undefined') window.addEventListener('online', retryWhenOnline);
    if (isAuthenticated && ownerEmail && loadedOwnerRef.current !== ownerEmail) {
      loadedOwnerRef.current = ownerEmail;
      boot();
    } else if (!isAuthenticated) {
      loadedOwnerRef.current = '';
      loadGenerationRef.current += 1;
      loadPromiseRef.current = null;
      realtimeEventLogRef.current = [];
      bagrutExclusionsRef.current = [];
      teacherSettingsRowsRef.current = [];
      setData({ ...DEFAULT_DATA });
      setLoadError(null);
      setLoading(false);
      resetSettingsRuntime(setDefaultGenderTrack);
    }
    return () => {
      cancelled = true;
      loadGenerationRef.current += 1;
      if (retryTimer) clearTimeout(retryTimer);
      if (typeof window !== 'undefined') window.removeEventListener('online', retryWhenOnline);
    };
  }, [isAuthenticated, loadAll, ownerEmail]);

  const applyRealtimeEvent = useCallback(async (entityName, event, isReplay = false) => {
    if (!event?.id || !ownerEmailRef.current) return;
    const eventOwner = ownerEmailRef.current;
    const isDelete = event.type === 'delete';
    let row = event.data;

    if (!isReplay && !isDelete && row?._oversize) {
      try {
        row = await base44.entities[entityName].get(event.id);
      } catch (error) {
        console.error(`Failed to hydrate oversized ${entityName} realtime event:`, error);
        if (ownerEmailRef.current === eventOwner) {
          void loadAll({ seedDefaults: false, force: true });
        }
        return;
      }
    }
    if (ownerEmailRef.current !== eventOwner || (!isDelete && !row)) return;

    const resolvedEvent = { ...event, data: row };
    if (!isReplay) {
      const sequence = ++realtimeSequenceRef.current;
      realtimeEventLogRef.current = [
        ...realtimeEventLogRef.current.slice(-499),
        { sequence, ownerEmail: eventOwner, entityName, event: resolvedEvent },
      ];
    }

    if (entityName === 'TeacherSettings') {
      teacherSettingsRowsRef.current = isDelete
        ? teacherSettingsRowsRef.current.filter(item => item.id !== event.id)
        : upsertById(teacherSettingsRowsRef.current, row);
      applySettingsRuntime(mergeTeacherSettings(teacherSettingsRowsRef.current), setDefaultGenderTrack);
    }

    setData(current => {
      const remove = key => current[key].filter(item => item.id !== resolvedEvent.id);
      if (entityName === 'BagrutComponent') {
        const raw = bagrutExclusionsRef.current;
        const nextRaw = isDelete
          ? raw.filter(item => item.id !== resolvedEvent.id)
          : upsertById(raw, { id: resolvedEvent.id, name: row.name, genderTrack: row.gender_track, isRequired: row.is_required });
        bagrutExclusionsRef.current = nextRaw;
        const exclusions = nextRaw.filter(item => item.isRequired === false);
        return { ...current, bagrutComponents: buildBagrutComponentsFromTests(current.tests, exclusions) };
      }

      const definitions = {
        SchoolClass: ['classes', mapClass],
        Student: ['students', mapStudent],
        TestResult: ['results', mapResult],
        BehaviorGrade: ['behaviorGrades', mapBehavior],
        ClassTestStatus: ['classTestStatuses', mapClassStatus],
        LessonTopic: ['lessonTopics', mapLessonTopic],
        TeacherSchedule: ['scheduleLessons', mapSchedule],
        Substitution: ['substitutions', mapSubstitution],
        TestAttempt: ['testAttempts', mapAttempt],
        GradeOverride: ['gradeOverrides', mapGradeOverride],
        BagrutResult: ['bagrutResults', mapBagrutResult],
      };

      if (entityName === 'TeacherSettings') {
        return { ...current, settings: mapSettings(mergeTeacherSettings(teacherSettingsRowsRef.current)) };
      }

      if (entityName === 'TestDefinition') {
        const tests = isDelete ? remove('tests') : upsertById(current.tests, mapTest(row));
        const bagrutComponents = buildBagrutComponentsFromTests(tests, bagrutExclusionsRef.current);
        return { ...current, tests, bagrutComponents };
      }

      const definition = definitions[entityName];
      if (!definition || (!isDelete && !row)) return current;
      const [key, mapper] = definition;
      return {
        ...current,
        [key]: isDelete ? remove(key) : upsertById(current[key], mapper(row)),
      };
    });
  }, [loadAll]);
  replayRealtimeEventRef.current = applyRealtimeEvent;

  // --- Realtime subscriptions (incremental cross-session sync) ---
  useEffect(() => {
    if (!isAuthenticated || !ownerEmail) return;
    const subscriptionOwner = ownerEmail;
    const entitiesToWatch = [
      'SchoolClass', 'Student', 'TestResult', 'BehaviorGrade',
      'ClassTestStatus', 'LessonTopic', 'TeacherSchedule', 'Substitution',
      'TeacherSettings', 'TestDefinition', 'TestAttempt', 'GradeOverride',
      'BagrutComponent', 'BagrutResult',
    ];
    const unsubs = entitiesToWatch.map(name => {
      try {
        return base44.entities[name]?.subscribe?.(event => {
          if (ownerEmailRef.current !== subscriptionOwner) return;
          void applyRealtimeEvent(name, event);
        });
      } catch { return null; }
    });
    return () => {
      unsubs.forEach(fn => fn && fn());
    };
  }, [applyRealtimeEvent, isAuthenticated, ownerEmail]);

  // --- Classes ---
  const addClass = useCallback(async (classData, gradeLevel, genderTrack) => {
    const email = requireOwnerEmail(ownerEmail, 'להוספת כיתה');
    const payloadData = typeof classData === 'object'
      ? classData
      : { name: classData, gradeLevel, genderTrack, status: 'active' };
    const homeroomContacts = Array.isArray(payloadData.homeroomContacts)
      ? payloadData.homeroomContacts
      : payloadData.homeroomTeacher
        ? [{ id: 'educator_0', name: String(payloadData.homeroomTeacher).trim(), phone: '' }]
        : [];
    const created = await base44.entities.SchoolClass.create({
      name: payloadData.name,
      owner_email: email,
      grade_level: payloadData.gradeLevel || null,
      gender_track: payloadData.genderTrack || defaultGenderTrack,
      homeroom_teacher: payloadData.homeroomTeacher || '',
      student_count: payloadData.studentCount || 0,
      notes: payloadData.notes || '',
      status: payloadData.status || 'active',
      homeroom_contacts: homeroomContacts,
    });
    setData(d => ({ ...d, classes: upsertById(d.classes, mapClass(created)) }));
    return created.id;
  }, [defaultGenderTrack, ownerEmail]);

  const deleteClass = useCallback(async (id) => {
    let studentIds = [];
    let classTestIds = [];
    try {
    const [remoteStudents, remoteClassTests] = await Promise.all([
      filterAll(base44.entities.Student, { class_id: id }),
      filterAll(base44.entities.TestDefinition, { class_id: id }),
    ]);
    studentIds = remoteStudents.map(student => student.id);
    classTestIds = remoteClassTests.map(test => test.id);
    if (studentIds.length > 0) {
      await Promise.all([
        base44.entities.TestResult.deleteMany({ student_id: { $in: studentIds } }),
        base44.entities.BehaviorGrade.deleteMany({ student_id: { $in: studentIds } }),
        base44.entities.BagrutResult.deleteMany({ student_id: { $in: studentIds } }),
        base44.entities.TestAttempt.deleteMany({ student_id: { $in: studentIds } }),
        base44.entities.GradeOverride.deleteMany({ student_id: { $in: studentIds } }),
        base44.entities.RunMeasurement.deleteMany({ student_id: { $in: studentIds } }),
        base44.entities.PeStopwatchLog.deleteMany({ student_id: { $in: studentIds } }),
      ]);
      await base44.entities.Student.deleteMany({ class_id: id });
    }
    if (classTestIds.length > 0) {
      await Promise.all([
        base44.entities.TestResult.deleteMany({ test_id: { $in: classTestIds } }),
        base44.entities.TestAttempt.deleteMany({ test_id: { $in: classTestIds } }),
        base44.entities.ClassTestStatus.deleteMany({ test_id: { $in: classTestIds } }),
        base44.entities.BagrutResult.deleteMany({ component_id: { $in: classTestIds } }),
      ]);
      await base44.entities.TestDefinition.deleteMany({ class_id: id });
    }
    await Promise.all([
      base44.entities.LessonTopic.deleteMany({ class_id: id }),
      base44.entities.TeacherSchedule.deleteMany({ class_id: id }),
      base44.entities.ClassTestStatus.deleteMany({ class_id: id }),
      base44.entities.GradeOverride.deleteMany({ class_id: id }),
      base44.entities.RunMeasurement.deleteMany({ class_id: id }),
      base44.entities.PeStopwatchLog.deleteMany({ class_id: id }),
      base44.entities.Substitution.deleteMany({ original_class_id: id }),
      base44.entities.Substitution.deleteMany({ substitute_class_id: id }),
      base44.entities.SubstituteFill.deleteMany({ class_id: id }),
    ]);
    await base44.entities.SchoolClass.delete(id);
    setData(d => ({
      ...d,
      classes: d.classes.filter(c => c.id !== id),
      students: d.students.filter(s => s.classId !== id),
      results: d.results.filter(r => !studentIds.includes(r.studentId) && !classTestIds.includes(r.testId)),
      behaviorGrades: d.behaviorGrades.filter(b => !studentIds.includes(b.studentId)),
      bagrutResults: d.bagrutResults.filter(r => !studentIds.includes(r.studentId) && !classTestIds.includes(r.componentId)),
      testAttempts: d.testAttempts.filter(a => !studentIds.includes(a.studentId) && !classTestIds.includes(a.testId)),
      gradeOverrides: d.gradeOverrides.filter(o => o.classId !== id && !studentIds.includes(o.studentId)),
      lessonTopics: d.lessonTopics.filter(l => l.classId !== id),
      scheduleLessons: d.scheduleLessons.filter(l => l.classId !== id),
      classTestStatuses: d.classTestStatuses.filter(s => s.classId !== id && !classTestIds.includes(s.testId)),
      tests: d.tests.filter(test => test.classId !== id),
      substitutions: d.substitutions.filter(s => s.originalClassId !== id && s.substituteClassId !== id),
    }));
    } catch (error) {
      await loadAll({ seedDefaults: false, force: true });
      throw new Error('מחיקת הכיתה לא הושלמה במלואה. הנתונים נטענו מחדש; נסו שוב.', { cause: error });
    }
  }, [loadAll]);

  const editClass = useCallback(async (id, classData, gradeLevel, genderTrack) => {
    const payloadData = typeof classData === 'object'
      ? classData
      : { name: classData, gradeLevel, genderTrack };
    const existing = data.classes.find(item => item.id === id);
    if (!existing) throw new Error('הכיתה לא נמצאה');
    const hasOwn = key => Object.prototype.hasOwnProperty.call(payloadData, key);
    const homeroomTeacher = hasOwn('homeroomTeacher')
      ? String(payloadData.homeroomTeacher || '').trim()
      : existing.homeroomTeacher;
    let homeroomContacts = hasOwn('homeroomContacts')
      ? (payloadData.homeroomContacts || [])
      : (existing.homeroomContacts || []);
    homeroomContacts = homeroomContacts.map((contact, index) => ({
      id: contact.id || `educator_${index}`,
      name: String(contact.name || '').trim(),
      phone: String(contact.phone || '').trim(),
    }));
    if (hasOwn('homeroomTeacher')) {
      if (homeroomTeacher && homeroomContacts.length > 0) {
        homeroomContacts = [{ ...homeroomContacts[0], name: homeroomTeacher }, ...homeroomContacts.slice(1)];
      } else if (homeroomTeacher) {
        homeroomContacts = [{ id: 'educator_0', name: homeroomTeacher, phone: '' }];
      } else if (homeroomContacts[0]?.name === existing.homeroomTeacher) {
        homeroomContacts = homeroomContacts.slice(1);
      }
    }
    const saved = await base44.entities.SchoolClass.update(id, {
      name: hasOwn('name') ? payloadData.name : existing.name,
      grade_level: hasOwn('gradeLevel') ? (payloadData.gradeLevel || null) : (existing.gradeLevel || null),
      gender_track: hasOwn('genderTrack') ? payloadData.genderTrack : existing.genderTrack,
      homeroom_teacher: homeroomTeacher,
      homeroom_contacts: homeroomContacts,
      notes: hasOwn('notes') ? (payloadData.notes || '') : existing.notes,
      status: hasOwn('status') ? payloadData.status : existing.status,
    });
    setData(d => ({ ...d, classes: upsertById(d.classes, mapClass(saved)) }));
  }, [data.classes]);

  const updateHomeroomContacts = useCallback(async (classId, contacts) => {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') throw new Error('רק מנהל יכול לערוך את פרטי המחנכים');
    const normalized = (contacts || []).map((contact, index) => ({
      id: contact.id || `educator_${index}`,
      name: String(contact.name || '').trim(),
      phone: String(contact.phone || '').trim(),
    }));
    const saved = await base44.entities.SchoolClass.update(classId, {
      homeroom_contacts: normalized,
      homeroom_teacher: normalized[0]?.name || '',
    });
    setData(d => ({ ...d, classes: upsertById(d.classes, mapClass(saved)) }));
  }, []);

  const archiveClass = useCallback(async (id) => {
    const saved = await base44.entities.SchoolClass.update(id, { status: 'archived' });
    setData(d => ({ ...d, classes: upsertById(d.classes, mapClass(saved)) }));
  }, []);

  const restoreClass = useCallback(async (id) => {
    const saved = await base44.entities.SchoolClass.update(id, { status: 'active' });
    setData(d => ({ ...d, classes: upsertById(d.classes, mapClass(saved)) }));
  }, []);

  const duplicateClass = useCallback(async (id) => {
    const source = data.classes.find(c => c.id === id);
    if (!source) return null;
    return addClass({
      name: `${source.name} - עותק`,
      gradeLevel: source.gradeLevel,
      genderTrack: source.genderTrack,
      homeroomTeacher: source.homeroomTeacher,
      homeroomContacts: (source.homeroomContacts || []).map(contact => ({ ...contact })),
      notes: source.notes,
      status: 'active',
    });
  }, [addClass, data.classes]);

  // --- Students ---
  const addStudent = useCallback(async (studentData, classId) => {
    const email = requireOwnerEmail(ownerEmail, 'להוספת תלמיד/ה');
    const source = typeof studentData === 'object' ? studentData : { name: studentData, classId };
    const targetClassId = source.classId || classId;
    const targetClass = data.classes.find(cls => cls.id === targetClassId);
    const payload = buildStudentPayload(source, {
      classId: targetClassId,
      fallbackGender: targetClass?.genderTrack || defaultGenderTrack,
      ownerEmail: email,
    });
    const created = await base44.entities.Student.create(payload);
    setData(d => ({ ...d, students: upsertById(d.students, mapStudent(created)) }));
    return created.id;
  }, [data.classes, defaultGenderTrack, ownerEmail]);

  const deleteStudent = useCallback(async (id) => {
    try {
    await Promise.all([
      base44.entities.TestResult.deleteMany({ student_id: id }),
      base44.entities.BehaviorGrade.deleteMany({ student_id: id }),
      base44.entities.BagrutResult.deleteMany({ student_id: id }),
      base44.entities.TestAttempt.deleteMany({ student_id: id }),
      base44.entities.GradeOverride.deleteMany({ student_id: id }),
      base44.entities.RunMeasurement.deleteMany({ student_id: id }),
      base44.entities.PeStopwatchLog.deleteMany({ student_id: id }),
    ]);
    await base44.entities.Student.delete(id);
    setData(d => ({
      ...d,
      students: d.students.filter(s => s.id !== id),
      results: d.results.filter(r => r.studentId !== id),
      behaviorGrades: d.behaviorGrades.filter(r => r.studentId !== id),
      bagrutResults: d.bagrutResults.filter(r => r.studentId !== id),
      testAttempts: d.testAttempts.filter(r => r.studentId !== id),
      gradeOverrides: d.gradeOverrides.filter(r => r.studentId !== id),
    }));
    } catch (error) {
      await loadAll({ seedDefaults: false, force: true });
      throw new Error('מחיקת התלמיד/ה לא הושלמה במלואה. הנתונים נטענו מחדש; נסו שוב.', { cause: error });
    }
  }, [loadAll]);

  const editStudent = useCallback(async (id, studentData, peExempt, subClassName) => {
    const email = requireOwnerEmail(ownerEmail, 'לעריכת תלמיד/ה');
    const payloadData = typeof studentData === 'object' ? studentData : { name: studentData, peExempt, subClassName };
    const existing = data.students.find(student => student.id === id);
    if (!existing) throw new Error('התלמיד/ה לא נמצא/ה');
    const targetClassId = payloadData.classId || existing.classId;
    const targetClass = data.classes.find(cls => cls.id === targetClassId);
    const payload = buildStudentPayload(payloadData, {
      existing,
      classId: targetClassId,
      fallbackGender: targetClass?.genderTrack || defaultGenderTrack,
      ownerEmail: email,
    });
    const saved = await base44.entities.Student.update(id, payload);
    setData(d => ({ ...d, students: upsertById(d.students, mapStudent(saved)) }));
  }, [data.classes, data.students, defaultGenderTrack, ownerEmail]);

  const importStudents = useCallback(async (items, classId) => {
    const email = requireOwnerEmail(ownerEmail, 'לייבוא תלמידים');
    const seen = new Set(data.students.map(s => studentDedupeKey(s.name, s.classId)));
    const payloads = items.map(item => {
      const payloadData = typeof item === 'object' ? item : { name: item };
      const targetClassId = payloadData.classId || classId;
      const targetClass = data.classes.find(cls => cls.id === targetClassId);
      let payload;
      try {
        payload = buildStudentPayload(payloadData, {
          classId: targetClassId,
          fallbackGender: targetClass?.genderTrack || defaultGenderTrack,
          ownerEmail: email,
        });
      } catch {
        return null;
      }
      const key = studentDedupeKey(payload.name, targetClassId);
      if (seen.has(key)) return null;
      seen.add(key);
      return payload;
    }).filter(Boolean);
    if (payloads.length === 0) return { added: 0, updated: 0, skipped: items.length, errors: [] };
    const created = await base44.entities.Student.bulkCreate(payloads);
    setData(d => ({
      ...d,
      students: created.reduce((itemsSoFar, row) => upsertById(itemsSoFar, mapStudent(row)), d.students),
    }));
    return { added: payloads.length, updated: 0, skipped: items.length - payloads.length, errors: [] };
  }, [data.classes, data.students, defaultGenderTrack, ownerEmail]);

  // --- Tests ---
  const addTest = useCallback(async (test) => {
    const created = await base44.entities.TestDefinition.create({
      name: test.name, test_type: test.testType || 'other', weight: test.weight,
      grade_level: test.gradeLevel, class_id: test.classId || '', gender_track: test.genderTrack || 'boys',
      semester: test.semester || undefined, test_date: test.testDate || undefined, unit: test.unit || '',
      conversion_table: test.conversionTable,
    });
    setData(d => ({ ...d, tests: upsertById(d.tests, mapTest(created)) }));
  }, []);

  const updateTest = useCallback(async (test) => {
    const saved = await enqueueMutation(`test:${test.id}`, () => base44.entities.TestDefinition.update(test.id, {
      name: test.name, test_type: test.testType || 'other', weight: test.weight,
      grade_level: test.gradeLevel, class_id: test.classId || '', gender_track: test.genderTrack,
      semester: test.semester || undefined, test_date: test.testDate || undefined, unit: test.unit || '',
      conversion_table: test.conversionTable,
    }));
    setData(d => ({ ...d, tests: upsertById(d.tests, mapTest(saved)) }));
  }, []);

  const deleteTest = useCallback(async (id) => {
    try {
    await Promise.all([
      base44.entities.TestResult.deleteMany({ test_id: id }),
      base44.entities.TestAttempt.deleteMany({ test_id: id }),
      base44.entities.ClassTestStatus.deleteMany({ test_id: id }),
      base44.entities.BagrutResult.deleteMany({ component_id: id }),
    ]);
    await base44.entities.TestDefinition.delete(id);
    setData(d => ({
      ...d,
      tests: d.tests.filter(t => t.id !== id),
      results: d.results.filter(r => r.testId !== id),
      testAttempts: d.testAttempts.filter(r => r.testId !== id),
      classTestStatuses: d.classTestStatuses.filter(r => r.testId !== id),
      bagrutResults: d.bagrutResults.filter(r => r.componentId !== id),
    }));
    } catch (error) {
      await loadAll({ seedDefaults: false, force: true });
      throw new Error('מחיקת המבדק לא הושלמה במלואה. הנתונים נטענו מחדש; נסו שוב.', { cause: error });
    }
  }, [loadAll]);

  // --- Test Results ---
  const setTestResult = useCallback(async (studentId, testId, semester, rawScore, status, metadata = {}) => {
    const lookup = { student_id: studentId, test_id: testId, semester };
    if (metadata.test_date) lookup.test_date = metadata.test_date;
    const { result: saved, attempt: savedAttempt } = await enqueueMutation(`result:${studentId}:${testId}:${semester}:${metadata.test_date || ''}`, async () => {
      const allExisting = await base44.entities.TestResult.filter(lookup);
      const canonical = allExisting[0] || null;
      const canRecordAttempt = status === 'completed' && rawScore !== null && rawScore !== undefined;
      const attempts = canRecordAttempt
        ? await base44.entities.TestAttempt.filter({ student_id: studentId, test_id: testId, semester })
        : [];
      const valueChanged = !canonical || canonical.raw_score !== rawScore || canonical.status !== status;
      const missingRecordedAttempt = canRecordAttempt
        && canonical
        && Number(canonical.attempt_count || 0) > attempts.length;
      const sameLiveRunAttempt = metadata.live_run_id
        ? attempts.find(attempt => attempt.live_run_id === metadata.live_run_id)
        : null;
      const shouldRecordAttempt = canRecordAttempt
        && !sameLiveRunAttempt
        && (valueChanged || missingRecordedAttempt || Boolean(metadata.live_run_id));
      const attemptCount = sameLiveRunAttempt
        ? Number(canonical?.attempt_count || sameLiveRunAttempt.attempt_number || 1)
        : missingRecordedAttempt
        ? Number(canonical.attempt_count)
        : shouldRecordAttempt
          ? Math.max(attempts.length, Number(canonical?.attempt_count || 0)) + 1
          : Number(canonical?.attempt_count || 1);
      const payload = { student_id: studentId, test_id: testId, semester, raw_score: rawScore, status, attempt_count: attemptCount, ...metadata };
      const result = canonical
        ? await base44.entities.TestResult.update(canonical.id, payload)
        : await base44.entities.TestResult.create(payload);
      if (allExisting.length > 1) {
        await Promise.all(allExisting.slice(1).map(row => base44.entities.TestResult.delete(row.id)));
      }
      let attempt = null;
      if (sameLiveRunAttempt && canRecordAttempt && Number(sameLiveRunAttempt.raw_score) !== Number(rawScore)) {
        attempt = await base44.entities.TestAttempt.update(sameLiveRunAttempt.id, {
          raw_score: rawScore,
          attempt_number: sameLiveRunAttempt.attempt_number || attemptCount,
        });
      } else if (shouldRecordAttempt) {
        attempt = await base44.entities.TestAttempt.create({
          student_id: studentId,
          test_id: testId,
          semester,
          raw_score: rawScore,
          attempt_number: attemptCount,
          live_run_id: metadata.live_run_id || '',
        });
      }
      return { result: { ...result, attempt_count: attemptCount }, attempt };
    });
    setData(d => {
      const filtered = d.results.filter(r => {
        const sameBase = r.studentId === studentId && r.testId === testId && r.semester === semester;
        if (!sameBase) return true;
        return metadata.test_date ? r.testDate !== metadata.test_date : Boolean(r.testDate);
      });
      return {
        ...d,
        results: upsertById(filtered, mapResult(saved)),
        testAttempts: savedAttempt
          ? upsertById(d.testAttempts, mapAttempt(savedAttempt))
          : d.testAttempts,
      };
    });
  }, []);

  // --- Behavior Grades ---
  const setBehaviorGrade = useCallback(async (studentId, quarter, grade) => {
    const saved = await enqueueMutation(`behavior:${studentId}:${quarter}`, async () => {
      const existing = await base44.entities.BehaviorGrade.filter({ student_id: studentId, quarter });
      if (grade === null) {
        await Promise.all(existing.map(row => base44.entities.BehaviorGrade.delete(row.id)));
        return null;
      } else if (existing.length > 0) {
        const result = await base44.entities.BehaviorGrade.update(existing[0].id, { grade });
        await Promise.all(existing.slice(1).map(row => base44.entities.BehaviorGrade.delete(row.id)));
        return result;
      }
      return base44.entities.BehaviorGrade.create({ student_id: studentId, quarter, grade });
    });
    setData(d => {
      const filtered = d.behaviorGrades.filter(b => !(b.studentId === studentId && b.quarter === quarter));
      return { ...d, behaviorGrades: saved ? upsertById(filtered, mapBehavior(saved)) : filtered };
    });
  }, []);

  // --- Class Test Status ---
  const setClassTestStatus = useCallback(async (classId, testId, semester, status) => {
    const saved = await enqueueMutation(`test-status:${classId}:${testId}:${semester}`, async () => {
      const existing = await base44.entities.ClassTestStatus.filter({ class_id: classId, test_id: testId, semester });
      if (existing.length > 0) {
        const result = await base44.entities.ClassTestStatus.update(existing[0].id, { status });
        await Promise.all(existing.slice(1).map(row => base44.entities.ClassTestStatus.delete(row.id)));
        return result;
      }
      return base44.entities.ClassTestStatus.create({ class_id: classId, test_id: testId, semester, status });
    });
    setData(d => {
      const filtered = d.classTestStatuses.filter(s => !(s.classId === classId && s.testId === testId && s.semester === semester));
      return { ...d, classTestStatuses: upsertById(filtered, mapClassStatus(saved)) };
    });
  }, []);

  // --- Grade Overrides ---
  const setGradeOverride = useCallback(async (studentId, classId, overrideType, grade) => {
    const saved = await enqueueMutation(`grade-override:${studentId}:${classId}:${overrideType}`, async () => {
      const existing = await base44.entities.GradeOverride.filter({ student_id: studentId, class_id: classId, override_type: overrideType });
      if (grade === null) {
        await Promise.all(existing.map(row => base44.entities.GradeOverride.delete(row.id)));
        return null;
      }
      if (existing.length > 0) {
        const result = await base44.entities.GradeOverride.update(existing[0].id, { grade });
        await Promise.all(existing.slice(1).map(row => base44.entities.GradeOverride.delete(row.id)));
        return result;
      }
      return base44.entities.GradeOverride.create({ student_id: studentId, class_id: classId, override_type: overrideType, grade });
    });
    setData(d => {
      const filtered = d.gradeOverrides.filter(o => !(o.studentId === studentId && o.classId === classId && o.overrideType === overrideType));
      return { ...d, gradeOverrides: saved ? upsertById(filtered, mapGradeOverride(saved)) : filtered };
    });
  }, []);

  // --- Settings ---
  const updateSettings = useCallback(async (newSettings) => {
    const { existing, saved } = await enqueueMutation(`teacher-settings:${ownerEmail}`, async () => {
      const rows = await listOwnSettings();
      const current = mergeTeacherSettings(rows);
      const payload = {
        penalty_score: clampScore(newSettings.penaltyScore, 15),
        auto_convert_missing: Boolean(newSettings.autoConvertMissing),
        completion_penalty_factor: clampUnit(newSettings.completionPenaltyFactor, 0),
        min_completed_grade: clampScore(newSettings.minCompletedGrade, 56),
        grade_color_thresholds: {
          redBelow: clampScore(newSettings.gradeColorThresholds?.redBelow, 55),
          greenAt: clampScore(newSettings.gradeColorThresholds?.greenAt, 100),
        },
        teacher_name: newSettings.teacherName === undefined
          ? String(current?.teacher_name || '').trim()
          : String(newSettings.teacherName || '').trim(),
        school_name: newSettings.schoolName === undefined
          ? String(current?.school_name || '').trim()
          : String(newSettings.schoolName || '').trim(),
        default_semester: newSettings.defaultSemester === undefined
          ? (current?.default_semester === 'B' ? 'B' : 'A')
          : (newSettings.defaultSemester === 'B' ? 'B' : 'A'),
        defaults_seeded: true,
      };
      const saved = current
        ? await base44.entities.TeacherSettings.update(current.id, payload)
        : await base44.entities.TeacherSettings.create(payload);
      return { existing: rows, saved };
    });
    const knownRows = existing.reduce((rows, row) => upsertById(rows, row), teacherSettingsRowsRef.current);
    teacherSettingsRowsRef.current = upsertById(knownRows, saved);
    const merged = mergeTeacherSettings(teacherSettingsRowsRef.current);
    applySettingsRuntime(merged, setDefaultGenderTrack);
    setData(d => ({
      ...d,
      settings: mapSettings(merged),
    }));
  }, [listOwnSettings, ownerEmail]);

  const updateDefaultGenderTrack = useCallback(async (track) => {
    const { existing, saved } = await enqueueMutation(`teacher-settings:${ownerEmail}`, async () => {
      const rows = await listOwnSettings();
      const current = mergeTeacherSettings(rows);
      const result = current
        ? await base44.entities.TeacherSettings.update(current.id, { default_gender_track: track })
        : await base44.entities.TeacherSettings.create({ default_gender_track: track });
      return { existing: rows, saved: result };
    });
    const knownRows = existing.reduce((rows, row) => upsertById(rows, row), teacherSettingsRowsRef.current);
    teacherSettingsRowsRef.current = upsertById(knownRows, saved);
    const merged = mergeTeacherSettings(teacherSettingsRowsRef.current);
    applySettingsRuntime(merged, setDefaultGenderTrack);
    setData(d => ({ ...d, settings: mapSettings(merged) }));
  }, [listOwnSettings, ownerEmail]);

  const updateBellSchedule = useCallback(async (bellSchedule) => {
    const { existing, saved } = await enqueueMutation(`teacher-settings:${ownerEmail}`, async () => {
      const rows = await listOwnSettings();
      const current = mergeTeacherSettings(rows);
      const result = current
        ? await base44.entities.TeacherSettings.update(current.id, { bell_schedule: bellSchedule })
        : await base44.entities.TeacherSettings.create({ bell_schedule: bellSchedule });
      return { existing: rows, saved: result };
    });
    const knownRows = existing.reduce((rows, row) => upsertById(rows, row), teacherSettingsRowsRef.current);
    teacherSettingsRowsRef.current = upsertById(knownRows, saved);
    const merged = mergeTeacherSettings(teacherSettingsRowsRef.current);
    applySettingsRuntime(merged, setDefaultGenderTrack);
    setData(d => ({ ...d, settings: mapSettings(merged) }));
  }, [listOwnSettings, ownerEmail]);

  // --- Bagrut Results ---
  const setBagrutResult = useCallback(async (studentId, componentId, score, status, notes, rawScore) => {
    const shouldDelete = rawScore === null || rawScore === undefined || String(rawScore).trim() === '';
    const normalizedRawScore = shouldDelete ? null : Number(rawScore);
    if (!shouldDelete && (!Number.isFinite(normalizedRawScore) || normalizedRawScore < 0 || normalizedRawScore > 1_000_000)) {
      throw new Error('תוצאת הבגרות חייבת להיות מספר תקין');
    }
    const hasScore = score !== null && score !== undefined && String(score).trim() !== '';
    const normalizedScore = hasScore ? Number(score) : undefined;
    if (hasScore && (!Number.isFinite(normalizedScore) || normalizedScore < 0 || normalizedScore > 100)) {
      throw new Error('ציון הבגרות חייב להיות בין 0 ל-100');
    }
    const saved = await enqueueMutation(`bagrut:${studentId}:${componentId}`, async () => {
      const existing = await base44.entities.BagrutResult.filter({ student_id: studentId, component_id: componentId });
      if (shouldDelete) {
        await Promise.all(existing.map(row => base44.entities.BagrutResult.delete(row.id)));
        return null;
      }
      const payload = {
        student_id: studentId,
        component_id: componentId,
        status,
        notes: notes || '',
        raw_score: normalizedRawScore,
        ...(hasScore ? { score: normalizedScore } : {}),
      };
      if (existing.length > 0) {
        const result = await base44.entities.BagrutResult.update(existing[0].id, payload);
        await Promise.all(existing.slice(1).map(row => base44.entities.BagrutResult.delete(row.id)));
        return result;
      }
      return base44.entities.BagrutResult.create(payload);
    });
    setData(d => {
      const filtered = d.bagrutResults.filter(r => !(r.studentId === studentId && r.componentId === componentId));
      return {
        ...d,
        bagrutResults: saved ? upsertById(filtered, mapBagrutResult(saved)) : filtered,
      };
    });
  }, []);

  const setBagrutTestIncluded = useCallback(async (name, genderTrack, included) => {
    const saved = await enqueueMutation(`bagrut-inclusion:${genderTrack}:${name}`, async () => {
      const existing = await base44.entities.BagrutComponent.filter({ name, gender_track: genderTrack });
      let result = null;
      if (existing.length > 0) {
        result = await base44.entities.BagrutComponent.update(existing[0].id, { is_required: included });
        await Promise.all(existing.slice(1).map(row => base44.entities.BagrutComponent.delete(row.id)));
      } else if (!included) {
        result = await base44.entities.BagrutComponent.create({ name, gender_track: genderTrack, is_required: false });
      }
      return result;
    });
    const withoutSemanticDuplicates = bagrutExclusionsRef.current.filter(item => (
      item.name !== name || item.genderTrack !== genderTrack
    ));
    bagrutExclusionsRef.current = saved
      ? upsertById(withoutSemanticDuplicates, {
        id: saved.id,
        name: saved.name || name,
        genderTrack: saved.gender_track || genderTrack,
        isRequired: saved.is_required ?? included,
      })
      : withoutSemanticDuplicates;
    setData(d => ({
      ...d,
      bagrutComponents: buildBagrutComponentsFromTests(
        d.tests,
        bagrutExclusionsRef.current.filter(item => item.isRequired === false)
      ),
    }));
  }, []);

  // --- Schedule Import (PE lessons only) ---
  const importSchedule = useCallback(async (lessons) => {
    const email = requireOwnerEmail(ownerEmail, 'לייבוא מערכת שעות');
    const existingClassByKey = new Map(data.classes.map(c => [normalizeClassName(c.name), c]));
    const existingKeys = new Set(
      data.scheduleLessons.map(l => l.classId
        ? scheduleDedupeKey(l.dayOfWeek, l.period, l.classId)
        : scheduleDedupeKey(l.dayOfWeek, l.period, normalizeClassName(`${l.subject}|${l.className}`)))
    );

    let classesCreated = 0;
    const newClasses = [];
    const newScheduleRows = [];

    try {
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
        const gradeLevel = [...GRADE_LEVELS].sort((a, b) => b.length - a.length).find(g => lesson.className.trim().startsWith(g)) || null;
        const genderTrack = /בנות/.test(lesson.className) ? 'girls' : 'boys';
        const created = await base44.entities.SchoolClass.create({
          name: lesson.className, owner_email: email, grade_level: gradeLevel, gender_track: genderTrack,
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
        classes: newClasses.reduce((items, row) => upsertById(items, row), d.classes),
        scheduleLessons: created.reduce((items, row) => upsertById(items, mapSchedule(row)), d.scheduleLessons),
      }));

      return { classesCreated, lessonsSaved: created.length, duplicatesSkipped: lessons.length - created.length };
    } catch (error) {
      await Promise.allSettled(newClasses.map(cls => base44.entities.SchoolClass.delete(cls.id)));
      await loadAll({ seedDefaults: false, force: true });
      throw error;
    }
  }, [data.classes, data.scheduleLessons, loadAll, ownerEmail]);

  // --- Delete All ---
  const deleteAllData = useCallback(async () => {
    const email = requireOwnerEmail(ownerEmail, 'למחיקת נתונים');
    try {
    const entities = [
      base44.entities.TestResult, base44.entities.BehaviorGrade,
      base44.entities.ClassTestStatus, base44.entities.GradeOverride,
      base44.entities.TestAttempt, base44.entities.BagrutResult,
      base44.entities.LessonTopic, base44.entities.TeacherSchedule,
      base44.entities.RunMeasurement, base44.entities.PeStopwatchLog,
      base44.entities.Substitution, base44.entities.SubstituteFill,
      base44.entities.BagrutComponent,
      base44.entities.TestDefinition,
      base44.entities.TeacherSettings,
      base44.entities.WizardConfig,
    ];
    for (const entity of entities) {
      await entity.deleteMany({ created_by: email });
    }
    await base44.entities.Student.deleteMany({ owner_email: email });
    await base44.entities.SchoolClass.deleteMany({ owner_email: email });
    await Promise.all([
      base44.entities.PushSubscription.deleteMany({ created_by: email }),
      base44.entities.SentReminder.deleteMany({ created_by: email }),
    ]);
    // The authenticated User row and onboarding_completed flag intentionally survive a data reset.
    const settingsRow = await base44.entities.TeacherSettings.create({ defaults_seeded: true });
    teacherSettingsRowsRef.current = [settingsRow];
    bagrutExclusionsRef.current = [];
    setData({ ...DEFAULT_DATA });
    resetSettingsRuntime(setDefaultGenderTrack);
    await loadAll({ seedDefaults: false, force: true });
    } catch (error) {
      await loadAll({ seedDefaults: false, force: true });
      throw new Error('מחיקת כל הנתונים לא הושלמה במלואה. המצב העדכני נטען מחדש; נסו שוב.', { cause: error });
    }
  }, [loadAll, ownerEmail]);

  // --- Lesson Topics ---
  const saveLessonTopic = useCallback(async (classId, date, period, topic) => {
    const numericPeriod = Number(period);
    const trimmed = (topic || '').trim();
    const saved = await enqueueMutation(`lesson-topic:${classId}:${date}:${numericPeriod}`, async () => {
      const existing = await filterAll(base44.entities.LessonTopic, {
        class_id: classId,
        date,
        period: numericPeriod,
        is_template: false,
      });
      if (!trimmed) {
        await Promise.all(existing.map(row => base44.entities.LessonTopic.delete(row.id)));
        return null;
      }
      if (existing.length > 0) {
        const result = await base44.entities.LessonTopic.update(existing[0].id, { topic: trimmed });
        await Promise.all(existing.slice(1).map(row => base44.entities.LessonTopic.delete(row.id)));
        return result;
      }
      return base44.entities.LessonTopic.create({ class_id: classId, date, period: numericPeriod, topic: trimmed });
    });
    setData(d => {
      const filtered = d.lessonTopics.filter(item => !(
        item.classId === classId
        && item.date === date
        && Number(item.period) === numericPeriod
        && !item.isTemplate
      ));
      return { ...d, lessonTopics: saved ? upsertById(filtered, mapLessonTopic(saved)) : filtered };
    });
  }, []);

  // --- Substitutions ---
  const addSubstitution = useCallback(async (subData) => {
    const created = await base44.entities.Substitution.create({
      date: subData.date, period: Number(subData.period || 1),
      original_class_id: subData.originalClassId, substitute_class_id: subData.substituteClassId,
      notes: subData.notes || '',
    });
    setData(d => ({ ...d, substitutions: upsertById(d.substitutions, mapSubstitution(created)) }));
  }, []);

  const deleteSubstitution = useCallback(async (id) => {
    await base44.entities.Substitution.delete(id);
    setData(d => ({ ...d, substitutions: d.substitutions.filter(s => s.id !== id) }));
  }, []);

  const value = useMemo(() => ({
    data, loading, loadError, defaultGenderTrack,
    addClass, deleteClass, editClass, archiveClass, restoreClass, duplicateClass, updateHomeroomContacts,
    addStudent, deleteStudent, editStudent, importStudents,
    addTest, updateTest, deleteTest,
    setTestResult, setBehaviorGrade, setClassTestStatus,
    setGradeOverride, updateSettings, updateDefaultGenderTrack, updateBellSchedule,
    setBagrutResult, setBagrutTestIncluded,
    deleteAllData, loadAll, importSchedule,
    addSubstitution, deleteSubstitution, saveLessonTopic,
  }), [
    data, loading, loadError, defaultGenderTrack,
    addClass, deleteClass, editClass, archiveClass, restoreClass, duplicateClass, updateHomeroomContacts,
    addStudent, deleteStudent, editStudent, importStudents,
    addTest, updateTest, deleteTest, setTestResult, setBehaviorGrade, setClassTestStatus,
    setGradeOverride, updateSettings, updateDefaultGenderTrack, updateBellSchedule,
    setBagrutResult, setBagrutTestIncluded,
    deleteAllData, loadAll, importSchedule,
    addSubstitution, deleteSubstitution, saveLessonTopic,
  ]);

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
        isRequired: true, genderTrack: track, classId: test.classId || '', conversionTable: test.conversionTable,
      }))
  );
}
