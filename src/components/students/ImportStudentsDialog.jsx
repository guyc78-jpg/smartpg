import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';

const IMPORT_SCHEMA = {
  type: 'object',
  properties: {
    students: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          name: { type: 'string' },
          gender: { type: 'string' },
          study_group: { type: 'string' },
          medical_limitations: { type: 'string' },
          pe_notes: { type: 'string' }
        }
      }
    }
  }
};

function normalizeImportedStudent(row) {
  const fullName = (row.name || '').trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  return {
    firstName: row.first_name || row.firstName || (parts.length > 1 ? parts.slice(1).join(' ') : fullName),
    lastName: row.last_name || row.lastName || (parts.length > 1 ? parts[0] : ''),
    gender: row.gender === 'girls' || row.gender === 'בת' || row.gender === 'נקבה' ? 'girls' : row.gender === 'other' ? 'other' : 'boys',
    studyGroup: row.study_group || row.studyGroup || '',
    medicalLimitations: row.medical_limitations || row.medicalLimitations || '',
    peNotes: row.pe_notes || row.peNotes || '',
    peExempt: Boolean(row.pe_exempt || row.peExempt),
  };
}

export default function ImportStudentsDialog({ open, onOpenChange, onImport }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({ file_url, json_schema: IMPORT_SCHEMA });
    const rows = Array.isArray(extracted.output) ? extracted.output : extracted.output?.students;
    if (!rows?.length) {
      setError('לא נמצאו תלמידים בקובץ. ודא שיש עמודות שם פרטי/שם משפחה או שם מלא.');
      setLoading(false);
      return;
    }
    await onImport(rows.map(normalizeImportedStudent));
    setFile(null);
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px] rounded-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">ייבוא תלמידים מ־Excel/CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">בחר קובץ</Label>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm" />
          </div>
          <p className="text-xs text-muted-foreground">מומלץ לכלול עמודות: שם משפחה, שם פרטי, מגדר, קבוצת לימוד, מגבלות רפואיות והערות.</p>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleImport} disabled={!file || loading} className="flex-1 h-10 rounded-xl">{loading ? 'מייבא...' : 'ייבא'}</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 rounded-xl px-5">ביטול</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}