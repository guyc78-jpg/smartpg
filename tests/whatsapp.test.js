import test from 'node:test';
import assert from 'node:assert/strict';
import { getWhatsAppUrl, isValidWhatsAppPhone, normalizeWhatsAppPhone } from '../src/lib/whatsapp.js';
import { buildWhatsAppMessage } from '../src/lib/whatsappTemplates.js';

test('Israeli local mobile numbers are normalized to E.164', () => {
  assert.equal(normalizeWhatsAppPhone('050-123-4567'), '972501234567');
  assert.equal(isValidWhatsAppPhone('050-123-4567'), true);
});

test('ambiguous numbers without a country prefix are rejected', () => {
  assert.equal(isValidWhatsAppPhone('501234567'), false);
});

test('WhatsApp URL encodes the message safely', () => {
  assert.equal(getWhatsAppUrl('+972501234567', 'שלום עולם'), 'https://wa.me/972501234567?text=%D7%A9%D7%9C%D7%95%D7%9D%20%D7%A2%D7%95%D7%9C%D7%9D');
});

test('international numbers that pass validation also produce a WhatsApp URL', () => {
  assert.equal(isValidWhatsAppPhone('+1 202-555-0123'), true);
  assert.equal(getWhatsAppUrl('+1 202-555-0123', 'hello'), 'https://wa.me/12025550123?text=hello');
  assert.equal(isValidWhatsAppPhone('0044 7700 900123'), true);
  assert.equal(getWhatsAppUrl('0044 7700 900123'), 'https://wa.me/447700900123');
});

test('missing tests message includes the student and unique relevant test names', () => {
  const message = buildWhatsAppMessage({
    type: 'missing_tests',
    educatorName: 'יעל',
    className: 'ח׳1',
    studentName: 'דני כהן',
    missingTestNames: ['ריצת 2,000', 'מתח', 'ריצת 2,000'],
  });

  assert.match(message, /דני כהן/);
  assert.match(message, /המבדקים החסרים: ריצת 2,000, מתח\./);
  assert.equal((message.match(/ריצת 2,000/g) || []).length, 1);
});
