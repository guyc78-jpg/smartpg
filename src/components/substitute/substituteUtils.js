export const STATUS_LABELS = {
  not_reported: 'לא דווח',
  reported: 'דווח',
  paid: 'שולם',
};

export const STATUS_NEXT = {
  not_reported: 'reported',
  reported: 'paid',
  paid: 'not_reported',
};

export const STATUS_STYLES = {
  not_reported: 'bg-destructive/10 text-destructive border-destructive/30',
  reported: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  paid: 'bg-primary/10 text-primary border-primary/30',
};

export function exportFillsCsv(fills, label) {
  const rows = [
    ['תאריך', 'שיעור', 'כיתה', 'סטטוס'],
    ...fills.map(f => [f.date, f.period || '', f.className, STATUS_LABELS[f.status] || f.status]),
  ];
  const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `מילויי-מקום-${label}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}