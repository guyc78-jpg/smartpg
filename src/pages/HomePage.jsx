import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/store/AppProvider';
import Layout from '@/components/app/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2, Users, Check, X, Copy, Archive, Eye, ClipboardList, UserCheck, BarChart3, Timer, Award } from 'lucide-react';
import { GRADE_LEVELS, GENDER_TRACK_LABELS } from '@/lib/types';
import ConfirmDeleteDialog from '@/components/app/ConfirmDeleteDialog';
import AddClassDialog from '@/components/app/AddClassDialog';
import { toast } from 'sonner';

const EMPTY_EDIT = { name: '', gradeLevel: 'ז', genderTrack: 'boys', homeroomTeacher: '', notes: '', status: 'active' };

function QuickAction({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-background/70 py-2 text-[11px] font-medium text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors">
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  );
}

export default function HomePage() {
  const { data, addClass, deleteClass, editClass, archiveClass, duplicateClass, importStudents, defaultGenderTrack } = useApp();
  const [deleteClassTarget, setDeleteClassTarget] = useState(null);
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(EMPTY_EDIT);
  const [filterGradeLevel, setFilterGradeLevel] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  const classStudentCounts = useMemo(() => {
    const counts = {};
    data.students.forEach(s => { counts[s.classId] = (counts[s.classId] || 0) + 1; });
    return counts;
  }, [data.students]);

  const filteredClasses = useMemo(() => {
    const base = data.classes.filter(c => {
      const gradeOk = filterGradeLevel === 'all' || c.gradeLevel === filterGradeLevel;
      const statusOk = statusFilter === 'all' || (c.status || 'active') === statusFilter;
      return gradeOk && statusOk;
    });
    return base.slice().sort((a, b) => {
      const idxA = GRADE_LEVELS.indexOf(a.gradeLevel);
      const idxB = GRADE_LEVELS.indexOf(b.gradeLevel);
      if (idxA !== idxB) return idxA - idxB;
      return a.name.localeCompare(b.name, 'he');
    });
  }, [data.classes, filterGradeLevel, statusFilter]);

  const totalStudents = data.students.length;
  const activeClasses = data.classes.filter(c => (c.status || 'active') === 'active').length;

  const startEdit = (cls) => {
    setEditingId(cls.id);
    setEditData({
      name: cls.name || '',
      gradeLevel: cls.gradeLevel || 'ז',
      genderTrack: cls.genderTrack || 'boys',
      homeroomTeacher: cls.homeroomTeacher || '',
      notes: cls.notes || '',
      status: cls.status || 'active',
    });
  };

  const saveEdit = async () => {
    if (editingId && editData.name.trim()) {
      await editClass(editingId, { ...editData, name: editData.name.trim() });
      toast.success('הכיתה עודכנה');
    }
    setEditingId(null);
  };

  const handleAddClass = async (classData, students) => {
    const newClassId = await addClass(classData);
    if (newClassId && students?.length > 0) await importStudents(students, newClassId);
    toast.success(`נוצרה כיתה ${classData.name}${students?.length ? ` עם ${students.length} תלמידים` : ''}`);
  };

  const handleDuplicate = async (cls) => {
    await duplicateClass(cls.id);
    toast.success('הכיתה שוכפלה ללא תלמידים');
  };

  const handleArchive = async (cls) => {
    await archiveClass(cls.id);
    toast.success('הכיתה הועברה לארכיון');
  };

  return (
    <Layout title="ניהול כיתות חנ״ג">
      <div className="max-w-4xl mx-auto space-y-4 p-4" dir="rtl">
        <div className="grid grid-cols-3 gap-2">
          <Badge variant="secondary" className="justify-center gap-1 py-2"><Users className="w-3 h-3" /> {activeClasses} פעילות</Badge>
          <Badge variant="outline" className="justify-center py-2">{data.classes.length} כיתות</Badge>
          <Badge variant="outline" className="justify-center py-2">{totalStudents} תלמידים</Badge>
        </div>

        <Button onClick={() => setAddClassOpen(true)} className="w-full h-12 rounded-xl btn-3d font-semibold gap-2">
          <Plus className="w-5 h-5" /> הוסף כיתה
        </Button>

        <div className="space-y-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <Button size="sm" variant={filterGradeLevel === 'all' ? 'default' : 'outline'} onClick={() => setFilterGradeLevel('all')} className="h-8 text-xs rounded-full shrink-0">הכל</Button>
            {GRADE_LEVELS.map(gl => (
              <Button key={gl} size="sm" variant={filterGradeLevel === gl ? 'default' : 'outline'} onClick={() => setFilterGradeLevel(gl)} className="h-8 text-xs rounded-full shrink-0">{gl}׳</Button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" variant={statusFilter === 'active' ? 'default' : 'outline'} onClick={() => setStatusFilter('active')} className="h-9 text-xs rounded-xl">פעילות</Button>
            <Button size="sm" variant={statusFilter === 'archived' ? 'default' : 'outline'} onClick={() => setStatusFilter('archived')} className="h-9 text-xs rounded-xl">ארכיון</Button>
            <Button size="sm" variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')} className="h-9 text-xs rounded-xl">כל הסטטוסים</Button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredClasses.map(cls => {
            const studentCount = classStudentCounts[cls.id] || 0;
            const isEditing = editingId === cls.id;
            const archived = (cls.status || 'active') === 'archived';

            return (
              <Card key={cls.id} className={`card-3d rounded-2xl overflow-hidden ${archived ? 'opacity-70' : ''}`}>
                {isEditing ? (
                  <div className="p-4 space-y-3">
                    <Input value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} className="h-10 text-sm" autoFocus />
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={editData.gradeLevel} onValueChange={v => setEditData(d => ({ ...d, gradeLevel: v }))}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{GRADE_LEVELS.map(gl => <SelectItem key={gl} value={gl}>{gl}׳</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={editData.genderTrack} onValueChange={v => setEditData(d => ({ ...d, genderTrack: v }))}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="boys">בנים</SelectItem><SelectItem value="girls">בנות</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <Input value={editData.homeroomTeacher} onChange={e => setEditData(d => ({ ...d, homeroomTeacher: e.target.value }))} placeholder="מחנך/ת" className="h-10 text-sm" />
                    <Input value={editData.notes} onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))} placeholder="הערות פנימיות לחנ״ג" className="h-10 text-sm" />
                    <Select value={editData.status} onValueChange={v => setEditData(d => ({ ...d, status: v }))}>
                      <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="active">פעילה</SelectItem><SelectItem value="archived">ארכיון</SelectItem></SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="h-9 gap-1 flex-1"><Check className="w-3 h-3" /> שמור</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-9 px-4"><X className="w-3 h-3" /> ביטול</Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base truncate">{cls.name}</h3>
                          <Badge variant={archived ? 'outline' : 'secondary'} className="text-[10px]">{archived ? 'בארכיון' : 'פעילה'}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground mt-1">
                          <span>שכבה {cls.gradeLevel}׳</span>
                          <span>•</span>
                          <span>{GENDER_TRACK_LABELS[cls.genderTrack] || 'בנים'}</span>
                          <span>•</span>
                          <span>{studentCount} תלמידים</span>
                        </div>
                        {cls.homeroomTeacher && <p className="text-xs text-muted-foreground mt-1">מחנך/ת: {cls.homeroomTeacher}</p>}
                        {cls.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cls.notes}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(cls)}><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(cls)}><Copy className="w-3.5 h-3.5" /></Button>
                        {!archived && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleArchive(cls)}><Archive className="w-3.5 h-3.5" /></Button>}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteClassTarget({ id: cls.id, name: cls.name, studentCount })}><Trash2 className="w-3.5 h-3.5 text-destructive/70" /></Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      <QuickAction to={`/class/${cls.id}`} icon={Eye} label="תלמידים" />
                      <QuickAction to={`/class/${cls.id}`} icon={UserCheck} label="נוכחות" />
                      <QuickAction to={`/class/${cls.id}/tests`} icon={ClipboardList} label="מבדקים" />
                      <QuickAction to={`/class/${cls.id}`} icon={Award} label="ציונים" />
                      <QuickAction to="/live-run" icon={Timer} label="ריצה חיה" />
                      <QuickAction to="/reports" icon={BarChart3} label="דוחות" />
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {filteredClasses.length === 0 && (
            <p className="text-center text-muted-foreground py-16 text-sm">
              {data.classes.length === 0 ? 'אין כיתות עדיין. הוסף כיתה חדשה כדי להתחיל.' : 'אין כיתות מתאימות לסינון הנוכחי.'}
            </p>
          )}
        </div>

        <AddClassDialog open={addClassOpen} onOpenChange={setAddClassOpen} onAdd={handleAddClass} defaultGenderTrack={defaultGenderTrack} />

        <ConfirmDeleteDialog
          open={!!deleteClassTarget}
          onOpenChange={() => setDeleteClassTarget(null)}
          title={`מחיקת כיתה ${deleteClassTarget?.name}`}
          description={`פעולה זו תמחק רק את רשומת הכיתה מרשימת הכיתות ולא תמחק ציונים או מבדקים. בכיתה קיימים ${deleteClassTarget?.studentCount || 0} תלמידים, ולכן מומלץ לארכב במקום למחוק אם רוצים לשמור שיוך כיתה פעיל. האם למחוק בכל זאת?`}
          onConfirm={() => { deleteClass(deleteClassTarget.id); setDeleteClassTarget(null); toast.success('הכיתה נמחקה'); }}
        />
      </div>
    </Layout>
  );
}