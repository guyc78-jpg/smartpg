import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLongTime, formatShortTime, parseLongTime, parseShortTime } from '../src/lib/timeFormat.js';

test('time formatting carries hundredths across second and minute boundaries', () => {
  assert.equal(formatLongTime(59.999), '01:00');
  assert.equal(formatShortTime(9.999), '10.00');
  assert.equal(formatLongTime(3599.999), '60:00');
  assert.equal(formatLongTime(240.01), '04:00.01');
});

test('time parsers reject malformed measurements instead of accepting partial numbers', () => {
  for (const value of ['01:99', '1:60', '12junk', '1:2junk', '-1', '', 'Infinity', '1:2:3', '1e3']) {
    assert.equal(parseLongTime(value), null, value);
  }
  assert.equal(parseShortTime('9.30sec'), null);
  assert.equal(parseShortTime('-3'), null);
  assert.equal(parseLongTime(' 04:00.01 '), 240.01);
  assert.equal(parseLongTime('0'), 0);
  assert.equal(parseLongTime('1:02'), 62);
});

test('time import and export preserve distinct conversion boundaries', () => {
  for (const value of [0, 9.3, 59.99, 60, 240.01, 86400]) {
    assert.equal(parseLongTime(formatLongTime(value)), value);
    assert.equal(parseShortTime(formatShortTime(value)), value);
  }
  for (const value of [NaN, Infinity, -1, null, undefined, '']) {
    assert.equal(formatLongTime(value), '');
    assert.equal(formatShortTime(value), '');
  }
});
