import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const keys = webpush.generateVAPIDKeys();
    return Response.json({ publicKey: keys.publicKey, privateKey: keys.privateKey });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});