import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, date_from, date_to } = await req.json();
    
    // Admin can compute for any user, regular users only for themselves
    const targetUserId = user.role === 'admin' && user_id ? user_id : user.id;

    // Get all closed trades in date range
    const trades = await base44.asServiceRole.entities.Trade.filter({
      user_id: targetUserId,
      status: 'closed'
    }, '-entry_time', 10000);

    // Group by date
    const tradesByDate = {};
    
    for (const trade of trades) {
      if (!trade.entry_time) continue;
      
      const tradeDate = new Date(trade.entry_time).toISOString().split('T')[0];
      
      // Filter by date range if provided
      if (date_from && tradeDate < date_from) continue;
      if (date_to && tradeDate > date_to) continue;
      
      if (!tradesByDate[tradeDate]) {
        tradesByDate[tradeDate] = [];
      }
      tradesByDate[tradeDate].push(trade);
    }

    // Compute stats for each date
    const results = [];
    
    for (const [date, dateTrades] of Object.entries(tradesByDate)) {
      const winners = dateTrades.filter(t => (t.net_pnl || 0) > 0);
      const losers = dateTrades.filter(t => (t.net_pnl || 0) < 0);
      const breakeven = dateTrades.filter(t => t.net_pnl === 0);
      
      const grossPnl = dateTrades.reduce((sum, t) => sum + (t.gross_pnl || 0), 0);
      const netPnl = dateTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
      const commissions = dateTrades.reduce((sum, t) => sum + (t.commission || 0) + (t.fees || 0), 0);
      
      const winRate = dateTrades.length > 0 ? (winners.length / dateTrades.length) * 100 : 0;
      const avgWinner = winners.length > 0 ? winners.reduce((sum, t) => sum + t.net_pnl, 0) / winners.length : 0;
      const avgLoser = losers.length > 0 ? Math.abs(losers.reduce((sum, t) => sum + t.net_pnl, 0) / losers.length) : 0;
      
      const largestWinner = winners.length > 0 ? Math.max(...winners.map(t => t.net_pnl)) : 0;
      const largestLoser = losers.length > 0 ? Math.min(...losers.map(t => t.net_pnl)) : 0;
      
      const totalWinnings = winners.reduce((sum, t) => sum + t.net_pnl, 0);
      const totalLosses = Math.abs(losers.reduce((sum, t) => sum + t.net_pnl, 0));
      const profitFactor = totalLosses > 0 ? totalWinnings / totalLosses : (totalWinnings > 0 ? 999 : 0);
      
      const avgRR = dateTrades.filter(t => t.r_multiple).length > 0
        ? dateTrades.filter(t => t.r_multiple).reduce((sum, t) => sum + t.r_multiple, 0) / dateTrades.filter(t => t.r_multiple).length
        : 0;
      
      const totalR = dateTrades.reduce((sum, t) => sum + (t.r_multiple || 0), 0);
      
      const rulesFollowed = dateTrades.filter(t => t.followed_rules).length;
      const rulesFollowedPct = dateTrades.length > 0 ? (rulesFollowed / dateTrades.length) * 100 : 0;
      
      const mistakesCount = dateTrades.reduce((sum, t) => sum + (t.mistakes?.length || 0), 0);
      
      const disciplineScore = Math.max(0, Math.min(100, rulesFollowedPct - (mistakesCount * 5)));
      
      const uniqueSessions = [...new Set(dateTrades.map(t => t.session).filter(Boolean))];
      const uniqueSymbols = [...new Set(dateTrades.map(t => t.symbol).filter(Boolean))];
      const uniqueStrategies = [...new Set(dateTrades.map(t => t.strategy_id).filter(Boolean))];

      const statsData = {
        user_id: targetUserId,
        date,
        total_trades: dateTrades.length,
        winning_trades: winners.length,
        losing_trades: losers.length,
        breakeven_trades: breakeven.length,
        gross_pnl: grossPnl,
        net_pnl: netPnl,
        commissions,
        win_rate: winRate,
        avg_winner: avgWinner,
        avg_loser: avgLoser,
        largest_winner: largestWinner,
        largest_loser: largestLoser,
        profit_factor: profitFactor,
        avg_rr: avgRR,
        total_r: totalR,
        discipline_score: disciplineScore,
        rules_followed_pct: rulesFollowedPct,
        mistakes_count: mistakesCount,
        sessions_traded: uniqueSessions,
        symbols_traded: uniqueSymbols,
        strategies_used: uniqueStrategies
      };

      // Upsert (update if exists, create if not)
      const existing = await base44.asServiceRole.entities.DailyStats.filter({
        user_id: targetUserId,
        date
      });

      if (existing.length > 0) {
        await base44.asServiceRole.entities.DailyStats.update(existing[0].id, statsData);
      } else {
        await base44.asServiceRole.entities.DailyStats.create(statsData);
      }

      results.push({ date, stats: statsData });
    }

    return Response.json({
      success: true,
      computed_dates: results.length,
      results
    });

  } catch (error) {
    console.error('Error computing daily stats:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});