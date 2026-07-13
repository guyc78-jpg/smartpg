export function normalizeWhatsAppPhone(phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `972${digits.slice(1)}`;
  return digits;
}

export function isValidWhatsAppPhone(phone) {
  const raw = String(phone || '').trim();
  const hasExplicitCountry = raw.startsWith('+') || raw.startsWith('00') || raw.replace(/\D/g, '').startsWith('972');
  const isIsraeliLocal = raw.replace(/\D/g, '').startsWith('0');
  if (!hasExplicitCountry && !isIsraeliLocal) return false;
  const normalized = normalizeWhatsAppPhone(phone);
  return /^[1-9]\d{9,14}$/.test(normalized);
}

export function getWhatsAppUrl(phone, message = '') {
  if (!isValidWhatsAppPhone(phone)) return null;
  const normalized = normalizeWhatsAppPhone(phone);
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
