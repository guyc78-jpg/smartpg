import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Save, Trash2 } from 'lucide-react';
import { validateConversionTable } from '@/lib/conversionValidation.js';
import { formatLongTime, parseLongTime } from '@/lib/timeFormat';

const emptyRow = { minResult: '', maxResult: '', grade: '' };

export default function ConversionTableEditor({ rows = [], unit, timeBased = false, onSave }) {
  const [draftRows, setDraftRows] = useState([]);
  const [error, setError] = useState('');

  const displayValue = (v) => {
    if (v === '' || v === null || v === undefined) return '';
    return timeBased ? formatLongTime(Number(v)) : v;
  };

  const parseValue = (v) => {
    if (v === '' || v === null || v === undefined) return '';
    if (!timeBased) return v;
    const parsed = parseLongTime(String(v).trim());
    return parsed === null ? NaN : parsed;
  };

  useEffect(() => {
    setDraftRows((rows || []).map(row => ({
      minResult: displayValue(row.minResult),
      maxResult: displayValue(row.maxResult),
      grade: row.grade ?? '',
    })));
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, timeBased]);

  const updateRow = (index, field, value) => {
    setDraftRows(current => current.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const saveRows = () => {
    const normalized = draftRows.map(row => ({
      minResult: parseValue(row.minResult),
      maxResult: parseValue(row.maxResult),
      grade: row.grade,
    }));
    const result = validateConversionTable(normalized);
    if (!result.valid) {
      setError(result.message);
      return;
    }
    setError('');
    onSave(result.rows);
  };

  return (
    <div className="space-y-2" dir="rtl">
      <div className="grid grid-cols-[1fr_1fr_1fr_36px] gap-1.5 text-[10px] text-muted-foreground px-1">
        <span>מינימום</span>
        <span>מקסימום</span>
        <span>ציון</span>
        <span />
      </div>

      <div className="space-y-1.5">
        {draftRows.map((row, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_1fr_36px] gap-1.5 items-center">
            <Input type={timeBased ? 'text' : 'number'} inputMode="decimal" min="0" dir="ltr" placeholder={timeBased ? 'דק:שנ' : (unit || 'מ-')} value={row.minResult} onChange={e => updateRow(index, 'minResult', e.target.value)} className="h-8 text-xs text-center" />
            <Input type={timeBased ? 'text' : 'number'} inputMode="decimal" min="0" dir="ltr" placeholder={timeBased ? 'דק:שנ' : (unit || 'עד')} value={row.maxResult} onChange={e => updateRow(index, 'maxResult', e.target.value)} className="h-8 text-xs text-center" />
            <Input type="number" inputMode="numeric" min="0" max="100" placeholder="0-100" value={row.grade} onChange={e => updateRow(index, 'grade', e.target.value)} className="h-8 text-xs text-center" />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDraftRows(current => current.filter((_, i) => i !== index))}>
              <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
            </Button>
          </div>
        ))}
      </div>

      {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={() => setDraftRows(current => [...current, emptyRow])} className="h-8 text-xs">
          <Plus className="w-3.5 h-3.5 ml-1" /> הוסף שורה
        </Button>
        <Button size="sm" onClick={saveRows} className="h-8 text-xs">
          <Save className="w-3.5 h-3.5 ml-1" /> שמור טבלה
        </Button>
      </div>
    </div>
  );
}