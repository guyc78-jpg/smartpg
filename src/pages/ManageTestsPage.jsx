import { useState, useEffect, useMemo, useRef } from 'react';
import { useApp, generateId } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Save, Loader2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { GRADE_LEVELS, GENDER_TRACK_LABELS, SEMESTER_LABELS, TEST_TYPES } from '@/lib/types';
import { Field } from '@/components/app/EditDialog';
import ConfirmDeleteDialog from '@/components/app/ConfirmDeleteDialog';
import ConversionTableEditor from '@/components/tests/ConversionTableEditor.jsx';
import TestImportExport from '@/components/tests/TestImportExport.jsx';
import { usesTimeFormat } from '@/lib/testImportExport';
import { buildTestDefinitionPayload } from '@/lib/testDefinitionPayload';
import { useAuth } from '@/lib/AuthContext';
import { readTestDrafts, writeTestDrafts, isNewTestDraft } from '@/lib/testDraftStorage';
import { toast } from 'sonner';

const selectClass = 'h-11 w-full rounded-md border border-input bg-background px-2 text-sm';
const GRADE_ORDER = { 'ז': 0, 'ח': 1, 'ט': 2, 'י': 3, 'יא': 4, 'יב': 5 };

export default function ManageTestsPage() {
  const { user } = useAuth();
  const { data, updateTest, addTest, deleteTest, defaultGenderTrack } = useApp();
  const [expandedTest, setExpandedTest] = useState(null);
  const [openGroups, setOpenGroups] = useState({});
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('all');
  const [selectedGenderTrack, setSelectedGenderTrack] = useState(defaultGenderTrack);
  const [selectedType, setSelectedType] = useState('all');
  const [deleteTestTarget, setDeleteTestTarget] = useState(null);
  const [drafts, setDrafts] = useState(() => Object.fromEntries(
    Object.entries(readTestDrafts(user?.id)).filter(([id, draft]) => data.tests.some(test => test.id === id) || isNewTestDraft(id, draft))
  ));
  const [draftStorageError, setDraftStorageError] = useState(false);
  const [savingIds, setSavingIds] = useState({});
  const savingRef = useRef(new Set());
  const addRef = useRef(false);
  const importingRef = useRef(false);

  useEffect(() => {
    setDraftStorageError(!writeTestDrafts(user?.id, drafts));
  }, [user?.id, drafts]);

  useEffect(() => {
    if (Object.keys(drafts).length === 0) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [drafts]);
  const activeClasses = useMemo(() => data.classes.filter(c => (c.status || 'active') === 'active'), [data.classes]);

  useEffect(() => { setSelectedGenderTrack(defaultGenderTrack); }, [defaultGenderTrack]);

  const discardDraft = id => {
    if (addRef.current === id) addRef.current = false;
    setDrafts(current => { const next = { ...current }; delete next[id]; return next; });
  };

  const newDrafts = Object.entries(drafts).filter(([id, draft]) => isNewTestDraft(id, draft)).map(([, draft]) => draft);
  const allTests = [...data.tests, ...newDrafts];

  const handleAddTest = () => {
    const existingDraft = newDrafts[0];
    if (existingDraft) {
      setSelectedGradeLevel('all');
      setSelectedGenderTrack(existingDraft.genderTrack || 'boys');
      setSelectedType('all');
      setOpenGroups(groups => ({ ...groups, [existingDraft.gradeLevel]: true }));
      setExpandedTest(existingDraft.id);
      return;
    }
    if (addRef.current) return;
    const newTest = {
      id: generateId(), _isNew: true, name: 'מבדק חדש',
      testType: selectedType === 'all' ? 'other' : selectedType,
      weight: 25, gradeLevel: selectedGradeLevel === 'all' ? 'ז' : selectedGradeLevel,
      classId: '', genderTrack: selectedGenderTrack,
      semester: '', testDate: '', unit: '', conversionTable: [],
    };
    addRef.current = newTest.id;
    setDrafts(current => ({ ...current, [newTest.id]: newTest }));
    setOpenGroups(groups => ({ ...groups, [newTest.gradeLevel]: true }));
    setExpandedTest(newTest.id);
    toast.info('טיוטת מבדק נפתחה. המבדק ייווצר לאחר שמירה.');
  };

  const filteredTests = allTests
    .filter(t => selectedGradeLevel === 'all' || t.gradeLevel === selectedGradeLevel)
    .filter(t => (t.genderTrack || 'boys') === selectedGenderTrack)
    .filter(t => selectedType === 'all' || (t.testType || 'other') === selectedType)
    .slice().sort((a, b) => {
      const ga = GRADE_ORDER[a.gradeLevel] ?? 99;
      const gb = GRADE_ORDER[b.gradeLevel] ?? 99;
      return ga !== gb ? ga - gb : a.name.localeCompare(b.name, 'he');
    });

  const updateField = (test, field, value) => {
    setDrafts(current => ({ ...current, [test.id]: { ...current[test.id], [field]: value } }));
  };

  const persistTest = async (test, extra = {}) => {
    if (savingRef.current.has(test.id)) throw new Error('השמירה כבר מתבצעת');
    savingRef.current.add(test.id);
    setSavingIds(current => ({ ...current, [test.id]: true }));
    try {
      if (isNewTestDraft(test.id, test)) {
        const id = await addTest({ ...test, ...drafts[test.id], ...extra });
        if (addRef.current === test.id) addRef.current = false;
        setExpandedTest(id);
      } else {
        await updateTest(test, { ...drafts[test.id], ...extra });
      }
      const storedDrafts = readTestDrafts(user?.id);
      delete storedDrafts[test.id];
      writeTestDrafts(user?.id, storedDrafts);
      setDrafts(current => {
        const next = { ...current };
        delete next[test.id];
        return next;
      });
    } finally {
      savingRef.current.delete(test.id);
      setSavingIds(current => ({ ...current, [test.id]: false }));
    }
  };

  const saveDraft = async test => {
    try {
      await persistTest(test);
      toast.success('המבדק נשמר');
    } catch {
      toast.error('המבדק לא נשמר. בדוק את השם, המשקל וטבלת ההמרה ונסה שוב.');
    }
  };

  const handleImport = async (tests) => {
    if (importingRef.current) throw new Error('ייבוא כבר מתבצע');
    tests.forEach(buildTestDefinitionPayload);
    importingRef.current = true;
    let count = 0;
    try {
      for (const test of tests) {
        await addTest(test);
        count++;
      }
      return count;
    } catch (cause) {
      const error = new Error(`הייבוא נעצר לאחר ${count} מבדקים שנשמרו. בדוק את הרשימה לפני ייבוא נוסף.`);
      error.isImportFailure = true;
      error.cause = cause;
      throw error;
    } finally {
      importingRef.current = false;
    }
  };

  const handleDeleteAll = async () => {
    const ids = data.tests.map(t => t.id);
    for (const id of ids) {
      await deleteTest(id);
      const storedDrafts = readTestDrafts(user?.id);
      delete storedDrafts[id];
      writeTestDrafts(user?.id, storedDrafts);
      setDrafts(current => { const next = { ...current }; delete next[id]; return next; });
    }
    return ids.length;
  };

  return (
    <Layout title="מבדקים">
      <div className="max-w-4xl mx-auto space-y-3 p-4" dir="rtl">
        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-1.5 w-full" dir="rtl">
            <button type="button" onClick={() => setSelectedGradeLevel('all')} className={`h-11 rounded-full text-xs font-bold liquid-chip ${selectedGradeLevel === 'all' ? 'liquid-chip-active' : ''}`}>
              הכל
            </button>
            {GRADE_LEVELS.map(gl => (
              <button key={gl} type="button" onClick={() => setSelectedGradeLevel(gl)} className={`h-11 rounded-full text-xs font-bold liquid-chip ${selectedGradeLevel === gl ? 'liquid-chip-active' : ''}`}>
                {gl}׳
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select aria-label="סינון לפי מסלול" value={selectedGenderTrack} onChange={e => setSelectedGenderTrack(e.target.value)} className={selectClass}>
              {Object.entries(GENDER_TRACK_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select aria-label="סינון לפי סוג מבדק" value={selectedType} onChange={e => setSelectedType(e.target.value)} className={selectClass}>
              <option value="all">כל סוגי המבדקים</option>
              {Object.entries(TEST_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <Button onClick={handleAddTest} size="sm" className="h-11 rounded-full">
              <Plus className="w-3.5 h-3.5 ml-1" /> הוסף מבדק
            </Button>
          </div>
          <TestImportExport tests={filteredTests.filter(test => !test._isNew)} allTests={data.tests} onImport={handleImport} onDeleteAll={handleDeleteAll} defaultGradeLevel={selectedGradeLevel === 'all' ? 'ז' : selectedGradeLevel} />
        </div>

        {Object.keys(drafts).length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2 text-sm" role="status">
            <p>קיימים שינויים שטרם נשמרו ב־{Object.keys(drafts).length} מבדקים.</p>
            {draftStorageError && <p role="alert" className="text-destructive">לא ניתן לשחזר טיוטה בדפדפן זה. שמור את השינויים לפני היציאה.</p>}
            <Button type="button" variant="outline" className="h-11" onClick={() => {
              const saved = allTests.find(test => drafts[test.id]);
              if (!saved) return;
              setSelectedGradeLevel("all");
              setSelectedGenderTrack(saved.genderTrack || "boys");
              setSelectedType("all");
              setOpenGroups(groups => ({ ...groups, [saved.gradeLevel]: true }));
              setExpandedTest(saved.id);
            }}>המשך לערוך</Button>
          </div>
        )}
        <div className="space-y-2">
          {filteredTests.map((savedTest, idx) => {
            const test = { ...savedTest, ...drafts[savedTest.id], _isNew: isNewTestDraft(savedTest.id, savedTest) };
            const saving = Boolean(savingIds[test.id]);
            const isExpanded = expandedTest === test.id;
            const className = data.classes.find(c => c.id === test.classId)?.name;
            const grouped = selectedGradeLevel === 'all';
            const groupGrade = savedTest.gradeLevel;
            const isFirstOfGroup = grouped && (idx === 0 || filteredTests[idx - 1].gradeLevel !== groupGrade);
            const groupOpen = !grouped || !!openGroups[groupGrade];
            const groupCount = grouped ? filteredTests.filter(t => t.gradeLevel === groupGrade).length : 0;
            return (
              <div key={test.id} className="space-y-2">
              {isFirstOfGroup && (
                <button
                  type="button"
                  onClick={() => setOpenGroups(p => ({ ...p, [groupGrade]: !p[groupGrade] }))}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-right bg-primary/10 border border-primary/15 text-primary hover:bg-primary/15 transition-colors"
                >
                  <span className="text-sm font-bold">שכבה {groupGrade}׳ <span className="text-xs font-normal opacity-70">({groupCount} מבדקים)</span></span>
                  {groupOpen ? <ChevronUp className="w-4 h-4 opacity-70" /> : <ChevronDown className="w-4 h-4 opacity-70" />}
                </button>
              )}
              {groupOpen && (
              <Card className="card-3d rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-1.5">
                <button type="button" disabled={saving} aria-expanded={isExpanded} aria-controls={`test-editor-${test.id}`} onClick={() => setExpandedTest(isExpanded ? null : test.id)} className="min-w-0 flex-1 min-h-11 flex items-center justify-between gap-3 text-right">
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{test.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {TEST_TYPES[test.testType || 'other']} • {test.gradeLevel}׳ • {GENDER_TRACK_LABELS[test.genderTrack || 'boys']} • {className || 'כל הכיתות'} • {test.conversionTable?.length || 0} שורות
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                </button>
                <Button type="button" variant="ghost" size="icon" disabled={saving} aria-label={`מחיקת מבדק ${savedTest.name}`} className="h-11 w-11 shrink-0" onClick={() => test._isNew ? discardDraft(test.id) : setDeleteTestTarget({ id: test.id, name: savedTest.name })}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive/70" aria-hidden="true" />
                </Button>
                </div>

                {isExpanded && (
                  <CardContent id={`test-editor-${test.id}`} className="px-3 pb-3 space-y-3">
                    <fieldset disabled={saving} aria-busy={saving} className="space-y-3 min-w-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Field label="שם מבדק"><Input value={test.name} onChange={e => updateField(test, 'name', e.target.value)} className="h-11 text-sm" /></Field>
                      <Field label="סוג מבדק"><select value={test.testType || 'other'} onChange={e => updateField(test, 'testType', e.target.value)} className={selectClass}>{Object.entries(TEST_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                      <Field label="שכבה"><select value={test.gradeLevel || 'ז'} onChange={e => updateField(test, 'gradeLevel', e.target.value)} className={selectClass}>{GRADE_LEVELS.map(gl => <option key={gl} value={gl}>{gl}׳</option>)}</select></Field>
                      <Field label="כיתה"><select value={test.classId || ''} onChange={e => updateField(test, 'classId', e.target.value)} className={selectClass}><option value="">כל הכיתות בשכבה</option>{test.classId && !activeClasses.some(c => c.id === test.classId) && <option value={test.classId} disabled>{className || 'כיתה בארכיון'} (ארכיון)</option>}{activeClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                      <Field label="מגדר"><select value={test.genderTrack || 'boys'} onChange={e => updateField(test, 'genderTrack', e.target.value)} className={selectClass}>{Object.entries(GENDER_TRACK_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                      <Field label="מחצית"><select value={test.semester || ''} onChange={e => updateField(test, 'semester', e.target.value)} className={selectClass}><option value="">כל המחציות</option>{Object.entries(SEMESTER_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                      <Field label="תאריך"><Input type="date" value={test.testDate || ''} onChange={e => updateField(test, 'testDate', e.target.value)} className="h-11 text-sm" /></Field>
                      <Field label="יחידת מדידה"><Input value={test.unit || ''} onChange={e => updateField(test, 'unit', e.target.value)} placeholder="שניות / מטרים / חזרות..." className="h-11 text-sm" /></Field>
                      <Field label="משקל בציון"><Input type="number" min="0" max="100" value={test.weight ?? 0} onChange={e => updateField(test, 'weight', e.target.value)} className="h-11 text-sm" /></Field>
                    </div>

                    <div className="rounded-xl border border-border p-2 space-y-2">
                      <div className="text-xs font-bold">טבלת המרה מתוצאה לציון</div>
                      <ConversionTableEditor rows={test.conversionTable} unit={test.unit} timeBased={usesTimeFormat(test.name)} onSave={async rows => { await persistTest(test, { conversionTable: rows }); toast.success('טבלת ההמרה נשמרה'); }} />
                    </div>
                    {drafts[test.id] && (
                      <div className="flex gap-2">
                        <Button type="button" onClick={() => saveDraft(test)} className="h-11 flex-1 gap-2">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                          {saving ? 'שומר…' : 'שמור שינויים'}
                        </Button>
                        <Button type="button" variant="outline" className="h-11" onClick={() => discardDraft(test.id)}>ביטול</Button>
                      </div>
                    )}
                    </fieldset>
                  </CardContent>
                )}
              </Card>
              )}
              </div>
            );
          })}

          {filteredTests.length === 0 && (
            <p className="text-center text-muted-foreground py-16 text-sm">אין מבדקים מוגדרים בסינון הנוכחי</p>
          )}
        </div>

        <ConfirmDeleteDialog
          open={!!deleteTestTarget}
          onOpenChange={() => setDeleteTestTarget(null)}
          title={`מחיקת ${deleteTestTarget?.name}`}
          description="המבדק וטבלת ההמרה שלו ימחקו. פעולה זו לא ניתנת לביטול."
          onConfirm={async () => {
            const target = deleteTestTarget;
            await deleteTest(target.id);
            setDrafts(current => { const next = { ...current }; delete next[target.id]; return next; });
            toast.success('המבדק נמחק');
            setDeleteTestTarget(null);
          }}
        />
      </div>
    </Layout>
  );
}


