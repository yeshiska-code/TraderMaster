import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { environment } = await req.json();

    if (!environment || !['demo', 'live'].includes(environment)) {
      return Response.json({ error: 'Invalid environment. Must be "demo" or "live"' }, { status: 400 });
    }

    const clientId = environment === 'demo' 
      ? Deno.env.get('TRADOVATE_DEMO_CLIENT_ID')
      : Deno.env.get('TRADOVATE_LIVE_CLIENT_ID');

    if (!clientId) {
      return Response.json({ 
        error: 'Tradovate API credentials not configured. Please contact administrator.' 
      }, { status: 500 });
    }

    const baseUrl = environment === 'demo'
      ? 'https://demo.tradovateapi.com'
      : 'https://live.tradovateapi.com';

    // OAuth redirect URL (replace with your actual domain)
    const redirectUri = `${new URL(req.url).origin}/api/tradovate-callback`;
    
    const state = JSON.stringify({
      user_id: user.id,
      environment,
      timestamp: Date.now()
    });

    const authUrl = `${baseUrl}/auth/oauthauthorize?` + new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state: btoa(state)
    });

    return Response.json({
      success: true,
      auth_url: authUrl,
      environment
    });

  } catch (error) {
    console.error('Error starting Tradovate auth:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});