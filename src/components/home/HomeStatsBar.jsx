import { Users, Building2 } from 'lucide-react';

export default function HomeStatsBar({ classCount, studentCount }) {
  return (
    <div dir="rtl" className="flex items-center justify-start gap-2 text-xs font-medium text-muted-foreground px-1">
      <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {classCount} כיתות</span>
      <span className="text-border">|</span>
      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {studentCount} תלמידים</span>
    </div>
  );
}