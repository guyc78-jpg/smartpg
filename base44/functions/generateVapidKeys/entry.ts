import { createClientFromRequest } from 'npm:@base44/sdk';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } });
  }
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const keys = webpush.generateVAPIDKeys();

    // Verify the currently stored VAPID pair matches
    let storedPairValid = false;
    try {
      const { createECDH } = await import('node:crypto');
      const toBuf = (s: string) => {
        const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
        return Uint8Array.from(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
      };
      const ecdh = createECDH('prime256v1');
      ecdh.setPrivateKey(toBuf(Deno.env.get('VAPID_PRIVATE_KEY') || ''));
      const derivedPub = ecdh.getPublicKey('base64url');
      storedPairValid = derivedPub === (Deno.env.get('VAPID_PUBLIC_KEY') || '');
    } catch {
      storedPairValid = false;
    }

    return Response.json(
      { publicKey: keys.publicKey, privateKey: keys.privateKey, storedPairValid },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json({ error: 'Unable to generate VAPID keys' }, { status: 500 });
  }
});
