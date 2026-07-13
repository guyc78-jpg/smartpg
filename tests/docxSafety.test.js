import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DOCX_LIMITS,
  assertDocxRowLimit,
  preflightDocxZip,
  validateDocxExtractionResult,
} from '../base44/functions/parseTestDocx/docxSafety.js';

function makeZipArchive(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const localOffsets = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const localName = encoder.encode(entry.localName || entry.name);
    const compressed = entry.compressed ?? 100;
    const uncompressed = entry.uncompressed ?? 500;
    const flags = entry.flags || 0;
    const method = entry.method ?? 8;
    const crc32 = entry.crc32 ?? 0;
    const part = new Uint8Array(30 + localName.length + (entry.dataLength ?? compressed));
    const view = new DataView(part.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(6, entry.localFlags ?? flags, true);
    view.setUint16(8, entry.localMethod ?? method, true);
    view.setUint32(14, entry.localCrc32 ?? crc32, true);
    view.setUint32(18, entry.localCompressed ?? compressed, true);
    view.setUint32(22, entry.localUncompressed ?? uncompressed, true);
    view.setUint16(26, localName.length, true);
    part.set(localName, 30);
    localOffsets.push(entry.localOffset ?? localOffset);
    localParts.push(part);
    localOffset += part.length;
    assert.ok(name.length > 0);
  }

  const centralParts = entries.map((entry, index) => {
    const name = encoder.encode(entry.name);
    const part = new Uint8Array(46 + name.length);
    const view = new DataView(part.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(8, entry.flags || 0, true);
    view.setUint16(10, entry.method ?? 8, true);
    view.setUint32(16, entry.crc32 ?? 0, true);
    view.setUint32(20, entry.compressed ?? 100, true);
    view.setUint32(24, entry.uncompressed ?? 500, true);
    view.setUint16(28, name.length, true);
    view.setUint32(42, localOffsets[index], true);
    part.set(name, 46);
    return part;
  });
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const centralOffset = localParts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(centralOffset + centralSize + 22);
  let offset = 0;
  for (const part of localParts) {
    output.set(part, offset);
    offset += part.length;
  }
  for (const part of centralParts) {
    output.set(part, offset);
    offset += part.length;
  }
  const eocd = new DataView(output.buffer, centralOffset + centralSize, 22);
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(8, entries.length, true);
  eocd.setUint16(10, entries.length, true);
  eocd.setUint32(12, centralSize, true);
  eocd.setUint32(16, centralOffset, true);
  return output;
}

const requiredEntries = [
  { name: '[Content_Types].xml' },
  { name: 'word/document.xml', compressed: 200, uncompressed: 1000 },
];

test('DOCX preflight accepts a bounded Word central directory', () => {
  const summary = preflightDocxZip(makeZipArchive(requiredEntries));
  assert.equal(summary.entryCount, 2);
  assert.equal(summary.totalUncompressed, 1500);
});

test('DOCX preflight rejects encrypted entries and compression bombs', () => {
  assert.throws(
    () => preflightDocxZip(makeZipArchive([{ ...requiredEntries[0], flags: 1 }, requiredEntries[1]])),
    /Encrypted/,
  );
  assert.throws(
    () => preflightDocxZip(makeZipArchive([
      requiredEntries[0],
      { name: 'word/document.xml', compressed: 10, uncompressed: 5000 },
    ])),
    /compression ratio/,
  );
});

test('DOCX preflight rejects excessive entry counts', () => {
  const extras = Array.from({ length: DOCX_LIMITS.maxEntries - 1 }, (_, index) => ({ name: `word/item-${index}.xml` }));
  assert.throws(
    () => preflightDocxZip(makeZipArchive([...requiredEntries, ...extras])),
    /too many entries/,
  );
});

test('DOCX preflight rejects inconsistent or overlapping local entry headers', () => {
  assert.throws(
    () => preflightDocxZip(makeZipArchive([
      requiredEntries[0],
      { ...requiredEntries[1], localCompressed: 199 },
    ])),
    /local entry sizes are inconsistent/,
  );
  assert.throws(
    () => preflightDocxZip(makeZipArchive([
      { ...requiredEntries[0], dataLength: 10 },
      requiredEntries[1],
    ])),
    /local entries overlap/,
  );
});

test('DOCX extraction result and output row caps are enforced', () => {
  const valid = { tests: [{ test_name: 'run', thresholds: [{ result: '10', grade: 100 }] }] };
  assert.equal(validateDocxExtractionResult(valid), valid);
  assert.throws(
    () => validateDocxExtractionResult({ tests: [{ test_name: 'run', thresholds: new Array(501).fill({}) }] }),
    /too many thresholds/,
  );
  assert.throws(() => assertDocxRowLimit(new Array(DOCX_LIMITS.maxRows + 1)), /too many result rows/);
});
