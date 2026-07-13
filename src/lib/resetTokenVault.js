export function createResetTokenVault() {
  let captured = false;
  let token = null;

  const captureFromBrowser = (browser = globalThis.window) => {
    if (captured) return token;
    captured = true;

    if (!browser?.location?.href || typeof browser?.history?.replaceState !== 'function') {
      return null;
    }

    let url;
    try {
      url = new URL(browser.location.href);
    } catch {
      return null;
    }

    if (url.pathname !== '/reset-password' || !url.searchParams.has('token')) {
      return null;
    }

    token = url.searchParams.get('token') || null;
    url.searchParams.delete('token');
    browser.history.replaceState(
      browser.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );
    return token;
  };

  return Object.freeze({
    captureFromBrowser,
    get: () => token,
    clear: () => {
      token = null;
    },
  });
}

export const resetTokenVault = createResetTokenVault();
