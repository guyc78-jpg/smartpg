export function getActionErrorMessage(error, fallback) {
  const status = Number(error?.response?.status ?? error?.status);
  if (status === 401) return 'ההתחברות פגה. התחברו מחדש ונסו שוב.';
  if (status === 403) return 'אין הרשאה לבצע את הפעולה. פנו למנהל האפליקציה אם ההרשאה נדרשת.';
  if (status === 408 || status === 504) return 'הפעולה ארכה זמן רב מדי. בדקו את החיבור ונסו שוב.';
  if (status === 429) return 'בוצעו יותר מדי פעולות ברצף. המתינו רגע ונסו שוב.';
  if (status === 400 || status === 422) return 'הנתונים לא תקינים. בדקו את השדות ונסו שוב.';

  // Locally validated Hebrew messages may be shown; raw server details may not.
  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  if (!error?.response && !Number.isFinite(status) && message.length <= 280 && /[\u0590-\u05ff]/u.test(message)) {
    return message;
  }
  return fallback;
}
