import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');

    if (!code || !stateParam) {
      return Response.json({ error: 'Missing code or state' }, { status: 400 });
    }

    const state = JSON.parse(atob(stateParam));
    const { user_id, environment } = state;

    const clientId = environment === 'demo'
      ? Deno.env.get('TRADOVATE_DEMO_CLIENT_ID')
      : Deno.env.get('TRADOVATE_LIVE_CLIENT_ID');

    const clientSecret = environment === 'demo'
      ? Deno.env.get('TRADOVATE_DEMO_CLIENT_SECRET')
      : Deno.env.get('TRADOVATE_LIVE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return Response.json({ error: 'Tradovate credentials not configured' }, { status: 500 });
    }

    const baseUrl = environment === 'demo'
      ? 'https://demo.tradovateapi.com'
      : 'https://live.tradovateapi.com';

    const redirectUri = `${new URL(req.url).origin}/api/tradovate-callback`;

    // Exchange code for access token
    const tokenResponse = await fetch(`${baseUrl}/auth/oauthtoken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Tradovate token exchange failed:', errorText);
      return Response.json({ error: 'Failed to exchange authorization code' }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Encrypt and store tokens securely
    const encryptionKey = Deno.env.get('TRADOVATE_ENCRYPTION_KEY');
    const encryptedData = encryptionKey 
      ? await encryptTokens({ access_token, refresh_token }, encryptionKey)
      : JSON.stringify({ access_token, refresh_token }); // Fallback if no encryption key

    // Store tokens in user metadata (or separate entity)
    const tokenField = `tradovate_${environment}_tokens`;
    await base44.asServiceRole.auth.updateUser(user_id, {
      [tokenField]: encryptedData,
      [`tradovate_${environment}_expires_at`]: new Date(Date.now() + expires_in * 1000).toISOString()
    });

    // Redirect back to accounts page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/accounts?tradovate_connected=' + environment
      }
    });

  } catch (error) {
    console.error('Error in Tradovate callback:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});

async function encryptTokens(tokens, keyHex) {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(tokens));
  const keyData = new Uint8Array(keyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Return base64(iv + encrypted)
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}