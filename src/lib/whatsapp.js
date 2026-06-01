export function openWhatsApp(phone, message = '') {
  const clean = phone.replace(/[^0-9+]/g, '');
  const intl = clean.startsWith('0') ? '972' + clean.slice(1) : clean;
  const url = `https://wa.me/${intl}${message ? '?text=' + encodeURIComponent(message) : ''}`;
  window.open(url, '_blank');
}

export function buildHomeroomGenericMessage(className) {
  return `שלום, אני פונה אליך בנוגע לכיתה ${className}`;
}