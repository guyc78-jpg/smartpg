export const DOCX_LIMITS = Object.freeze({
  maxEntries: 256,
  maxEntryUncompressedBytes: 10 * 1024 * 1024,
  maxTotalUncompressedBytes: 25 * 1024 * 1024,
  maxCompressionRatio: 100,
  maxFileNameBytes: 512,
  maxHtmlChars: 2_000_000,
  maxTests: 100,
  maxThresholdsPerTest: 500,
  maxRows: 5000,
});

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const EOCD_MIN_BYTES = 22;
const MAX_ZIP_COMMENT_BYTES = 0xffff;

export class DocxSafetyError extends Error {
  constructor(message, status = 413) {
    super(message);
    this.name = 'DocxSafetyError';
    this.status = status;
  }
}

function toBytes(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  throw new DocxSafetyError('Invalid DOCX byte buffer', 415);
}

function findEndOfCentralDirectory(view, byteLength) {
  const minimumOffset = Math.max(0, byteLength - EOCD_MIN_BYTES - MAX_ZIP_COMMENT_BYTES);
  for (let offset = byteLength - EOCD_MIN_BYTES; offset >= minimumOffset; offset -= 1) {
    if (view.getUint32(offset, true) !== EOCD_SIGNATURE) continue;
    const commentLength = view.getUint16(offset + 20, true);
    if (offset + EOCD_MIN_BYTES + commentLength === byteLength) return offset;
  }
  throw new DocxSafetyError('DOCX central directory was not found', 415);
}

function decodeEntryName(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new DocxSafetyError('DOCX contains an invalid entry name', 415);
  }
}

function isUnsafeEntryName(name) {
  const normalized = name.replaceAll('\\', '/');
  return normalized.startsWith('/')
    || normalized.includes('\0')
    || normalized.split('/').some((part) => part === '..')
    || /^[a-z]:/i.test(normalized);
}

