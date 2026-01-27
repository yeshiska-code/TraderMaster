import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { environment, account_id } = await req.json();

    if (!environment || !['demo', 'live'].includes(environment)) {
      return Response.json({ error: 'Invalid environment' }, { status: 400 });
    }

    // Get tokens from user
    const tokenField = `tradovate_${environment}_tokens`;
    const encryptedTokens = user[tokenField];

    if (!encryptedTokens) {
      return Response.json({ 
        error: `Tradovate ${environment} not connected. Please authorize first.` 
      }, { status: 400 });
    }

    const encryptionKey = Deno.env.get('TRADOVATE_ENCRYPTION_KEY');
    const tokens = encryptionKey
      ? await decryptTokens(encryptedTokens, encryptionKey)
      : JSON.parse(encryptedTokens);

    const baseUrl = environment === 'demo'
      ? 'https://demo.tradovateapi.com/v1'
      : 'https://live.tradovateapi.com/v1';

    const headers = {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json'
    };

    // Fetch accounts
    const accountsRes = await fetch(`${baseUrl}/account/list`, { headers });
    
    if (!accountsRes.ok) {
      const error = await accountsRes.text();
      console.error('Failed to fetch Tradovate accounts:', error);
      return Response.json({ error: 'Failed to fetch accounts from Tradovate' }, { status: 500 });
    }

    const tradovateAccounts = await accountsRes.json();
    const accountsCreated = [];

    // Sync accounts
    for (const tvAccount of tradovateAccounts) {
      const existing = await base44.asServiceRole.entities.TradingAccount.filter({
        user_id: user.id,
        tradovate_account_id: String(tvAccount.id)
      });

      const accountData = {
        user_id: user.id,
        account_name: tvAccount.name || `Tradovate ${environment.toUpperCase()}`,
        broker: 'tradovate',
        account_type: environment === 'demo' ? 'demo' : 'live',
        account_number: String(tvAccount.id),
        current_balance: tvAccount.balance || 0,
        currency: 'USD',
        status: tvAccount.active ? 'active' : 'inactive',
        connection_type: 'oauth',
        tradovate_environment: environment,
        tradovate_account_id: String(tvAccount.id),
        last_sync_at: new Date().toISOString()
      };

      if (existing.length > 0) {
        await base44.asServiceRole.entities.TradingAccount.update(existing[0].id, accountData);
        accountsCreated.push(existing[0].id);
      } else {
        const created = await base44.asServiceRole.entities.TradingAccount.create(accountData);
        accountsCreated.push(created.id);
      }
    }

    // Fetch fills (trades) for the specified account or all accounts
    const targetAccountId = account_id || (tradovateAccounts[0]?.id);
    
    if (!targetAccountId) {
      return Response.json({ 
        success: true,
        accounts_synced: accountsCreated.length,
        trades_synced: 0,
        message: 'No accounts found'
      });
    }

    const fillsRes = await fetch(
      `${baseUrl}/fill/list?accountId=${targetAccountId}`,
      { headers }
    );

    if (!fillsRes.ok) {
      console.error('Failed to fetch fills:', await fillsRes.text());
      return Response.json({
        success: true,
        accounts_synced: accountsCreated.length,
        trades_synced: 0,
        message: 'Accounts synced, but failed to fetch trades'
      });
    }

    const fills = await fillsRes.json();
    const tradesCreated = [];
    const tradesUpdated = [];

    // Group fills by order to reconstruct trades
    const orderFills = {};
    for (const fill of fills) {
      const orderId = fill.orderId;
      if (!orderFills[orderId]) {
        orderFills[orderId] = [];
      }
      orderFills[orderId].push(fill);
    }

    // Process each order as a trade
    for (const [orderId, orderFillsList] of Object.entries(orderFills)) {
      const firstFill = orderFillsList[0];
      const lastFill = orderFillsList[orderFillsList.length - 1];

      const totalQty = orderFillsList.reduce((sum, f) => sum + (f.qty || 0), 0);
      const avgPrice = orderFillsList.reduce((sum, f) => sum + (f.price * f.qty), 0) / totalQty;

      // Check if trade already exists
      const externalTradeId = `tradovate_${environment}_${orderId}`;
      const existing = await base44.asServiceRole.entities.Trade.filter({
        user_id: user.id,
        external_trade_id: externalTradeId
      });

      const tradeData = {
        user_id: user.id,
        account_id: accountsCreated[0],
        external_trade_id: externalTradeId,
        source: 'tradovate',
        symbol: firstFill.contractName || 'UNKNOWN',
        direction: firstFill.action === 'Buy' ? 'long' : 'short',
        entry_price: avgPrice,
        exit_price: lastFill.price,
        quantity: totalQty,
        entry_time: new Date(firstFill.timestamp).toISOString(),
        exit_time: new Date(lastFill.timestamp).toISOString(),
        commission: orderFillsList.reduce((sum, f) => sum + (f.commission || 0), 0),
        fees: orderFillsList.reduce((sum, f) => sum + (f.fees || 0), 0),
        status: 'closed',
        asset_class: 'futures'
      };

      if (existing.length > 0) {
        await base44.asServiceRole.entities.Trade.update(existing[0].id, tradeData);
        tradesUpdated.push(existing[0].id);
      } else {
        const created = await base44.asServiceRole.entities.Trade.create(tradeData);
        tradesCreated.push(created.id);
        
        // Auto-compute P&L
        await base44.functions.invoke('recomputeTradePnL', { trade_id: created.id });
      }
    }

    // Recompute daily stats for synced dates
    if (tradesCreated.length > 0 || tradesUpdated.length > 0) {
      const allTrades = [...tradesCreated, ...tradesUpdated];
      await base44.functions.invoke('computeDailyStats', { user_id: user.id });
    }

    return Response.json({
      success: true,
      accounts_synced: accountsCreated.length,
      trades_created: tradesCreated.length,
      trades_updated: tradesUpdated.length,
      total_trades: tradesCreated.length + tradesUpdated.length
    });

  } catch (error) {
    console.error('Error syncing Tradovate:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});

async function decryptTokens(encryptedBase64, keyHex) {
  const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = encrypted.slice(0, 12);
  const data = encrypted.slice(12);

  const keyData = new Uint8Array(keyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted));
}