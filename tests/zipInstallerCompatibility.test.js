import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const installerRequire = createRequire(require.resolve('deno-bin/package.json'));

test('Deno installer extracts the named executable using the patched ZIP dependency', async () => {
  const AdmZip = installerRequire('adm-zip');
  const directory = await mkdtemp(join(tmpdir(), 'pe-zip-compat-'));
  try {
    const archive = new AdmZip();
    archive.addFile('deno', Buffer.from('qa-executable'));
    archive.addFile('unrelated.txt', Buffer.from('extra'));
    const decoded = new AdmZip(archive.toBuffer());
    decoded.extractEntryTo('deno', directory, true, true);
    assert.equal(await readFile(join(directory, 'deno'), 'utf8'), 'qa-executable');
    await assert.rejects(readFile(join(directory, 'unrelated.txt')), { code: 'ENOENT' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
