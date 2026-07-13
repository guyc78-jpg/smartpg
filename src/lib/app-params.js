const isNode = typeof window === 'undefined';

const EXPECTED_APP_ID = import.meta.env.VITE_BASE44_APP_ID || '6a1d68f94dec55d128da882f';
const STORAGE_TOKEN_KEY = 'base44_access_token';
const LEGACY_TOKEN_KEY = 'token';

function consumeQueryParams() {
  if (isNode) return {};

  const params = new URLSearchParams(window.location.search);
  const values = {
    appId: params.get('app_id'),
    accessToken: params.get('access_token'),
    functionsVersion: params.get('functions_version'),
    appBaseUrl: params.get('app_base_url'),
    fromUrl: params.get('from_url'),
  };

  if (params.get('clear_access_token') === 'true') {
    window.localStorage.removeItem(STORAGE_TOKEN_KEY);
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  }

  // Access tokens must not remain in browser history, copied URLs, or referrers.
  if (values.accessToken) {
    window.localStorage.setItem(STORAGE_TOKEN_KEY, values.accessToken);
  }
  ['access_token', 'clear_access_token'].forEach((key) => params.delete(key));
  const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
  window.history.replaceState({}, document.title, nextUrl);

  return values;
}

function sameOriginUrl(value, fallback) {
  if (isNode) return fallback;
  try {
    const parsed = new URL(value || fallback, window.location.origin);
    return parsed.origin === window.location.origin ? parsed.origin : fallback;
  } catch {
    return fallback;
  }
}

function safeFromUrl(value) {
  if (isNode) return '/';
  try {
    const parsed = new URL(value || window.location.href, window.location.origin);
    return parsed.origin === window.location.origin ? parsed.toString() : window.location.href;
  } catch {
    return window.location.href;
  }
}

function safeFunctionsVersion(value) {
  const candidate = value || import.meta.env.VITE_BASE44_FUNCTIONS_VERSION || null;
  return typeof candidate === 'string' && /^[A-Za-z0-9._-]{1,64}$/.test(candidate) ? candidate : null;
}

const query = consumeQueryParams();
const configuredBaseUrl = import.meta.env.VITE_BASE44_APP_BASE_URL || (!isNode ? window.location.origin : '');

export const appParams = {
  // Never allow a URL to switch this production client to another Base44 app.
  appId: query.appId === EXPECTED_APP_ID ? query.appId : EXPECTED_APP_ID,
  token: !isNode ? window.localStorage.getItem(STORAGE_TOKEN_KEY) || window.localStorage.getItem(LEGACY_TOKEN_KEY) : null,
  fromUrl: safeFromUrl(query.fromUrl),
  functionsVersion: safeFunctionsVersion(query.functionsVersion),
  appBaseUrl: sameOriginUrl(query.appBaseUrl, sameOriginUrl(configuredBaseUrl, !isNode ? window.location.origin : '')),
};
