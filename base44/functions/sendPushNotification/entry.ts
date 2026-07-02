import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, body, url, endpoint } = await req.json();
    if (!title) return Response.json({ error: 'title is required' }, { status: 400 });

    webpush.setVapidDetails(
      'mailto:notifications@smartpejournal.app',
      Deno.env.get('VAPID_PUBLIC_KEY'),
      Deno.env.get('VAPID_PRIVATE_KEY')
    );

    // Target a specific device (by endpoint) or all of the current user's devices
    const query = endpoint ? { endpoint } : {};
    const subs = await base44.entities.PushSubscription.filter(query);
    if (subs.length === 0) {
      return Response.json({ error: 'No push subscriptions found' }, { status: 404 });
    }

    const payload = JSON.stringify({ title, body: body || '', url: url || '/' });
    const results = [];

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        results.push({ endpoint: sub.endpoint, ok: true });
      } catch (err) {
        // Clean up expired/invalid subscriptions
        if (err.statusCode === 404 || err.statusCode === 410) {
          await base44.entities.PushSubscription.delete(sub.id);
        }
        results.push({ endpoint: sub.endpoint, ok: false, error: err.message, statusCode: err.statusCode });
      }
    }

    const sent = results.filter((r) => r.ok).length;
    return Response.json({ sent, total: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});