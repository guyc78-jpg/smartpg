import { Users, Building2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import HeaderActions from '@/components/app/HeaderActions';

export default function HomeHeader({ classCount, studentCount }) {
  const { user } = useAuth();
  const schoolName = typeof window !== 'undefined' ? localStorage.getItem('schoolName') : '';
  const teacherName = typeof window !== 'undefined' ? localStorage.getItem('teacherName') : '';

  return (
    <header dir="rtl" className="sticky top-0 z-40 glass-nav px-4 pt-2 pb-1.5" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-right min-w-0">
          <h1 className="text-lg font-black text-foreground truncate leading-tight">ראשי</h1>
          {(schoolName || teacherName || user?.full_name) && (
            <p className="text-xs text-muted-foreground truncate leading-tight">
              {schoolName || teacherName || user?.full_name}
            </p>
          )}
        </div>
        <HeaderActions />
      </div>

      <div className="flex items-center justify-start gap-2 mt-1 text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {classCount} כיתות</span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {studentCount} תלמידים</span>
      </div>
    </header>
  );
}