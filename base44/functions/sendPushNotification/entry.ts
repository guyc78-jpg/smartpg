import { createClientFromRequest } from 'npm:@base44/sdk';
import webpush from 'npm:web-push@3.6.7';
import { normalizeAllowedPushEndpoint } from './pushEndpointSecurity.js';

const MAX_TITLE_LENGTH = 100;
const MAX_BODY_LENGTH = 300;

function safePath(value: unknown) {
  const path = String(value || '/').trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return '/';
  return path.slice(0, 500);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, body, url, endpoint } = await req.json();
    const normalizedTitle = String(title || '').trim().slice(0, MAX_TITLE_LENGTH);
    const normalizedBody = String(body || '').trim().slice(0, MAX_BODY_LENGTH);
    let normalizedEndpoint;
    try {
      normalizedEndpoint = normalizeAllowedPushEndpoint(endpoint);
    } catch {
      return Response.json({ error: 'A valid push endpoint is required' }, { status: 400 });
    }
    if (!normalizedTitle) return Response.json({ error: 'title is required' }, { status: 400 });

    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    if (!publicKey || !privateKey) {
      return Response.json({ error: 'Push notifications are unavailable' }, { status: 503 });
    }

    webpush.setVapidDetails('mailto:notifications@smartpejournal.app', publicKey, privateKey);

    // A user may send a test notification only to a subscription they own.
    const subs = await base44.entities.PushSubscription.filter({
      endpoint: normalizedEndpoint,
      created_by: user.email,
    });
    const sub = subs?.[0];
    if (!sub) return Response.json({ error: 'Subscription not found' }, { status: 404 });

    const payload = JSON.stringify({ title: normalizedTitle, body: normalizedBody, url: safePath(url) });
    try {
      await webpush.sendNotification(
        { endpoint: normalizedEndpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await base44.entities.PushSubscription.delete(sub.id);
      }
      return Response.json({ error: 'Notification delivery failed' }, { status: 502 });
    }

    return Response.json({ sent: 1 });
  } catch {
    return Response.json({ error: 'Notification request failed' }, { status: 500 });
  }
});
