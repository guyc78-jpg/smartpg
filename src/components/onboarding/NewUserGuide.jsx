import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  MessageCircle,
  Play,
  School,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STEPS = [
  {
    icon: Sparkles,
    eyebrow: 'ברוכים הבאים',
    title: 'הכירו את יומן חנ״ג חכם',
    description: 'האפליקציה מרכזת את הכיתות, התלמידים, מערכת השעות, המבדקים והדוחות במקום אחד — מותאם לעבודה מהירה גם מהטלפון.',
    tips: ['הניווט הראשי נמצא תמיד בתחתית המסך', 'כל הנתונים נשמרים ומסתנכרנים עם החשבון שלך'],
  },
  {
    icon: School,
    eyebrow: 'שלב 1',
    title: 'מתחילים מכיתות ותלמידים',
    description: 'במסך הראשי מוסיפים כיתה, ואז נכנסים אליה כדי להוסיף תלמידים ידנית או לייבא קובץ Excel/CSV.',
    tips: ['הגדירו לכל כיתה שכבה, מגדר ומחנכים', 'לחיצה על תלמיד פותחת את הפרופיל והציונים שלו'],
  },
  {
    icon: CalendarDays,
    eyebrow: 'שלב 2',
    title: 'מגדירים מערכת שעות',
    description: 'במסך מערכת השעות משבצים את הכיתות. המערכת היומית בראשי תציג אוטומטית את השיעורים הרלוונטיים ותאפשר לתעד נושא שיעור.',
    tips: ['אפשר לייבא מערכת קיימת', 'המערכת היומית מאפשרת מעבר מהיר לכיתה'],
  },
  {
    icon: ClipboardCheck,
    eyebrow: 'שלב 3',
    title: 'מבדקים, ציונים והתנהגות',
    description: 'צרו מבדקים לפי שכבה, הזינו תוצאות ועקבו אחר תלמידים שחסרים להם מבדקים. הציון השנתי מתעדכן לפי ההגדרות שלכם.',
    tips: ['אפשר להעתיק מבדקים בין מחציות', 'בכרטיס תלמיד מוצגים ההתקדמות והמצב העדכני'],
  },
  {
    icon: Play,
    eyebrow: 'שלב 4',
    title: 'מנהלים שיעור וריצה בזמן אמת',
    description: 'הפעילו ריצה חיה מהכיתה או מהמערכת, בחרו משתתפים, מדדו הקפות ושמרו את התוצאות ישירות בפרופיל התלמיד.',
    tips: ['הטיימר ממשיך לפעול גם במעבר בין מסכים', 'ניתן לערוך משתתפים ותוצאות לפני השמירה'],
  },
  {
    icon: BarChart3,
    eyebrow: 'שלב 5',
    title: 'דוחות ותקשורת עם מחנכים',
    description: 'בדוחות תוכלו לראות תמונת מצב כיתתית ואישית. מכרטיס כיתה או תלמיד אפשר להכין הודעת WhatsApp למחנך/ת עם תבנית ותצוגה מקדימה.',
    tips: ['WhatsApp נפתח עם הודעה מוכנה — השליחה נשארת בשליטתכם', 'אפשר לפתוח שוב את המדריך מתפריט שלוש הנקודות'],
  },
];

export default function NewUserGuide({ enabled = true }) {
  const { user, updateCurrentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);
  const completionKey = user?.id || user?.email
    ? `smartpg:onboarding-completed:${user?.id || user?.email}`
    : null;

  useEffect(() => {
    if (!enabled || !user || user.onboarding_completed === true) return;
    const completedLocally = completionKey && localStorage.getItem(completionKey) === 'true';
    if (completedLocally) {
      updateCurrentUser({ onboarding_completed: true });
      base44.auth.updateMe({ onboarding_completed: true }).catch(() => {});
      return;
    }
    setStep(0);
    setOpen(true);
  }, [completionKey, enabled, updateCurrentUser, user]);

  useEffect(() => {
    const openGuide = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener('smartpg:open-onboarding', openGuide);
    return () => window.removeEventListener('smartpg:open-onboarding', openGuide);
  }, []);

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    setOpen(false);
    updateCurrentUser({ onboarding_completed: true });
    if (completionKey) localStorage.setItem(completionKey, 'true');
    try {
      await base44.auth.updateMe({ onboarding_completed: true });
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
      toast.info('המדריך נסגר. הסיום יסתנכרן אוטומטית בחיבור הבא.');
    } finally {
      setSaving(false);
    }
  };

  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        dir="rtl"
        onEscapeKeyDown={event => event.preventDefault()}
        onInteractOutside={event => event.preventDefault()}
        className="flex h-[calc(100dvh-1rem)] max-h-[760px] w-[calc(100vw-1rem)] max-w-lg flex-col overflow-hidden rounded-[2rem] p-0 gap-0 [&>button]:hidden sm:h-auto sm:min-h-[620px]"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-cyan-500/10 px-6 pb-7 pt-8 text-center">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
          <button type="button" onClick={finish} disabled={saving} className="absolute left-5 top-5 z-10 rounded-full px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-background/50 hover:text-foreground disabled:opacity-50">
            דלג
          </button>
          <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/50 bg-background/55 text-primary shadow-xl shadow-primary/15 backdrop-blur-xl dark:border-white/10">
            <Icon className="h-10 w-10" strokeWidth={1.8} />
          </div>
          <DialogHeader className="relative space-y-2 text-center">
            <p className="text-xs font-black tracking-wide text-primary">{current.eyebrow}</p>
            <DialogTitle className="text-center text-2xl font-black leading-tight">{current.title}</DialogTitle>
            <DialogDescription className="mx-auto max-w-md text-center text-sm leading-6">{current.description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-3">
            {current.tips.map((tip, index) => (
              <div key={tip} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/55 p-3.5 shadow-sm backdrop-blur-xl">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm font-medium leading-6 text-foreground">{tip}</p>
                {step === STEPS.length - 1 && index === 0 && <MessageCircle className="mr-auto h-4 w-4 shrink-0 text-emerald-500" />}
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-border/60 bg-background/90 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-[11px] font-bold text-muted-foreground">{step + 1} מתוך {STEPS.length}</span>
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="התקדמות במדריך"
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
              aria-valuenow={step + 1}
              aria-valuetext={`${step + 1} מתוך ${STEPS.length}`}
            >
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <Button type="button" variant="outline" disabled={step === 0 || saving} onClick={() => setStep(value => value - 1)} className="min-h-12 rounded-xl gap-1">
              <ChevronRight className="h-4 w-4" /> הקודם
            </Button>
            <Button type="button" disabled={saving} onClick={() => isLast ? finish() : setStep(value => value + 1)} className="min-h-12 rounded-xl gap-1 font-bold">
              {isLast ? <><Check className="h-4 w-4" /> סיום והתחלה</> : <>הבא <ChevronLeft className="h-4 w-4" /></>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
