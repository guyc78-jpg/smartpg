import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { guessScheduleMapping, parseScheduleCsv, parseTeacherReportCsv, extractPeLessons, DAY_LABELS } from '@/lib/scheduleImport';
import {
  enforceRowCap,
  MAX_SCHEDULE_IMPORT_ROWS,
  uploadPrivateFileForExtraction,
  validateImportFile,
} from '@/lib/fileImportSecurity';

const MAPPING_FIELDS = { day: 'יום בשבוע', period: 'שעה/שיעור', className: 'כיתה', subject: 'מקצוע' };

const IMPORT_SCHEMA = {
  type: 'object',
  properties: { rows: { type: 'array', items: { type: 'object', additionalProperties: true } } },
};

export default function ImportScheduleDialog({ open, onOpenChange, onImport }) {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [directPreview, setDirectPreview] = useState(null);

  const columns = useMemo(() => Object.keys(rows[0] || {}), [rows]);
  const mappedPreview = useMemo(() => extractPeLessons(rows, mapping), [rows, mapping]);
  const preview = directPreview || mappedPreview;

  const resetImport = () => {
    setFile(null);
    setRows([]);
    setMapping({});
    setError('');
    setSummary(null);
    setDirectPreview(null);
  };

  const handleFile = async (selectedFile) => {
    setFile(selectedFile);
    setRows([]);
    setSummary(null);
    setError('');
    setDirectPreview(null);
    if (!selectedFile) return;
    setLoading(true);

    try {
      const { extension } = validateImportFile(selectedFile, {
        allowedExtensions: ['.csv', '.xlsx', '.xls'],
      });
      const isCsv = extension === '.csv';
      let importedRows = [];
      if (isCsv) {
        const text = await selectedFile.text();
        const report = parseTeacherReportCsv(text);
        if (report && report.matched > 0) {
          if (report.scanned > MAX_SCHEDULE_IMPORT_ROWS) {
            throw new Error(`הקובץ מכיל יותר מדי שיעורים. המגבלה היא ${MAX_SCHEDULE_IMPORT_ROWS}.`);
          }
          enforceRowCap(report.lessons, MAX_SCHEDULE_IMPORT_ROWS, 'שיעורים');
          setDirectPreview(report);
          return;
        }
        importedRows = enforceRowCap(parseScheduleCsv(text), MAX_SCHEDULE_IMPORT_ROWS, 'שורות');
      } else {
        const signedUrl = await uploadPrivateFileForExtraction(base44, selectedFile);
        const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({ file_url: signedUrl, json_schema: IMPORT_SCHEMA });
        importedRows = enforceRowCap(
          Array.isArray(extracted.output) ? extracted.output : extracted.output?.rows || [],
          MAX_SCHEDULE_IMPORT_ROWS,
          'שורות',
        );
      }

      if (!importedRows.length) {
        setError('לא נמצאו שורות בקובץ. ודא שהקובץ כולל כותרות ורשומות מערכת שעות.');
        return;
      }

      setRows(importedRows);
      setMapping(guessScheduleMapping(Object.keys(importedRows[0] || {})));
    } catch (e) {
      setError(`קריאת הקובץ נכשלה — נסה שוב. (${e?.message || 'שגיאה לא ידועה'})`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setError('');
    if (preview.lessons.length === 0) {
      setError('לא נמצאו שיעורי חינוך גופני תואמים לסינון הנוכחי.');
      return;
    }
    setLoading(true);
    try {
      const result = await onImport(preview.lessons);
      setSummary(result);
    } catch (e) {
      setError(`הייבוא נכשל באמצע — נסה שוב. (${e?.message || 'שגיאה לא ידועה'})`);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-[720px] rounded-2xl max-h-[85vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">ייבוא מערכת שעות — סינון שיעורי חנ״ג</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2 rounded-2xl border border-border p-4">
            <Label className="text-sm font-bold">1. בחירת קובץ מערכת שעות</Label>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={e => handleFile(e.target.files?.[0] || null)} className="w-full text-sm" />
            {file && <p className="text-xs text-muted-foreground">קובץ נבחר: {file.name}</p>}
            {loading && <p className="text-xs text-primary">מעבד את הקובץ...</p>}
            <p className="text-[11px] text-muted-foreground/70">המערכת תסרוק את כל הרשומות ותשמור את כל השיעורים — חנ״ג לפי כיתות, וכן פרטני, חינוך, שהייה וכו׳ — תוך איחוד כפילויות לפי יום, שעה, כיתה ומקצוע.</p>
          </div>

          {directPreview && (
            <p className="text-xs text-primary font-semibold rounded-xl bg-primary/10 p-3">
              זוהה פורמט דוח מערכת שעות למורה — שיעורי החנ״ג והכיתות חולצו אוטומטית, ללא צורך במיפוי עמודות.
            </p>
          )}

          {!directPreview && columns.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-border p-4">
              <Label className="text-sm font-bold">2. מיפוי עמודות</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(MAPPING_FIELDS).map(([field, label]) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{label}</Label>
                    <Select value={mapping[field] || 'none'} onValueChange={value => setMapping(prev => ({ ...prev, [field]: value === 'none' ? '' : value }))}>
                      <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="בחר עמודה" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">ללא מיפוי</SelectItem>
                        {columns.map(column => <SelectItem key={column} value={column}>{column}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(rows.length > 0 || directPreview) && (
            <div className="space-y-3 rounded-2xl border border-border p-4">
              <Label className="text-sm font-bold">3. תוצאות הסינון</Label>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div><div className="font-bold">{preview.scanned}</div><div className="text-[11px] text-muted-foreground">נסרקו</div></div>
                <div><div className="font-bold text-primary">{preview.matched}</div><div className="text-[11px] text-muted-foreground">זוהו כחנ״ג</div></div>
                <div><div className="font-bold">{preview.duplicates}</div><div className="text-[11px] text-muted-foreground">כפילויות אוחדו</div></div>
                <div><div className="font-bold text-primary">{preview.lessons.length}</div><div className="text-[11px] text-muted-foreground">ישמרו</div></div>
              </div>

              {preview.lessons.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-muted/70">
                      <tr>
                        <th className="p-2">יום</th>
                        <th className="p-2">שעה</th>
                        <th className="p-2">מקצוע</th>
                        <th className="p-2">כיתה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.lessons.slice(0, 20).map((lesson, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="p-2">{DAY_LABELS[lesson.dayOfWeek]}</td>
                          <td className="p-2">{lesson.period}</td>
                          <td className="p-2">{lesson.subject}</td>
                          <td className="p-2">{lesson.className}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {preview.lessons.length > 20 && <p className="text-[11px] text-muted-foreground">מוצגות 20 השורות הראשונות בלבד.</p>}
              {preview.invalid > 0 && <p className="text-xs text-destructive">{preview.invalid} רשומות חנ״ג נפסלו עקב יום/שעה/כיתה חסרים.</p>}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {summary && (
            <div className="space-y-2">
              {summary.lessonsSaved === 0 && summary.duplicatesSkipped > 0 ? (
                <p className="text-xs font-semibold rounded-xl bg-primary/10 text-primary p-3">
                  כל {summary.duplicatesSkipped} השיעורים מהקובץ כבר קיימים במערכת השעות — אין מה לייבא מחדש. ניתן לצפות בהם בטאב "מערכת שבועית".
                </p>
              ) : (
                <p className="text-xs font-semibold rounded-xl bg-primary/10 text-primary p-3">
                  הייבוא הושלם בהצלחה!
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border p-3 text-center text-sm">
                <div><div className="font-bold text-primary">{summary.lessonsSaved}</div><div className="text-[11px] text-muted-foreground">שיעורים נשמרו</div></div>
                <div><div className="font-bold text-primary">{summary.classesCreated}</div><div className="text-[11px] text-muted-foreground">כיתות חדשות נוצרו</div></div>
                <div><div className="font-bold">{summary.duplicatesSkipped ?? 0}</div><div className="text-[11px] text-muted-foreground">כבר היו קיימים</div></div>
              </div>
            </div>
          )}

          <div className="flex gap-2 sticky bottom-0 bg-background pt-2">
            <Button onClick={handleImport} disabled={(!rows.length && !directPreview) || loading} className="flex-1 h-11 rounded-xl font-semibold">אשר ייבוא</Button>
            <Button variant="outline" onClick={resetImport} disabled={!file && !rows.length && !directPreview} className="h-11 rounded-xl px-5">מחק קובץ</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 rounded-xl px-5">סגור</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
