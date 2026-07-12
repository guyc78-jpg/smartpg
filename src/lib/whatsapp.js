export function normalizeWhatsAppPhone(phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `972${digits.slice(1)}`;
  return digits;
}

export function isValidWhatsAppPhone(phone) {
  const normalized = normalizeWhatsAppPhone(phone);
  return normalized.length >= 8 && normalized.length <= 15;
}

export function getWhatsAppUrl(phone, message = '') {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!isValidWhatsAppPhone(normalized)) return null;
  return `https://wa.me/${normalized}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

export function openWhatsApp(phone, message = '') {
  const url = getWhatsAppUrl(phone, message);
  if (!url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

export function buildHomeroomGenericMessage(className) {
  return `שלום, אני פונה אליך בנוגע לכיתה ${className}`;
}
