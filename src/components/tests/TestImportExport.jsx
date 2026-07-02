import { useRef, useState } from 'react';
import { FileSpreadsheet, FileText, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { exportTestsToExcel, exportTestsToWord, rowsToTests } from '@/lib/testImportExport';
import { parseTestDocx } from '@/functions/parseTestDocx';
import TestImportDialog from '@/components/tests/TestImportDialog.jsx';

export default function TestImportExport({ tests, onImport, defaultGradeLevel }) {
  const fileRef = useRef(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
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
        openPreview(rowsToTests(rows), (data.grade_level || '').replace(/['׳]/g, '').trim());
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
      <button type="button" onClick={() => tests.length ? exportTestsToExcel(tests) : toast.error('אין מבדקים לייצוא בסינון הנוכחי')} className={chip}>
        <FileSpreadsheet className="w-3.5 h-3.5" /> ייצוא Excel
      </button>
      <button type="button" onClick={() => tests.length ? exportTestsToWord(tests) : toast.error('אין מבדקים לייצוא בסינון הנוכחי')} className={chip}>
        <FileText className="w-3.5 h-3.5" /> ייצוא Word
      </button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.doc,.docx,.pdf" className="hidden" onChange={handleFile} />

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