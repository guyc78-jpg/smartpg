import { useState, useEffect } from 'react';
import { useApp, generateId } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { GRADE_LEVELS, GENDER_TRACK_LABELS } from '@/lib/types';
import ConfirmDeleteDialog from '@/components/app/ConfirmDeleteDialog';
import { toast } from 'sonner';

export default function ManageTestsPage() {
  const { data, updateTest, addTest, deleteTest, defaultGenderTrack } = useApp();
  const [expandedTest, setExpandedTest] = useState(null);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('all');
  const [selectedGenderTrack, setSelectedGenderTrack] = useState(defaultGenderTrack);
  const [deleteTestTarget, setDeleteTestTarget] = useState(null);

  useEffect(() => { setSelectedGenderTrack(defaultGenderTrack); }, [defaultGenderTrack]);

  const handleAddTest = async () => {
    const newTest = {
      id: generateId(),
      name: 'מבדק חדש',
      weight: 25,
      gradeLevel: selectedGradeLevel === 'all' ? 'ז' : selectedGradeLevel,
      genderTrack: selectedGenderTrack,
      conversionTable: [{ minResult: null, maxResult: null, grade: null }],
    };
    await addTest(newTest);
    toast.success('מבדק חדש נוצר');
  };

  const GRADE_ORDER = { 'ז': 0, 'ח': 1, 'ט': 2, 'י': 3, 'יא': 4, 'יב': 5 };
  const filteredTests = data.tests
    .filter(t => selectedGradeLevel === 'all' || t.gradeLevel === selectedGradeLevel)
    .filter(t => (t.genderTrack || 'boys') === selectedGenderTrack)
    .slice().sort((a, b) => {
      const ga = GRADE_ORDER[a.gradeLevel] ?? 99;
      const gb = GRADE_ORDER[b.gradeLevel] ?? 99;
      return ga !== gb ? ga - gb : a.name.localeCompare(b.name, 'he');
    });

  const updateEntry = (testId, entryIdx, field, value) => {
    const test = data.tests.find(t => t.id === testId);
    if (!test) return;
    const newTable = [...(test.conversionTable || [])];
    if (value.trim() === '') {
      newTable[entryIdx] = { ...newTable[entryIdx], [field]: null };
    } else {
      const num = parseFloat(value);
      if (Number.isNaN(num)) return;
      newTable[entryIdx] = { ...newTable[entryIdx], [field]: num };
    }
    updateTest({ ...test, conversionTable: newTable });
  };

  const addEntry = (testId) => {
    const test = data.tests.find(t => t.id === testId);
    if (!test) return;
    updateTest({ ...test, conversionTable: [...(test.conversionTable || []), { minResult: null, maxResult: null, grade: null }] });
  };

  const removeEntry = (testId, entryIdx) => {
    const test = data.tests.find(t => t.id === testId);
    if (!test) return;
    updateTest({ ...test, conversionTable: (test.conversionTable || []).filter((_, i) => i !== entryIdx) });
  };

  return (
    <Layout title="מבדקים">
      <div className="max-w-3xl mx-auto space-y-3 p-4" dir="rtl">
        <div className="space-y-1.5">
          <div className="text-[11px] text-muted-foreground px-1">
            מוצגים רק מבדקי {GENDER_TRACK_LABELS[selectedGenderTrack]}
          </div>
          <div className="flex gap-1.5 w-full">
            {GRADE_LEVELS.map(gl => (
              <Button key={gl} size="sm" variant={selectedGradeLevel === gl ? 'default' : 'outline'} onClick={() => setSelectedGradeLevel(gl)} className="h-8 flex-1 text-sm rounded-full">
                {gl}׳
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-1.5 items-center flex-wrap">
          <Button onClick={handleAddTest} size="sm" className="h-7 px-2.5 text-xs rounded-full">
            <Plus className="w-3.5 h-3.5 ml-1" /> הוסף
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedGradeLevel('all')} className={`h-7 px-3 text-[11px] rounded-full ${selectedGradeLevel === 'all' ? 'bg-accent text-accent-foreground' : ''}`}>
            כל השכבות
          </Button>
        </div>

        <div className="space-y-1.5">
          {filteredTests.map(test => {
            const isExpanded = expandedTest === test.id;
            return (
              <Card key={test.id} className="card-3d rounded-xl overflow-hidden">
                <button type="button" onClick={() => setExpandedTest(isExpanded ? null : test.id)} className="w-full flex items-center justify-between px-3 py-2.5 text-right">
                  <div>
                    <div className="font-bold text-sm">{test.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {test.gradeLevel}׳ • משקל {test.weight}% • {test.conversionTable?.length || 0} שורות
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setDeleteTestTarget({ id: test.id, name: test.name }); }}>
                      <Trash2 className="w-3 h-3 text-destructive/60" />
                    </Button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <CardContent className="px-3 pb-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground">שם</label>
                        <Input value={test.name} onChange={e => updateTest({ ...test, name: e.target.value })} className="h-8 text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">משקל %</label>
                        <Input type="number" value={test.weight} onChange={e => updateTest({ ...test, weight: Number(e.target.value) })} className="h-8 text-sm" />
                      </div>
                    </div>

                    <div className="text-[11px] font-semibold mt-2">טבלת המרה</div>
                    <div className="space-y-1">
                      {(test.conversionTable || []).map((entry, idx) => (
                        <div key={`${test.id}-${idx}`} className="flex gap-1.5 items-center">
                          <Input placeholder="מ-" value={entry.minResult ?? ''} onChange={e => updateEntry(test.id, idx, 'minResult', e.target.value)} className="h-7 text-xs flex-1 text-center" />
                          <Input placeholder="עד" value={entry.maxResult ?? ''} onChange={e => updateEntry(test.id, idx, 'maxResult', e.target.value)} className="h-7 text-xs flex-1 text-center" />
                          <Input placeholder="ציון" value={entry.grade ?? ''} onChange={e => updateEntry(test.id, idx, 'grade', e.target.value)} className="h-7 text-xs flex-1 text-center" />
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeEntry(test.id, idx)}>
                            <Trash2 className="w-3 h-3 text-destructive/60" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addEntry(test.id)} className="h-7 text-xs w-full">
                      <Plus className="w-3 h-3 ml-1" /> שורה
                    </Button>
                  </CardContent>
                )}
              </Card>
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
          description="המבדק ימחק. פעולה זו לא ניתנת לביטול."
          onConfirm={() => { deleteTest(deleteTestTarget.id); setDeleteTestTarget(null); toast.success('המבדק נמחק'); }}
        />
      </div>
    </Layout>
  );
}