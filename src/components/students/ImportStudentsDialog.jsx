import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';

const FIELD_LABELS = {
  lastName: 'שם משפחה',
  firstName: 'שם פרטי',
  gender: 'מגדר',
  className: 'כיתה',
  gradeLevel: 'שכבה',
  peNotes: 'הערות חנ״ג',
  medicalLimitations: 'פטור/מגבלה רפואית',
};

const IMPORT_SCHEMA = {
  type: 'object',
  properties: {
    rows: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  const headers = rows[0] || [];
  return rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header || `עמודה ${index + 1}`, values[index] || ''])));
}

function guessMapping(columns) {
  const find = (...words) => columns.find(col => words.some(word => col.toLowerCase().includes(word.toLowerCase()))) || '';
  return {
    lastName: find('שם משפחה', 'משפחה', 'last'),
    firstName: find('שם פרטי', 'פרטי', 'first'),
    gender: find('מגדר', 'מין', 'gender'),
    className: find('כיתה', 'class'),
    gradeLevel: find('שכבה', 'grade'),
    peNotes: find('הערות', 'חנ״ג', 'notes'),
    medicalLimitations: find('פטור', 'מגבלה', 'רפוא', 'medical'),
  };
}

function normalizeGender(value) {
  const text = String(value || '').trim().toLowerCase();
  if (['בת', 'בנות', 'נקבה', 'girl', 'girls', 'female'].includes(text)) return 'girls';
  if (['אחר', 'other'].includes(text)) return 'other';
  return text ? 'boys' : '';
}

function isExemptText(value) {
  const text = String(value || '').trim();
  return Boolean(text && !['לא', 'אין', 'no', 'false', '0'].includes(text.toLowerCase()));
}

