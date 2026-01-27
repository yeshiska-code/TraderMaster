import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trade_id } = await req.json();

    if (!trade_id) {
      return Response.json({ error: 'trade_id is required' }, { status: 400 });
    }

    // Get trade
    const trades = await base44.entities.Trade.filter({ id: trade_id });
    
    if (trades.length === 0) {
      return Response.json({ error: 'Trade not found' }, { status: 404 });
    }

    const trade = trades[0];

    // Verify ownership
    if (trade.user_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Compute P&L
    if (!trade.entry_price || !trade.exit_price || !trade.quantity) {
      return Response.json({ 
        error: 'Missing required fields for P&L calculation' 
      }, { status: 400 });
    }

    const priceDiff = trade.direction === 'long' 
      ? (trade.exit_price - trade.entry_price)
      : (trade.entry_price - trade.exit_price);
    
    const grossPnl = priceDiff * trade.quantity;
    const netPnl = grossPnl - (trade.commission || 0) - (trade.fees || 0);
    
    const pnlPercentage = trade.entry_price > 0 
      ? (priceDiff / trade.entry_price) * 100 
      : 0;

    // Compute R-multiple if stop loss is defined
    let rMultiple = trade.r_multiple;
    if (trade.stop_loss && trade.initial_risk && trade.initial_risk > 0) {
      rMultiple = netPnl / trade.initial_risk;
    }

    // Compute duration
    let durationMinutes = trade.duration_minutes;
    if (trade.entry_time && trade.exit_time) {
      const entryMs = new Date(trade.entry_time).getTime();
      const exitMs = new Date(trade.exit_time).getTime();
      durationMinutes = Math.round((exitMs - entryMs) / 60000);
    }

    // Update trade
    const updateData = {
      gross_pnl: grossPnl,
      net_pnl: netPnl,
      pnl_percentage: pnlPercentage,
      duration_minutes: durationMinutes
    };

    if (rMultiple !== undefined) {
      updateData.r_multiple = rMultiple;
    }

    await base44.entities.Trade.update(trade_id, updateData);

    return Response.json({
      success: true,
      trade_id,
      computed: updateData
    });

  } catch (error) {
    console.error('Error recomputing trade P&L:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});