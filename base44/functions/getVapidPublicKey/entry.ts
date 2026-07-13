import { createClientFromRequest } from 'npm:@base44/sdk';

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET, POST' } });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    if (!publicKey) return Response.json({ error: 'Push notifications are unavailable' }, { status: 503 });
    return Response.json({ publicKey }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
  } catch (_error) {
    return Response.json({ error: 'Unable to load push configuration' }, { status: 500 });
  }
});
