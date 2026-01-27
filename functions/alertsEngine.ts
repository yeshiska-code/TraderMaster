import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id } = await req.json();
    const targetUserId = user.role === 'admin' && user_id ? user_id : user.id;

    const alertsCreated = [];

    // Get recent trades (last 10)
    const recentTrades = await base44.asServiceRole.entities.Trade.filter({
      user_id: targetUserId,
      status: 'closed'
    }, '-entry_time', 10);

    // Check for losing streak
    let lossStreak = 0;
    for (const trade of recentTrades) {
      if ((trade.net_pnl || 0) < 0) {
        lossStreak++;
      } else {
        break;
      }
    }

    if (lossStreak >= 3) {
      const alert = await base44.asServiceRole.entities.Alert.create({
        user_id: targetUserId,
        type: 'streak_alert',
        severity: lossStreak >= 5 ? 'critical' : 'warning',
        title: `${lossStreak} Losing Trades in a Row`,
        message: `You've had ${lossStreak} consecutive losing trades. Consider taking a break and reviewing your strategy.`,
        data: { streak_count: lossStreak }
      });
      alertsCreated.push(alert);
    }

    // Check today's loss limit
    const today = new Date().toISOString().split('T')[0];
    const todayTrades = recentTrades.filter(t => {
      if (!t.entry_time) return false;
      const tradeDate = new Date(t.entry_time).toISOString().split('T')[0];
      return tradeDate === today;
    });

    const todayPnl = todayTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
    
    // Get account for risk settings
    if (todayTrades.length > 0 && todayPnl < 0) {
      const account = await base44.asServiceRole.entities.TradingAccount.filter({
        id: todayTrades[0].account_id
      });

      if (account.length > 0 && account[0].risk_settings?.max_daily_loss) {
        const maxLoss = -Math.abs(account[0].risk_settings.max_daily_loss);
        
        if (todayPnl <= maxLoss * 0.8) {
          const alert = await base44.asServiceRole.entities.Alert.create({
            user_id: targetUserId,
            type: 'daily_loss_limit',
            severity: todayPnl <= maxLoss ? 'critical' : 'warning',
            title: 'Daily Loss Limit Alert',
            message: `You're at $${todayPnl.toFixed(2)} today. ${todayPnl <= maxLoss ? 'Daily limit reached!' : '80% of daily limit reached.'}`,
            data: { today_pnl: todayPnl, max_loss: maxLoss }
          });
          alertsCreated.push(alert);
        }
      }
    }

    // Check emotional log for tilt indicators
    const recentLogs = await base44.asServiceRole.entities.EmotionalLog.filter({
      user_id: targetUserId
    }, '-date', 3);

    for (const log of recentLogs) {
      if (log.tilt_detected || 
          (log.emotions && (log.emotions.includes('greedy') || log.emotions.includes('revenge') || log.emotions.includes('frustrated'))) ||
          (log.overall_mood && log.overall_mood <= 4) ||
          (log.stress_level && log.stress_level >= 8)) {
        
        const alert = await base44.asServiceRole.entities.Alert.create({
          user_id: targetUserId,
          type: 'tilt_detected',
          severity: 'warning',
          title: 'Emotional State Alert',
          message: 'Your recent journal entries show potential tilt indicators. Consider taking a break.',
          data: { log_date: log.date, mood: log.overall_mood, stress: log.stress_level }
        });
        alertsCreated.push(alert);
        break; // Only one tilt alert
      }
    }

    return Response.json({
      success: true,
      alerts_created: alertsCreated.length,
      alerts: alertsCreated
    });

  } catch (error) {
    console.error('Error running alerts engine:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});