import { useState, useEffect } from 'react';
import { useApp, generateId } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { GRADE_LEVELS, GENDER_TRACK_LABELS, SEMESTER_LABELS, TEST_TYPES } from '@/lib/types';
import ConfirmDeleteDialog from '@/components/app/ConfirmDeleteDialog';
import ConversionTableEditor from '@/components/tests/ConversionTableEditor.jsx';
import TestImportExport from '@/components/tests/TestImportExport.jsx';
import { usesTimeFormat } from '@/lib/testImportExport';
import { toast } from 'sonner';

const selectClass = 'h-8 w-full rounded-md border border-input bg-background px-2 text-xs';
const GRADE_ORDER = { 'ז': 0, 'ח': 1, 'ט': 2, 'י': 3, 'יא': 4, 'יב': 5 };

export default function ManageTestsPage() {
  const { data, updateTest, addTest, deleteTest, defaultGenderTrack } = useApp();
  const [expandedTest, setExpandedTest] = useState(null);
  const [openGroups, setOpenGroups] = useState({});
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('all');
  const [selectedGenderTrack, setSelectedGenderTrack] = useState(defaultGenderTrack);
  const [selectedType, setSelectedType] = useState('all');
  const [deleteTestTarget, setDeleteTestTarget] = useState(null);

  useEffect(() => { setSelectedGenderTrack(defaultGenderTrack); }, [defaultGenderTrack]);

  const handleAddTest = async () => {
    const newTest = {
      id: generateId(),
      name: 'מבדק חדש',
      testType: selectedType === 'all' ? 'other' : selectedType,
      weight: 25,
      gradeLevel: selectedGradeLevel === 'all' ? 'ז' : selectedGradeLevel,
      classId: '',
      genderTrack: selectedGenderTrack,
      semester: '',
      testDate: '',
      unit: '',
      conversionTable: [],
    };
    await addTest(newTest);
    toast.success('מבדק חדש נוצר');
  };

  const filteredTests = data.tests
    .filter(t => selectedGradeLevel === 'all' || t.gradeLevel === selectedGradeLevel)
    .filter(t => (t.genderTrack || 'boys') === selectedGenderTrack)
    .filter(t => selectedType === 'all' || (t.testType || 'other') === selectedType)
    .slice().sort((a, b) => {
      const ga = GRADE_ORDER[a.gradeLevel] ?? 99;
      const gb = GRADE_ORDER[b.gradeLevel] ?? 99;
      return ga !== gb ? ga - gb : a.name.localeCompare(b.name, 'he');
    });

  const updateField = (test, field, value) => updateTest({ ...test, [field]: value });

  const handleImport = async (tests) => {
    for (const t of tests) await addTest(t);
    return tests.length;
  };

  const handleDeleteAll = async () => {
    const ids = data.tests.map(t => t.id);
    for (const id of ids) await deleteTest(id);
    return ids.length;
  };

  return (
    <Layout title="מבדקים">
      <div className="max-w-4xl mx-auto space-y-3 p-4" dir="rtl">
        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-1.5 w-full" dir="rtl">
            <button type="button" onClick={() => setSelectedGradeLevel('all')} className={`h-9 rounded-full text-xs font-bold liquid-chip ${selectedGradeLevel === 'all' ? 'liquid-chip-active' : ''}`}>
              הכל
            </button>
            {GRADE_LEVELS.map(gl => (
              <button key={gl} type="button" onClick={() => setSelectedGradeLevel(gl)} className={`h-9 rounded-full text-xs font-bold liquid-chip ${selectedGradeLevel === gl ? 'liquid-chip-active' : ''}`}>
                {gl}׳
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select value={selectedGenderTrack} onChange={e => setSelectedGenderTrack(e.target.value)} className={selectClass}>
              {Object.entries(GENDER_TRACK_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className={selectClass}>
              <option value="all">כל סוגי המבדקים</option>
              {Object.entries(TEST_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <Button onClick={handleAddTest} size="sm" className="h-8 rounded-full">
              <Plus className="w-3.5 h-3.5 ml-1" /> הוסף מבדק
            </Button>
          </div>
          <TestImportExport tests={filteredTests} onImport={handleImport} onDeleteAll={handleDeleteAll} defaultGradeLevel={selectedGradeLevel === 'all' ? 'ז' : selectedGradeLevel} />
        </div>

        <div className="space-y-2">
          {filteredTests.map((test, idx) => {
            const isExpanded = expandedTest === test.id;
            const className = data.classes.find(c => c.id === test.classId)?.name;
            const grouped = selectedGradeLevel === 'all';
            const isFirstOfGroup = grouped && (idx === 0 || filteredTests[idx - 1].gradeLevel !== test.gradeLevel);
            const groupOpen = !grouped || !!openGroups[test.gradeLevel];
            const groupCount = grouped ? filteredTests.filter(t => t.gradeLevel === test.gradeLevel).length : 0;
            return (
              <div key={test.id} className="space-y-2">
              {isFirstOfGroup && (
                <button
                  type="button"
                  onClick={() => setOpenGroups(p => ({ ...p, [test.gradeLevel]: !p[test.gradeLevel] }))}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-right bg-gradient-to-l from-primary/90 to-accent/80 text-primary-foreground shadow-md hover:shadow-lg transition-shadow"
                >
                  <span className="text-sm font-bold">שכבה {test.gradeLevel}׳ <span className="text-xs font-normal opacity-80">({groupCount} מבדקים)</span></span>
                  {groupOpen ? <ChevronUp className="w-4 h-4 opacity-90" /> : <ChevronDown className="w-4 h-4 opacity-90" />}
                </button>
              )}
              {groupOpen && (
              <Card className="card-3d rounded-xl overflow-hidden">
                <button onClick={() => setExpandedTest(isExpanded ? null : test.id)} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-right">
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{test.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {TEST_TYPES[test.testType || 'other']} • {test.gradeLevel}׳ • {GENDER_TRACK_LABELS[test.genderTrack || 'boys']} • {className || 'כל הכיתות'} • {test.conversionTable?.length || 0} שורות
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setDeleteTestTarget({ id: test.id, name: test.name }); }}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
                    </Button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <CardContent className="px-3 pb-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Field label="שם מבדק"><Input value={test.name} onChange={e => updateField(test, 'name', e.target.value)} className="h-8 text-sm" /></Field>
                      <Field label="סוג מבדק"><select value={test.testType || 'other'} onChange={e => updateField(test, 'testType', e.target.value)} className={selectClass}>{Object.entries(TEST_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                      <Field label="שכבה"><select value={test.gradeLevel || 'ז'} onChange={e => updateField(test, 'gradeLevel', e.target.value)} className={selectClass}>{GRADE_LEVELS.map(gl => <option key={gl} value={gl}>{gl}׳</option>)}</select></Field>
                      <Field label="כיתה"><select value={test.classId || ''} onChange={e => updateField(test, 'classId', e.target.value)} className={selectClass}><option value="">כל הכיתות בשכבה</option>{data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                      <Field label="מגדר"><select value={test.genderTrack || 'boys'} onChange={e => updateField(test, 'genderTrack', e.target.value)} className={selectClass}>{Object.entries(GENDER_TRACK_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                      <Field label="מחצית"><select value={test.semester || ''} onChange={e => updateField(test, 'semester', e.target.value)} className={selectClass}><option value="">כל המחציות</option>{Object.entries(SEMESTER_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                      <Field label="תאריך"><Input type="date" value={test.testDate || ''} onChange={e => updateField(test, 'testDate', e.target.value)} className="h-8 text-sm" /></Field>
                      <Field label="יחידת מדידה"><Input value={test.unit || ''} onChange={e => updateField(test, 'unit', e.target.value)} placeholder="שניות / מטרים / חזרות..." className="h-8 text-sm" /></Field>
                      <Field label="משקל בציון"><Input type="number" min="0" max="100" value={test.weight ?? 0} onChange={e => updateField(test, 'weight', Number(e.target.value))} className="h-8 text-sm" /></Field>
                    </div>

                    <div className="rounded-xl border border-border p-2 space-y-2">
                      <div className="text-xs font-bold">טבלת המרה מתוצאה לציון</div>
                      <ConversionTableEditor rows={test.conversionTable} unit={test.unit} timeBased={usesTimeFormat(test.name)} onSave={rows => { updateField(test, 'conversionTable', rows); toast.success('טבלת ההמרה נשמרה'); }} />
                    </div>
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
          onConfirm={() => { deleteTest(deleteTestTarget.id); setDeleteTestTarget(null); toast.success('המבדק נמחק'); }}
        />
      </div>
    </Layout>
  );
}

function Field({ label, children }) {
  return (
    <label className="space-y-1">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}