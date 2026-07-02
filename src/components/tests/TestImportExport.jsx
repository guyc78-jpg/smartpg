import { useRef, useState } from 'react';
import { FileSpreadsheet, FileText, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { exportTestsToExcel, exportTestsToWord, rowsToTests } from '@/lib/testImportExport';

export default function TestImportExport({ tests, onImport }) {
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  test_name: { type: 'string', description: 'שם המבדק' },
                  grade_level: { type: 'string', description: 'שכבה (ז/ח/ט/י/יא/יב)' },
                  gender: { type: 'string', description: 'בנים או בנות' },
                  test_type: { type: 'string', description: 'סוג המבדק' },
                  unit: { type: 'string', description: 'יחידת מדידה' },
                  weight: { type: 'number', description: 'משקל בציון' },
                  min_result: { type: 'string', description: 'תוצאת מינימום (מספר או דק:שנ)' },
                  max_result: { type: 'string', description: 'תוצאת מקסימום (מספר או דק:שנ)' },
                  grade: { type: 'number', description: 'ציון 0-100' },
                },
              },
            },
          },
        },
      });
      if (res.status !== 'success') throw new Error(res.details || 'extract failed');
      const rows = Array.isArray(res.output) ? res.output : res.output?.rows || [];
      const testsToImport = rowsToTests(rows);
      if (testsToImport.length === 0) {
        toast.error('לא נמצאו מבדקים בקובץ');
        return;
      }
      const count = await onImport(testsToImport);
      toast.success(`יובאו ${count} מבדקים בהצלחה`);
    } catch (err) {
      console.error('Test import failed:', err);
      toast.error('הייבוא נכשל. ודא שהקובץ מכיל טבלת מבדקים תקינה.');
    } finally {
      setImporting(false);
    }
  };

  const chip = 'liquid-chip h-8 px-3 rounded-full text-xs font-bold flex items-center gap-1.5';

  return (
    <div className="flex items-center gap-1.5 flex-wrap" dir="rtl">
      <button type="button" onClick={() => fileRef.current?.click()} disabled={importing} className={chip}>
        {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        {importing ? 'מייבא…' : 'ייבוא'}
      </button>
      <button type="button" onClick={() => tests.length ? exportTestsToExcel(tests) : toast.error('אין מבדקים לייצוא בסינון הנוכחי')} className={chip}>
        <FileSpreadsheet className="w-3.5 h-3.5" /> ייצוא Excel
      </button>
      <button type="button" onClick={() => tests.length ? exportTestsToWord(tests) : toast.error('אין מבדקים לייצוא בסינון הנוכחי')} className={chip}>
        <FileText className="w-3.5 h-3.5" /> ייצוא Word
      </button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.doc,.docx,.pdf" className="hidden" onChange={handleFile} />
    </div>
  );
}