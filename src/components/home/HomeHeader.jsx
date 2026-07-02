import { useAuth } from '@/lib/AuthContext';
import HeaderMoreMenu from '@/components/app/HeaderMoreMenu';

export default function HomeHeader() {
  const { user } = useAuth();
  const schoolName = typeof window !== 'undefined' ? localStorage.getItem('schoolName') : '';
  const teacherName = typeof window !== 'undefined' ? localStorage.getItem('teacherName') : '';
  const displayName = teacherName || user?.full_name || 'ראשי';

  return (
    <header dir="rtl" className="sticky top-0 z-40 glass-nav px-4 pt-2 pb-1.5" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-right min-w-0">
          <h1 className="text-lg font-black text-foreground truncate leading-tight">{displayName}</h1>
          {schoolName && (
            <p className="text-xs text-muted-foreground truncate leading-tight">{schoolName}</p>
          )}
        </div>
        <HeaderMoreMenu />
      </div>
    </header>
  );
}