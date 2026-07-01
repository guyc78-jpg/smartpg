import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, Clock, ShieldCheck } from 'lucide-react';
import { formatStudentName } from '@/lib/studentName';
import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_LABELS } from '@/lib/types';

const STATUS_CONFIG = {
  present: { icon: Check, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
  absent: { icon: X, color: 'text-destructive', bg: 'bg-destructive/10' },
  late: { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  excused: { icon: ShieldCheck, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
};

export default function AttendanceTab({ students, attendance, date, onSave, loading }) {
  const [selectedDate, setSelectedDate] = useState(date);
  const [pendingChanges, setPendingChanges] = useState({});

  const dayAttendance = useMemo(
    () => attendance.filter(a => a.date === selectedDate),
    [attendance, selectedDate]
  );

  const getStatus = (studentId) => {
    if (pendingChanges[studentId]) return pendingChanges[studentId];
    const record = dayAttendance.find(a => a.studentId === studentId);
    return record?.status || 'present';
  };

  const handleStatusChange = (studentId, status) => {
    setPendingChanges(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    for (const [studentId, status] of Object.entries(pendingChanges)) {
      await onSave(studentId, selectedDate, status);
    }
    setPendingChanges({});
  };

  const presentCount = students.filter(s => getStatus(s.id) === 'present').length;
  const absentCount = students.filter(s => getStatus(s.id) === 'absent').length;

  return (
    <Card className="card-3d rounded-2xl p-3 space-y-3" dir="rtl">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="font-bold text-sm">נוכחות</div>
        <div className="flex items-center gap-2">
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="h-8 w-auto text-xs" />
        </div>
      </div>

      <div className="flex gap-2 text-xs">
        <Badge variant="secondary" className="text-[10px]">{presentCount} נוכחים</Badge>
        <Badge variant="secondary" className="text-[10px]">{absentCount} נעדרים</Badge>
        <Badge variant="secondary" className="text-[10px]">{students.length} סה״כ</Badge>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {students.map(student => {
              const status = getStatus(student.id);
              return (
                <div key={student.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-2 py-1.5">
                  <span className="text-xs font-medium truncate">{formatStudentName(student)}</span>
                  <div className="flex gap-0.5 shrink-0">
                    {ATTENDANCE_STATUSES.map(s => {
                      const config = STATUS_CONFIG[s];
                      const Icon = config.icon;
                      const active = status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(student.id, s)}
                          className={`h-7 w-7 flex items-center justify-center rounded-lg transition-colors ${active ? config.bg : 'hover:bg-muted/50'}`}
                          title={ATTENDANCE_STATUS_LABELS[s]}
                        >
                          <Icon className={`w-3.5 h-3.5 ${active ? config.color : 'text-muted-foreground'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {students.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">אין תלמידים בכיתה</p>}
          </div>

          {Object.keys(pendingChanges).length > 0 && (
            <Button onClick={handleSave} className="w-full h-9 text-xs gap-1">
              שמור נוכחות ({Object.keys(pendingChanges).length})
            </Button>
          )}
        </>
      )}
    </Card>
  );
}