function equalBytes(left, right) {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

export function preflightDocxZip(input, limits = DOCX_LIMITS) {
  const bytes = toBytes(input);
  if (bytes.byteLength < EOCD_MIN_BYTES) throw new DocxSafetyError('File is not a valid DOCX document', 415);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findEndOfCentralDirectory(view, bytes.byteLength);

  const diskNumber = view.getUint16(eocdOffset + 4, true);
  const centralDisk = view.getUint16(eocdOffset + 6, true);
  const entriesOnDisk = view.getUint16(eocdOffset + 8, true);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralSize = view.getUint32(eocdOffset + 12, true);
  const centralOffset = view.getUint32(eocdOffset + 16, true);

  if (diskNumber !== 0 || centralDisk !== 0 || entriesOnDisk !== entryCount) {
    throw new DocxSafetyError('Multi-disk DOCX archives are not supported', 415);
  }
  if (entryCount === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) {
    throw new DocxSafetyError('ZIP64 DOCX archives are not supported', 415);
  }
  if (entryCount === 0 || entryCount > limits.maxEntries) {
    throw new DocxSafetyError(`DOCX contains too many entries (maximum ${limits.maxEntries})`);
  }

  const centralEnd = centralOffset + centralSize;
  if (centralOffset > eocdOffset || centralEnd > eocdOffset || centralEnd < centralOffset) {
    throw new DocxSafetyError('DOCX central directory is outside the file', 415);
  }

  let cursor = centralOffset;
  let totalCompressed = 0;
  let totalUncompressed = 0;
  const names = new Set();
  const localRanges = [];

  for (let index = 0; index < entryCount; index += 1) {
    if (cursor + 46 > centralEnd || view.getUint32(cursor, true) !== CENTRAL_SIGNATURE) {
      throw new DocxSafetyError('DOCX central directory is malformed', 415);
    }

    const flags = view.getUint16(cursor + 8, true);
    const method = view.getUint16(cursor + 10, true);
    const crc32 = view.getUint32(cursor + 16, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const uncompressedSize = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const diskStart = view.getUint16(cursor + 34, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);
    const next = cursor + 46 + nameLength + extraLength + commentLength;

    if (next > centralEnd || nameLength === 0 || nameLength > limits.maxFileNameBytes) {
      throw new DocxSafetyError('DOCX contains a malformed entry', 415);
    }
    if ((flags & 0x0001) !== 0 || (flags & 0x0040) !== 0) {
      throw new DocxSafetyError('Encrypted DOCX entries are not supported', 415);
    }
    if (diskStart !== 0 || (method !== 0 && method !== 8)) {
      throw new DocxSafetyError('DOCX uses an unsupported ZIP feature', 415);
    }
    if (
      compressedSize === 0xffffffff
      || uncompressedSize === 0xffffffff
      || localHeaderOffset === 0xffffffff
    ) {
      throw new DocxSafetyError('ZIP64 DOCX entries are not supported', 415);
    }
    if (uncompressedSize > limits.maxEntryUncompressedBytes) {
      throw new DocxSafetyError('DOCX contains an oversized entry');
    }
    if (uncompressedSize > 0 && compressedSize === 0) {
      throw new DocxSafetyError('DOCX contains an invalid compression size', 415);
    }
    if (uncompressedSize >= 1024 && uncompressedSize / compressedSize > limits.maxCompressionRatio) {
      throw new DocxSafetyError('DOCX compression ratio is unsafe');
    }

    const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
    const name = decodeEntryName(nameBytes).replaceAll('\\', '/');
    if (isUnsafeEntryName(name) || names.has(name)) {
      throw new DocxSafetyError('DOCX contains an unsafe or duplicate entry name', 415);
    }
    names.add(name);

    if (
      localHeaderOffset >= centralOffset
      || localHeaderOffset + 30 > centralOffset
      || view.getUint32(localHeaderOffset, true) !== LOCAL_SIGNATURE
    ) {
      throw new DocxSafetyError('DOCX local entry header is malformed', 415);
    }

    const localFlags = view.getUint16(localHeaderOffset + 6, true);
    const localMethod = view.getUint16(localHeaderOffset + 8, true);
    const localCrc32 = view.getUint32(localHeaderOffset + 14, true);
    const localCompressedSize = view.getUint32(localHeaderOffset + 18, true);
    const localUncompressedSize = view.getUint32(localHeaderOffset + 22, true);
    const localNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    const localNameStart = localHeaderOffset + 30;
    const dataStart = localNameStart + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;

    if (
      localFlags !== flags
      || localMethod !== method
      || localNameLength !== nameLength
      || dataStart > centralOffset
      || dataEnd > centralOffset
      || dataEnd < dataStart
    ) {
      throw new DocxSafetyError('DOCX local entry metadata is inconsistent', 415);
    }

    const localNameBytes = bytes.subarray(localNameStart, localNameStart + localNameLength);
    if (localNameBytes.byteLength !== localNameLength || !equalBytes(localNameBytes, nameBytes)) {
      throw new DocxSafetyError('DOCX local entry name is inconsistent', 415);
    }

    const usesDataDescriptor = (flags & 0x0008) !== 0;
    const localSizesMatch = localCompressedSize === compressedSize
      && localUncompressedSize === uncompressedSize;
    const localDescriptorPlaceholdersAreSafe = usesDataDescriptor
      && (localCrc32 === 0 || localCrc32 === crc32)
      && (localCompressedSize === 0 || localCompressedSize === compressedSize)
      && (localUncompressedSize === 0 || localUncompressedSize === uncompressedSize);
    if (
      (!usesDataDescriptor && (!localSizesMatch || localCrc32 !== crc32))
      || (usesDataDescriptor && !localDescriptorPlaceholdersAreSafe)
    ) {
      throw new DocxSafetyError('DOCX local entry sizes are inconsistent', 415);
    }

    localRanges.push({ start: localHeaderOffset, end: dataEnd });

    totalCompressed += compressedSize;
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > limits.maxTotalUncompressedBytes) {
      throw new DocxSafetyError('DOCX expands beyond the safe size limit');
    }
    cursor = next;
  }

  if (cursor !== centralEnd) throw new DocxSafetyError('DOCX central directory size is inconsistent', 415);
  localRanges.sort((left, right) => left.start - right.start);
  for (let index = 1; index < localRanges.length; index += 1) {
    if (localRanges[index].start < localRanges[index - 1].end) {
      throw new DocxSafetyError('DOCX local entries overlap', 415);
    }
  }
  if (!names.has('[Content_Types].xml') || !names.has('word/document.xml')) {
    throw new DocxSafetyError('File is not a valid Word DOCX document', 415);
  }

  return { entryCount, totalCompressed, totalUncompressed, names: [...names] };
}

export function validateDocxExtractionResult(result, limits = DOCX_LIMITS) {
  if (!result || typeof result !== 'object' || !Array.isArray(result.tests)) {
    throw new DocxSafetyError('Document extraction returned an invalid structure', 422);
  }
  if (result.tests.length > limits.maxTests) {
    throw new DocxSafetyError(`Document contains too many tests (maximum ${limits.maxTests})`, 422);
  }

  let totalRows = 0;
  for (const test of result.tests) {
    if (!test || typeof test !== 'object' || !Array.isArray(test.thresholds)) {
      throw new DocxSafetyError('Document contains an invalid test table', 422);
    }
    if (String(test.test_name || '').length > 200) {
      throw new DocxSafetyError('Document contains an oversized test name', 422);
    }
    if (test.thresholds.length > limits.maxThresholdsPerTest) {
      throw new DocxSafetyError(
        `A test contains too many thresholds (maximum ${limits.maxThresholdsPerTest})`,
        422,
      );
    }
    totalRows += test.thresholds.length;
    if (totalRows > limits.maxRows) {
      throw new DocxSafetyError(`Document contains too many result rows (maximum ${limits.maxRows})`, 422);
    }
  }
  return result;
}

export function assertDocxRowLimit(rows, limits = DOCX_LIMITS) {
  if (!Array.isArray(rows) || rows.length > limits.maxRows) {
    throw new DocxSafetyError(`Document contains too many result rows (maximum ${limits.maxRows})`, 422);
  }
  return rows;
}