export default function ImportStudentsDialog({ open, onOpenChange, onImport, classes, defaultClassId }) {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [clearFileAfterImport, setClearFileAfterImport] = useState(true);

  const columns = useMemo(() => Object.keys(rows[0] || {}), [rows]);
  const classByName = useMemo(() => new Map(classes.map(cls => [cls.name.trim(), cls])), [classes]);
  const defaultClass = classes.find(cls => cls.id === defaultClassId);

  const mappedRows = useMemo(() => rows.map((row, index) => {
    const className = mapping.className ? String(row[mapping.className] || '').trim() : defaultClass?.name || '';
    const matchedClass = classByName.get(className) || (defaultClass && !mapping.className ? defaultClass : null);
    const item = {
      rowNumber: index + 1,
      lastName: mapping.lastName ? String(row[mapping.lastName] || '').trim() : '',
      firstName: mapping.firstName ? String(row[mapping.firstName] || '').trim() : '',
      gender: normalizeGender(mapping.gender ? row[mapping.gender] : ''),
      className,
      classId: matchedClass?.id || '',
      gradeLevel: mapping.gradeLevel ? String(row[mapping.gradeLevel] || '').trim() : matchedClass?.gradeLevel || '',
      peNotes: mapping.peNotes ? String(row[mapping.peNotes] || '').trim() : '',
      medicalLimitations: mapping.medicalLimitations ? String(row[mapping.medicalLimitations] || '').trim() : '',
    };
    item.peExempt = isExemptText(item.medicalLimitations);
    item.error = !item.lastName || !item.firstName || !item.classId
      ? 'חסרים שם משפחה, שם פרטי או כיתה תקינה'
      : '';
    return item;
  }), [rows, mapping, classByName, defaultClass]);

  const validationErrors = mappedRows.filter(row => row.error);

  const resetImport = () => {
    setFile(null);
    setRows([]);
    setMapping({});
    setError('');
  };

  const handleFile = async (selectedFile) => {
    setFile(selectedFile);
    setRows([]);
    setSummary(null);
    setError('');
    if (!selectedFile) return;
    setLoading(true);

    const isCsv = selectedFile.name.toLowerCase().endsWith('.csv');
    let importedRows = [];
    if (isCsv) {
      importedRows = parseCsv(await selectedFile.text());
    } else {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({ file_url, json_schema: IMPORT_SCHEMA });
      importedRows = Array.isArray(extracted.output) ? extracted.output : extracted.output?.rows || [];
    }

    if (!importedRows.length) {
      setError('לא נמצאו שורות בקובץ. ודא שהקובץ כולל כותרות ונתוני תלמידים.');
      setLoading(false);
      return;
    }

    setRows(importedRows);
    setMapping(guessMapping(Object.keys(importedRows[0] || {})));
    setLoading(false);
  };

  const handleImport = async () => {
    setError('');
    if (validationErrors.length) {
      setError('יש לתקן שורות חסרות לפני הייבוא.');
      return;
    }
    setLoading(true);
    const result = await onImport(mappedRows.map(row => ({
      firstName: row.firstName,
      lastName: row.lastName,
      gender: row.gender,
      classId: row.classId,
      peNotes: row.peNotes,
      medicalLimitations: row.medicalLimitations,
      peExempt: row.peExempt,
    })));
    setSummary(result);
    if (clearFileAfterImport) resetImport();
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[760px] rounded-2xl max-h-[88vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">ייבוא תלמידים מ־Excel/CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2 rounded-2xl border border-border p-4">
            <Label className="text-sm font-bold">1. בחירת קובץ</Label>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={e => handleFile(e.target.files?.[0] || null)} className="w-full text-sm" />
            {file && <p className="text-xs text-muted-foreground">קובץ נבחר: {file.name}</p>}
            {loading && <p className="text-xs text-primary">מעבד את הקובץ...</p>}
          </div>

          {columns.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-border p-4">
              <Label className="text-sm font-bold">2. מיפוי עמודות</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(FIELD_LABELS).map(([field, label]) => (
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

          {mappedRows.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-bold">3. תצוגה מקדימה</Label>
                <span className="text-xs text-muted-foreground">{mappedRows.length} שורות</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs text-right min-w-[660px]">
                  <thead className="bg-muted/70">
                    <tr>
                      <th className="p-2">שורה</th>
                      <th className="p-2">שם משפחה</th>
                      <th className="p-2">שם פרטי</th>
                      <th className="p-2">מגדר</th>
                      <th className="p-2">כיתה</th>
                      <th className="p-2">הערות/רפואי</th>
                      <th className="p-2">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedRows.slice(0, 20).map(row => (
                      <tr key={row.rowNumber} className="border-t border-border">
                        <td className="p-2">{row.rowNumber}</td>
                        <td className="p-2">{row.lastName || '—'}</td>
                        <td className="p-2">{row.firstName || '—'}</td>
                        <td className="p-2">{row.gender || '—'}</td>
                        <td className="p-2">{row.className || '—'}</td>
                        <td className="p-2 truncate max-w-[160px]">{row.peNotes || row.medicalLimitations || '—'}</td>
                        <td className={`p-2 font-semibold ${row.error ? 'text-destructive' : 'text-primary'}`}>{row.error || 'תקין'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mappedRows.length > 20 && <p className="text-[11px] text-muted-foreground">מוצגות 20 השורות הראשונות בלבד.</p>}
              {validationErrors.length > 0 && <p className="text-xs text-destructive">נמצאו {validationErrors.length} שורות עם שגיאות. חובה למפות שם משפחה, שם פרטי וכיתה תקינה לפני הייבוא.</p>}
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-border p-3">
            <Checkbox checked={clearFileAfterImport} onCheckedChange={v => setClearFileAfterImport(Boolean(v))} />
            <span className="text-sm">למחוק את הקובץ מהמסך לאחר הייבוא</span>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {summary && (
            <div className="grid grid-cols-4 gap-2 rounded-2xl border border-border p-3 text-center text-sm">
              <div><div className="font-bold text-primary">{summary.added}</div><div className="text-[11px] text-muted-foreground">נוספו</div></div>
              <div><div className="font-bold text-primary">{summary.updated}</div><div className="text-[11px] text-muted-foreground">עודכנו</div></div>
              <div><div className="font-bold">{summary.skipped}</div><div className="text-[11px] text-muted-foreground">דולגו</div></div>
              <div><div className="font-bold text-destructive">{summary.errors?.length || 0}</div><div className="text-[11px] text-muted-foreground">שגיאות</div></div>
            </div>
          )}

          <div className="flex gap-2 sticky bottom-0 bg-background pt-2">
            <Button onClick={handleImport} disabled={!mappedRows.length || loading || validationErrors.length > 0} className="flex-1 h-11 rounded-xl font-semibold">אשר ייבוא</Button>
            <Button variant="outline" onClick={resetImport} disabled={!file && !rows.length} className="h-11 rounded-xl px-5">מחק קובץ</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 rounded-xl px-5">סגור</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}