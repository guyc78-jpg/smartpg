import { useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { exportTestsToExcel, exportTestsToWord, rowsToTests } from '@/lib/testImportExport';
import { parseTestDocx } from '@/functions/parseTestDocx';
import TestImportDialog from '@/components/tests/TestImportDialog.jsx';
import ConfirmDeleteDialog from '@/components/app/ConfirmDeleteDialog';

export default function TestImportExport({ tests, onImport, onDeleteAll, defaultGradeLevel }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const fileRef = useRef(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [parsedTests, setParsedTests] = useState([]);
  const [detectedGradeLevel, setDetectedGradeLevel] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const openPreview = (found, gradeLevel) => {
    if (found.length === 0) {
      toast.error('לא נמצאו מבדקים בקובץ');
      return;
    }
    setDetectedGradeLevel(gradeLevel || '');
    setParsedTests(found);
    setDialogOpen(true);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setParsing(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Word files (e.g. גיליונות אות הכושר) are parsed by a dedicated backend parser
      if (/\.docx?$/i.test(file.name)) {
        const { data } = await parseTestDocx({ file_url });
        if (data.error) throw new Error(data.error);
        const rows = (data.rows || []).map(r => ({ ...r, gender: data.gender || '' }));
        const glMatch = (data.grade_level || '').match(/יב|יא|[זחטי]/);
        openPreview(rowsToTests(rows), glMatch ? glMatch[0] : '');
        return;
      }

      const res = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          description: 'קובץ המכיל מבדקי חינוך גופני עם טבלאות המרה מתוצאה לציון. כל מבדק מזוהה לפי שם המבדק (למשל "ריצת 1000 מטר", "כפיפות בטן", "שכיבות סמיכה"). שים לב: "מינימום", "מקסימום" ו"ציון" הם כותרות עמודות של טבלת ההמרה — הם לעולם אינם שמות מבדקים. יש לחלץ שורה אחת עבור כל שורת טבלת המרה, ולשייך אותה לשם המבדק שאליו הטבלה שייכת.',
          properties: {
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  test_name: { type: 'string', description: 'שם המבדק המלא כפי שמופיע בכותרת המבדק בקובץ (לא כותרת עמודה כמו מינימום/מקסימום/ציון)' },
                  gender: { type: 'string', description: 'בנים או בנות, אם מצוין' },
                  test_type: { type: 'string', description: 'סוג המבדק אם מצוין' },
                  unit: { type: 'string', description: 'יחידת מדידה (שניות/מטרים/חזרות)' },
                  weight: { type: 'number', description: 'משקל בציון אם מצוין' },
                  min_result: { type: 'string', description: 'תוצאת מינימום של הטווח (מספר או זמן בפורמט דק:שנ כמו 2:35)' },
                  max_result: { type: 'string', description: 'תוצאת מקסימום של הטווח (מספר או זמן בפורמט דק:שנ)' },
                  grade: { type: 'number', description: 'הציון (0-100) שמתקבל עבור טווח תוצאות זה' },
                },
              },
            },
          },
        },
      });
      if (res.status !== 'success') throw new Error(res.details || 'extract failed');
      const rows = Array.isArray(res.output) ? res.output : res.output?.rows || [];
      openPreview(rowsToTests(rows), '');
    } catch (err) {
      console.error('Test import failed:', err);
      toast.error('קריאת הקובץ נכשלה. ודא שהקובץ מכיל טבלאות מבדקים.');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async (chosen) => {
    setImporting(true);
    try {
      const count = await onImport(chosen);
      setDialogOpen(false);
      toast.success(`יובאו ${count} מבדקים בהצלחה`);
    } catch (err) {
      console.error('Import failed:', err);
      toast.error('הייבוא נכשל. נסה שוב.');
    } finally {
      setImporting(false);
    }
  };

  const chip = 'liquid-chip h-8 px-3 rounded-full text-xs font-bold flex items-center gap-1.5';

  return (
    <div className="flex items-center gap-1.5 flex-wrap" dir="rtl">
      <button type="button" onClick={() => fileRef.current?.click()} disabled={parsing} className={chip}>
        {parsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        {parsing ? 'קורא קובץ…' : 'ייבוא'}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={chip}>
            <Download className="w-3.5 h-3.5" /> ייצוא
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" dir="rtl">
          <DropdownMenuItem onClick={() => tests.length ? exportTestsToExcel(tests) : toast.error('אין מבדקים לייצוא בסינון הנוכחי')}>
            <FileSpreadsheet className="w-3.5 h-3.5 ml-2" /> ייצוא Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => tests.length ? exportTestsToWord(tests) : toast.error('אין מבדקים לייצוא בסינון הנוכחי')}>
            <FileText className="w-3.5 h-3.5 ml-2" /> ייצוא Word
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isAdmin && onDeleteAll && (
        <button type="button" onClick={() => setDeleteAllOpen(true)} disabled={deletingAll} className={`${chip} text-destructive`}>
          {deletingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          {deletingAll ? 'מוחק…' : 'מחק הכל'}
        </button>
      )}
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.doc,.docx,.pdf" className="hidden" onChange={handleFile} />

      <ConfirmDeleteDialog
        open={deleteAllOpen}
        onOpenChange={setDeleteAllOpen}
        title="מחיקת כל המבדקים"
        description="כל המבדקים וטבלאות ההמרה שלהם יימחקו לצמיתות. פעולה זו לא ניתנת לביטול."
        onConfirm={async () => {
          setDeleteAllOpen(false);
          setDeletingAll(true);
          try {
            const count = await onDeleteAll();
            toast.success(`נמחקו ${count} מבדקים`);
          } catch (err) {
            console.error('Delete all tests failed:', err);
            toast.error('המחיקה נכשלה. נסה שוב.');
          } finally {
            setDeletingAll(false);
          }
        }}
      />

      <TestImportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tests={parsedTests}
        defaultGradeLevel={detectedGradeLevel || defaultGradeLevel}
        onConfirm={handleConfirm}
        importing={importing}
      />
    </div>
  );
}