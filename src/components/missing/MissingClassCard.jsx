import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, MessageCircle, PenLine } from 'lucide-react';
import { formatStudentName } from '@/lib/studentName';
import WhatsAppMessageDialog from '@/components/whatsapp/WhatsAppMessageDialog';

export default function MissingClassCard({ cls, testGroups, totalMissing }) {
  const [open, setOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState(null);
  const contacts = useMemo(() => (Array.isArray(cls.homeroomContacts) ? cls.homeroomContacts : []).map((contact, index) => ({
    id: contact.id || `educator_${cls.id}_${index}`,
    name: contact.name || '',
    phone: contact.phone || '',
  })), [cls.id, cls.homeroomContacts]);
  const missingByStudent = useMemo(() => {
    const map = new Map();
    testGroups.forEach(group => {
      group.students.forEach(student => {
        const current = map.get(student.id) || { student, testNames: [] };
        if (!current.testNames.includes(group.test.name)) current.testNames.push(group.test.name);
        map.set(student.id, current);
      });
    });
    return map;
  }, [testGroups]);

  const classSummary = useMemo(() => [
    `בכיתה ${cls.name} קיימים ${totalMissing} חוסרים במבדקים:`,
    ...testGroups.map(group => `• ${group.test.name}: ${group.students.length} תלמידים`),
  ].join('\n'), [cls.name, testGroups, totalMissing]);

  const openStudentMessage = student => {
    const missing = missingByStudent.get(student.id);
    setMessageDraft({
      student,
      students: [student],
      messageType: 'missing_tests',
      missingTestNames: missing?.testNames || [],
      note: '',
    });
  };

  const openClassSummary = () => setMessageDraft({
    student: null,
    students: [],
    messageType: 'general',
    missingTestNames: [],
    note: classSummary,
  });

  return (
    <>
      <div className="card-3d rounded-2xl overflow-hidden" dir="rtl">
        <div className="flex items-center gap-1 px-2">
          <button onClick={() => setOpen(o => !o)} aria-expanded={open} className="min-w-0 flex-1 flex items-center justify-between gap-2 px-2 py-3 text-right">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-[15px] truncate">{cls.name}</span>
              <span className="shrink-0 rounded-full bg-destructive/10 text-destructive text-[11px] font-black px-2.5 py-0.5">
                {totalMissing} חוסרים
              </span>
            </div>
            {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
          </button>
          <button
            type="button"
            onClick={openClassSummary}
            aria-label={`שליחת סיכום חוסרים של ${cls.name} למחנכ/ת`}
            title="שליחת סיכום חוסרים למחנכ/ת"
            className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
        {open && (
          <div className="px-4 pb-3 space-y-3">
            {testGroups.map(group => (
              <div key={group.test.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground">{group.test.name} · {group.students.length} תלמידים</span>
                  <Link to={`/class/${cls.id}/tests`} className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline shrink-0">
                    <PenLine className="w-3 h-3" />
                    להזנה
                  </Link>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-start">
                  {group.students.map(student => (
                    <div key={student.id} className="inline-flex items-center overflow-hidden rounded-lg bg-muted transition-colors hover:bg-secondary">
                      <Link to={`/class/${cls.id}/student/${student.id}`} className="px-2 py-1 text-[11px] font-semibold">
                        {formatStudentName(student)}
                      </Link>
                      <button
                        type="button"
                        onClick={() => openStudentMessage(student)}
                        aria-label={`שליחת הודעה למחנכ/ת על החוסרים של ${formatStudentName(student)}`}
                        title="שליחת חוסרים למחנכ/ת"
                        className="h-7 w-7 border-r border-border/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <WhatsAppMessageDialog
        open={!!messageDraft}
        onOpenChange={nextOpen => { if (!nextOpen) setMessageDraft(null); }}
        cls={cls}
        contacts={contacts}
        students={messageDraft?.students || []}
        initialStudentId={messageDraft?.student?.id}
        initialMessageType={messageDraft?.messageType || 'general'}
        initialNote={messageDraft?.note || ''}
        missingTestNames={messageDraft?.missingTestNames || []}
      />
    </>
  );
}
