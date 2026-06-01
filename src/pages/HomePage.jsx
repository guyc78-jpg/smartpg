import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2, Users, Check, X, Award } from 'lucide-react';
import { GRADE_LEVELS, GENDER_TRACK_LABELS } from '@/lib/types';
import ConfirmDeleteDialog from '@/components/app/ConfirmDeleteDialog';
import AddClassDialog from '@/components/app/AddClassDialog';
import { toast } from 'sonner';

export default function HomePage() {
  const { data, addClass, deleteClass, editClass, importStudents, defaultGenderTrack } = useApp();
  const [deleteClassTarget, setDeleteClassTarget] = useState(null);
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editGradeLevel, setEditGradeLevel] = useState('ז');
  const [editGenderTrack, setEditGenderTrack] = useState('boys');
  const [filterGradeLevel, setFilterGradeLevel] = useState('all');

  const filteredClasses = useMemo(() => {
    const base = filterGradeLevel === 'all'
      ? data.classes
      : data.classes.filter(c => c.gradeLevel === filterGradeLevel);
    return base.slice().sort((a, b) => {
      const idxA = GRADE_LEVELS.indexOf(a.gradeLevel);
      const idxB = GRADE_LEVELS.indexOf(b.gradeLevel);
      if (idxA !== idxB) return idxA - idxB;
      return a.name.localeCompare(b.name, 'he');
    });
  }, [data.classes, filterGradeLevel]);

  const totalStudents = data.students.length;

  const startEdit = (id, name, gradeLevel, genderTrack) => {
    setEditingId(id);
    setEditName(name);
    setEditGradeLevel(gradeLevel || 'ז');
    setEditGenderTrack(genderTrack || 'boys');
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      editClass(editingId, editName.trim(), editGradeLevel, editGenderTrack);
    }
    setEditingId(null);
  };

  const handleAddClass = async (name, gradeLevel, genderTrack, students) => {
    const newClassId = await addClass(name, gradeLevel, genderTrack);
    if (newClassId && students && students.length > 0) {
      await importStudents(students, newClassId);
    }
    toast.success(`נוצרה כיתה ${name}${students?.length ? ` עם ${students.length} תלמידים` : ''}`);
  };

  return (
    <Layout title="ראשי">
      <div className="max-w-3xl mx-auto space-y-4 p-4" dir="rtl">
        {/* Stats Bar */}
        <div className="flex items-center gap-3 text-sm">
          <Badge variant="secondary" className="gap-1">
            <Users className="w-3 h-3" />
            {data.classes.length} כיתות
          </Badge>
          <Badge variant="outline" className="gap-1">
            {totalStudents} תלמידים
          </Badge>
        </div>

        {/* Grade Level Filter */}
        <div className="flex gap-1.5 flex-wrap">
          <Button size="sm" variant={filterGradeLevel === 'all' ? 'default' : 'outline'} onClick={() => setFilterGradeLevel('all')} className="h-8 text-xs rounded-full">הכל</Button>
          {GRADE_LEVELS.map(gl => (
            <Button key={gl} size="sm" variant={filterGradeLevel === gl ? 'default' : 'outline'} onClick={() => setFilterGradeLevel(gl)} className="h-8 text-xs rounded-full">
              {gl}׳
            </Button>
          ))}
        </div>

        {/* Add Class Button */}
        <Button onClick={() => setAddClassOpen(true)} className="w-full h-11 rounded-xl btn-3d font-semibold gap-2">
          <Plus className="w-5 h-5" />
          הוסף כיתה
        </Button>

        {/* Class Cards */}
        <div className="space-y-2">
          {filteredClasses.map(cls => {
            const studentCount = data.students.filter(s => s.classId === cls.id).length;
            const isEditing = editingId === cls.id;

            return (
              <Card key={cls.id} className="card-3d rounded-xl overflow-hidden">
                {isEditing ? (
                  <div className="p-3 space-y-2">
                    <div className="flex gap-2 items-end">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-9 text-sm flex-1" autoFocus />
                      <Select value={editGradeLevel} onValueChange={setEditGradeLevel}>
                        <SelectTrigger className="w-[68px] h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GRADE_LEVELS.map(gl => <SelectItem key={gl} value={gl}>{gl}׳</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={editGenderTrack} onValueChange={setEditGenderTrack}>
                        <SelectTrigger className="w-[80px] h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="boys">בנים</SelectItem>
                          <SelectItem value="girls">בנות</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="h-8 gap-1"><Check className="w-3 h-3" /> שמור</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ) : (
                  <Link to={`/class/${cls.id}`} className="block p-3 active:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{cls.name}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span>{studentCount} תלמידים</span>
                            <span>•</span>
                            <span>{GENDER_TRACK_LABELS[cls.genderTrack] || 'בנים'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.preventDefault()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(cls.id, cls.name, cls.gradeLevel, cls.genderTrack); }}>
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteClassTarget({ id: cls.id, name: cls.name }); }}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                )}
              </Card>
            );
          })}

          {filteredClasses.length === 0 && (
            <p className="text-center text-muted-foreground py-16 text-sm">
              {data.classes.length === 0 ? 'אין כיתות עדיין. הוסף כיתה חדשה כדי להתחיל.' : 'אין כיתות בשכבה זו.'}
            </p>
          )}
        </div>

        <AddClassDialog
          open={addClassOpen}
          onOpenChange={setAddClassOpen}
          onAdd={handleAddClass}
          defaultGenderTrack={defaultGenderTrack}
        />

        <ConfirmDeleteDialog
          open={!!deleteClassTarget}
          onOpenChange={() => setDeleteClassTarget(null)}
          title={`מחיקת כיתה ${deleteClassTarget?.name}`}
          description="כל התלמידים והציונים של הכיתה ימחקו. האם להמשיך?"
          onConfirm={() => { deleteClass(deleteClassTarget.id); setDeleteClassTarget(null); toast.success('הכיתה נמחקה'); }}
        />
      </div>
    </Layout>
  );
}