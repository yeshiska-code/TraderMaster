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

    // Don't override manual assignment
    if (trade.strategy_id) {
      return Response.json({
        success: true,
        assigned: false,
        reason: 'Strategy already assigned'
      });
    }

    // Get active strategies for user
    const strategies = await base44.entities.Strategy.filter({
      user_id: trade.user_id,
      status: 'active'
    });

    // Try to match strategy based on rules
    let matchedStrategy = null;
    let maxMatchScore = 0;

    for (const strategy of strategies) {
      let score = 0;

      // Check symbol match
      if (strategy.symbols && strategy.symbols.length > 0) {
        if (strategy.symbols.includes(trade.symbol)) {
          score += 3;
        } else {
          continue; // Skip if symbol doesn't match
        }
      }

      // Check asset class
      if (strategy.asset_classes && strategy.asset_classes.includes(trade.asset_class)) {
        score += 2;
      }

      // Check session
      if (strategy.sessions && strategy.sessions.includes(trade.session)) {
        score += 2;
      }

      // Check setup type
      if (strategy.setup_types && trade.setup_type && strategy.setup_types.includes(trade.setup_type)) {
        score += 2;
      }

      if (score > maxMatchScore) {
        maxMatchScore = score;
        matchedStrategy = strategy;
      }
    }

    // Assign if we have a good match (score >= 3)
    if (matchedStrategy && maxMatchScore >= 3) {
      await base44.entities.Trade.update(trade_id, {
        strategy_id: matchedStrategy.id
      });

      return Response.json({
        success: true,
        assigned: true,
        strategy_id: matchedStrategy.id,
        strategy_name: matchedStrategy.name,
        match_score: maxMatchScore
      });
    }

    return Response.json({
      success: true,
      assigned: false,
      reason: 'No matching strategy found'
    });

  } catch (error) {
    console.error('Error auto-assigning strategy:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});