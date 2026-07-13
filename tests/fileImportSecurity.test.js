import test from 'node:test';
import assert from 'node:assert/strict';
import {
  enforceRowCap,
  getFileExtension,
  MAX_STUDENT_IMPORT_ROWS,
  uploadPrivateFileForExtraction,
  validateImportFile,
} from '../src/lib/fileImportSecurity.js';

test('getFileExtension normalizes the final extension', () => {
  assert.equal(getFileExtension(' Schedule.Final.XLSX '), '.xlsx');
  assert.equal(getFileExtension('no-extension'), '');
});

test('validateImportFile accepts an approved extension and MIME', () => {
  const result = validateImportFile(
    { name: 'schedule.csv', size: 128, type: 'text/csv; charset=utf-8' },
    { allowedExtensions: ['.csv', '.xlsx'] },
  );
  assert.equal(result.extension, '.csv');
});

test('validateImportFile rejects legacy Word, MIME mismatch, empty, and oversized files', () => {
  assert.throws(
    () => validateImportFile({ name: 'tests.doc', size: 20, type: 'application/msword' }, { allowedExtensions: ['.doc', '.docx'] }),
    /\.doc/,
  );
  assert.throws(
    () => validateImportFile({ name: 'tests.pdf', size: 20, type: 'application/x-msdownload' }, { allowedExtensions: ['.pdf'] }),
    /אינו תואם/,
  );
  assert.throws(
    () => validateImportFile({ name: 'tests.csv', size: 0, type: 'text/csv' }, { allowedExtensions: ['.csv'] }),
    /ריק/,
  );
  assert.throws(
    () => validateImportFile({ name: 'tests.csv', size: 101, type: 'text/csv' }, { allowedExtensions: ['.csv'], maxBytes: 100 }),
    /גדול מדי/,
  );
});

test('enforceRowCap rejects extraction floods', () => {
  assert.equal(MAX_STUDENT_IMPORT_ROWS, 5000);
  assert.equal(enforceRowCap([1, 2], 2).length, 2);
  assert.throws(() => enforceRowCap([1, 2, 3], 2), /המגבלה/);
});

test('uploadPrivateFileForExtraction never uses a public upload and returns a short-lived signed URL', async () => {
  const calls = [];
  const client = {
    integrations: {
      Core: {
        UploadPrivateFile: async ({ file }) => {
          calls.push(['upload', file.name]);
          return { file_uri: 'private://imports/one' };
        },
        CreateFileSignedUrl: async (input) => {
          calls.push(['sign', input]);
          return { signed_url: 'https://media.base44.com/signed' };
        },
      },
    },
  };

  const url = await uploadPrivateFileForExtraction(client, { name: 'one.xlsx' }, 120);
  assert.equal(url, 'https://media.base44.com/signed');
  assert.deepEqual(calls, [
    ['upload', 'one.xlsx'],
    ['sign', { file_uri: 'private://imports/one', expires_in: 120 }],
  ]);
});
