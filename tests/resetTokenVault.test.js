import test from 'node:test';
import assert from 'node:assert/strict';
import { createResetTokenVault } from '../src/lib/resetTokenVault.js';

function createBrowser(href) {
  const replacements = [];
  const browser = {
    location: { href },
    history: {
      state: { navigation: 1 },
      replaceState(state, title, url) {
        replacements.push({ state, title, url });
      },
    },
  };
  return { browser, replacements };
}

test('reset token is synchronously vaulted and removed from browser history', () => {
  const vault = createResetTokenVault();
  const { browser, replacements } = createBrowser(
    'https://journal.example/reset-password?token=secret%2Bvalue&source=email#form',
  );

  assert.equal(vault.captureFromBrowser(browser), 'secret+value');
  assert.equal(vault.get(), 'secret+value');
  assert.deepEqual(replacements, [{
    state: { navigation: 1 },
    title: '',
    url: '/reset-password?source=email#form',
  }]);

  vault.clear();
  assert.equal(vault.get(), null);
});

test('reset token vault ignores tokens outside the reset route and captures only once', () => {
  const ignoredVault = createResetTokenVault();
  const ignored = createBrowser('https://journal.example/dashboard?token=not-a-reset-token');
  assert.equal(ignoredVault.captureFromBrowser(ignored.browser), null);
  assert.equal(ignored.replacements.length, 0);

  const vault = createResetTokenVault();
  const first = createBrowser('https://journal.example/reset-password?token=first');
  const second = createBrowser('https://journal.example/reset-password?token=second');
  assert.equal(vault.captureFromBrowser(first.browser), 'first');
  assert.equal(vault.captureFromBrowser(second.browser), 'first');
  assert.equal(second.replacements.length, 0);
});
