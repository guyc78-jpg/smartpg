/* Service Worker — הודעות פוש בעברית */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

function safeNotificationUrl(value) {
  try {
    const parsed = new URL(String(value || '/'), self.location.origin);
    if (parsed.origin !== self.location.origin) return '/';
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/';
  }
}

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = String(data.title || 'התראה חדשה').slice(0, 100);
  event.waitUntil(
    self.registration.showNotification(title, {
      body: String(data.body || '').slice(0, 300),
      dir: 'rtl',
      lang: 'he',
      data: { url: safeNotificationUrl(data.url) },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = safeNotificationUrl(event.notification.data && event.notification.data.url);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
