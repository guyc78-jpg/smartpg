export const WHATSAPP_MESSAGE_TYPES = [
  { key: 'missing_tests', label: 'חוסר במבדקים', studentRequired: true },
  { key: 'frequent_late', label: 'מאחר הרבה', studentRequired: true },
  { key: 'behavior', label: 'התנהגות לא ראויה', studentRequired: true },
  { key: 'uniform', label: 'לא מגיע עם תלבושת', studentRequired: true },
  { key: 'absences', label: 'מחסיר הרבה', studentRequired: true },
  { key: 'nonparticipation', label: 'אי תפקוד בשיעור', studentRequired: true },
  { key: 'general', label: 'הודעה כללית', studentRequired: false },
  { key: 'custom', label: 'אחר / טקסט חופשי', studentRequired: false },
];

const TOPICS = {
  missing_tests: 'חוסר השלמת מבדקים בשיעורי חנ״ג',
  frequent_late: 'איחורים חוזרים לשיעורי חנ״ג',
  behavior: 'התנהגות בשיעורי חנ״ג שדורשת תשומת לב',
  uniform: 'הגעה לשיעורי חנ״ג ללא תלבושת ספורט מתאימה',
  absences: 'היעדרויות חוזרות משיעורי חנ״ג',
  nonparticipation: 'קושי בתפקוד ובהשתתפות בשיעורי חנ״ג',
};

export function getMessageType(key) {
  return WHATSAPP_MESSAGE_TYPES.find(type => type.key === key) || WHATSAPP_MESSAGE_TYPES[6];
}

export function buildWhatsAppMessage({ type, educatorName, className, studentName, note }) {
  const greeting = `שלום ${educatorName || 'מחנכ/ת הכיתה'},`;
  const trimmedNote = String(note || '').trim();

  if (type === 'custom') {
    return [greeting, `רציתי לעדכן בנוגע לכיתה ${className}.`, trimmedNote, 'אשמח לשיתוף פעולה ומעקב.'].filter(Boolean).join('\n');
  }

  if (type === 'general') {
    return [
      greeting,
      `רציתי לעדכן בנוגע לכיתה ${className}.`,
      trimmedNote,
      'אשמח לשיתוף פעולה ומעקב.',
    ].filter(Boolean).join('\n');
  }

  const student = studentName || 'אחד מתלמידי הכיתה';
  return [
    greeting,
    `רציתי לעדכן לגבי התלמיד/ה ${student} מכיתה ${className}, בנושא ${TOPICS[type] || 'השתתפות בשיעורי חנ״ג'}.`,
    trimmedNote,
    'אשמח לשיתוף פעולה ומעקב.',
  ].filter(Boolean).join('\n');
}
