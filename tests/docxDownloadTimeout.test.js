import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

test('DOCX download timeout covers the body stream after response headers arrive', async () => {
  const source = fs.readFileSync(new URL('../base44/functions/parseTestDocx/entry.ts', import.meta.url), 'utf8');
  const errorClass = source.slice(source.indexOf('class RequestError'), source.indexOf('function isApprovedFileHost'));
  const download = source.slice(source.indexOf('async function fetchApprovedDocx'), source.indexOf('\nDeno.serve('));
  const javascript = ts.transpile(errorClass + download, { target: ts.ScriptTarget.ES2022 });
  const fakeFetch = async (_url, { signal }) => new Response(new ReadableStream({
    start(controller) {
      signal.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')), { once: true });
    },
  }), { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } });
  const getDownload = new Function('fetch', 'MAX_DOCX_BYTES', 'FETCH_TIMEOUT_MS', 'isApprovedFileHost', 'preflightDocxZip', 'DocxSafetyError', javascript + '; return fetchApprovedDocx;');
  const fetchDocument = getDownload(fakeFetch, 1024, 20, () => true, () => {}, class extends Error {});
  await assert.rejects(fetchDocument('https://media.base44.com/test.docx'), error => error.status === 408);
});
