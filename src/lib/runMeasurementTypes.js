export const MEASUREMENT_TYPES = [
  { value: 'distance_1500', label: '1500 מ׳' },
  { value: 'distance_2000', label: '2000 מ׳' },
  { value: 'sprint_60', label: 'ספרינט 60 מ׳' },
  { value: 'sprint_80', label: 'ספרינט 80 מ׳' },
  { value: 'sprint_100', label: 'ספרינט 100 מ׳' },
  { value: 'free', label: 'מדידה חופשית' },
];

export function measurementTypeLabel(value) {
  return MEASUREMENT_TYPES.find(t => t.value === value)?.label || value;
}