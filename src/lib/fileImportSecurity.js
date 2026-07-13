export const PRIVATE_FILE_URL_TTL_SECONDS = 300;
export const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_SCHEDULE_IMPORT_ROWS = 2500;
export const MAX_STUDENT_IMPORT_ROWS = 5000;
export const MAX_TEST_IMPORT_ROWS = 5000;

const MIME_BY_EXTENSION = Object.freeze({
  '.csv': new Set(['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel']),
  '.xls': new Set(['application/vnd.ms-excel', 'application/octet-stream']),
  '.xlsx': new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
  ]),
  '.docx': new Set([
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/octet-stream',
  ]),
  '.pdf': new Set(['application/pdf', 'application/octet-stream']),
});

export function getFileExtension(name) {
  const normalized = String(name || '').trim().toLowerCase();
  const dot = normalized.lastIndexOf('.');
  return dot > 0 ? normalized.slice(dot) : '';
}

export function validateImportFile(file, {
  allowedExtensions,
  maxBytes = MAX_IMPORT_FILE_BYTES,
  rejectLegacyDoc = true,
} = {}) {
  if (!file || typeof file !== 'object') throw new Error('לא נבחר קובץ לייבוא.');

  const extension = getFileExtension(file.name);
  if (rejectLegacyDoc && extension === '.doc') {
    throw new Error('קובצי Word ישנים מסוג .doc אינם נתמכים. יש לשמור את הקובץ כ-.docx.');
  }

  const allowed = new Set((allowedExtensions || []).map((value) => String(value).toLowerCase()));
  if (!extension || !allowed.has(extension)) {
    throw new Error(`סוג הקובץ ${extension || 'ללא סיומת'} אינו נתמך.`);
  }

  const size = Number(file.size);
  if (!Number.isFinite(size) || size <= 0) throw new Error('הקובץ ריק או פגום.');
  if (!Number.isFinite(maxBytes) || maxBytes <= 0) throw new Error('מגבלת הקובץ אינה תקינה.');
  if (size > maxBytes) {
    throw new Error(`הקובץ גדול מדי. הגודל המרבי הוא ${Math.floor(maxBytes / (1024 * 1024))}MB.`);
  }

  const mime = String(file.type || '').trim().toLowerCase().split(';', 1)[0];
  const approvedMimes = MIME_BY_EXTENSION[extension];
  // Some mobile browsers omit MIME entirely. When present, it must agree with
  // the extension so a renamed executable is not sent to extraction services.
  if (mime && approvedMimes && !approvedMimes.has(mime)) {
    throw new Error('סוג התוכן של הקובץ אינו תואם לסיומת שלו.');
  }

  return { extension, size, mime };
}

export function enforceRowCap(rows, maxRows, label = 'רשומות') {
  if (!Array.isArray(rows)) throw new Error('מבנה הנתונים שחולץ מהקובץ אינו תקין.');
  if (!Number.isInteger(maxRows) || maxRows <= 0) throw new Error('מגבלת הרשומות אינה תקינה.');
  if (rows.length > maxRows) {
    throw new Error(`הקובץ מכיל יותר מדי ${label}. המגבלה היא ${maxRows}.`);
  }
  return rows;
}

export async function uploadPrivateFileForExtraction(base44Client, file, expiresIn = PRIVATE_FILE_URL_TTL_SECONDS) {
  if (!base44Client?.integrations?.Core) throw new Error('שירות הקבצים אינו זמין.');
  const uploaded = await base44Client.integrations.Core.UploadPrivateFile({ file });
  if (!uploaded?.file_uri) throw new Error('העלאת הקובץ הפרטי נכשלה.');

  const signed = await base44Client.integrations.Core.CreateFileSignedUrl({
    file_uri: uploaded.file_uri,
    expires_in: expiresIn,
  });
  if (!signed?.signed_url) throw new Error('יצירת קישור זמני לקובץ נכשלה.');
  return signed.signed_url;
}
