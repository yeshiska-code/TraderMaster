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
      return Response.json({ error: 'Invalid environment' }, { status: 400 });
    }

    // Clear tokens
    const updates = {
      [`tradovate_${environment}_tokens`]: null,
      [`tradovate_${environment}_expires_at`]: null
    };

    await base44.auth.updateMe(updates);

    return Response.json({
      success: true,
      message: `Tradovate ${environment} disconnected successfully`
    });

  } catch (error) {
    console.error('Error disconnecting Tradovate:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});