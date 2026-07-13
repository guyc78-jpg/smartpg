const MAX_PUSH_ENDPOINT_LENGTH = 2048;

const ALLOWED_PUSH_HOSTS = new Set([
  'android.googleapis.com',
  'fcm.googleapis.com',
  'push.services.mozilla.com',
  'updates.push.services.mozilla.com',
  'web.push.apple.com',
]);

const ALLOWED_PUSH_HOST_SUFFIXES = [
  '.notify.windows.com',
  '.push.apple.com',
  '.push.services.mozilla.com',
];

function isAllowedPushHost(hostname) {
  if (ALLOWED_PUSH_HOSTS.has(hostname)) return true;
  return ALLOWED_PUSH_HOST_SUFFIXES.some(
    (suffix) => hostname.length > suffix.length && hostname.endsWith(suffix),
  );
}

export function normalizeAllowedPushEndpoint(value) {
  const endpoint = typeof value === 'string' ? value.trim() : '';
  if (!endpoint || endpoint.length > MAX_PUSH_ENDPOINT_LENGTH) {
    throw new Error('Invalid push endpoint');
  }
  if (/[\\\u0000-\u001f\u007f]/u.test(endpoint)) {
    throw new Error('Invalid push endpoint');
  }

  let parsed;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new Error('Invalid push endpoint');
  }

  if (
    parsed.protocol !== 'https:'
    || parsed.username
    || parsed.password
    || (parsed.port && parsed.port !== '443')
  ) {
    throw new Error('Invalid push endpoint');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/u, '');
  if (!hostname || !isAllowedPushHost(hostname)) {
    throw new Error('Push endpoint host is not allowed');
  }

  return parsed.href;
}
