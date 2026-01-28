import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Activity, 
  Calendar,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  ChevronRight,
  BarChart3,
  Brain
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import StatCard from '@/components/ui/StatCard';
import PnLChart from '@/components/charts/PnLChart';
import WinRateChart from '@/components/charts/WinRateChart';
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: trades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.Trade.filter({}, '-entry_time', 100),
  });

  const { data: dailyStats = [] } = useQuery({
    queryKey: ['dailyStats'],
    queryFn: () => base44.entities.DailyStats.filter({}, '-date', 30),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['recentAlerts'],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.Alert.filter({ user_id: user?.id, is_dismissed: false }, '-created_date', 5);
    },
    enabled: !!user,
  });

  const { data: aiInsights = [] } = useQuery({
    queryKey: ['aiInsights'],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.AIInsight.filter({ user_id: user?.id }, '-created_date', 3);
    },
    enabled: !!user,
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.net_pnl !== undefined);
    const todayTrades = closedTrades.filter(t => {
      if (!t.entry_time) return false;
      const tradeDate = new Date(t.entry_time);
      const today = new Date();
      return tradeDate.toDateString() === today.toDateString();
    });

    const thisMonthTrades = closedTrades.filter(t => {
      if (!t.entry_time) return false;
      const tradeDate = new Date(t.entry_time);
      return isWithinInterval(tradeDate, {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
      });
    });

    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
    const todayPnL = todayTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
    const monthPnL = thisMonthTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0);

    const wins = closedTrades.filter(t => (t.net_pnl || 0) > 0).length;
    const losses = closedTrades.filter(t => (t.net_pnl || 0) < 0).length;
    const breakeven = closedTrades.filter(t => t.net_pnl === 0).length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

    const avgWin = wins > 0 ? closedTrades.filter(t => (t.net_pnl || 0) > 0).reduce((sum, t) => sum + t.net_pnl, 0) / wins : 0;
    const avgLoss = losses > 0 ? Math.abs(closedTrades.filter(t => (t.net_pnl || 0) < 0).reduce((sum, t) => sum + t.net_pnl, 0) / losses) : 0;
    const profitFactor = avgLoss > 0 ? (avgWin * wins) / (avgLoss * losses) : 0;

    const avgRR = closedTrades.filter(t => t.r_multiple).reduce((sum, t) => sum + t.r_multiple, 0) / (closedTrades.filter(t => t.r_multiple).length || 1);

    // Calculate streak
    let currentStreak = 0;
    let streakType = 'neutral';
    for (let i = 0; i < closedTrades.length; i++) {
      const pnl = closedTrades[i].net_pnl || 0;
      if (i === 0) {
        streakType = pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'neutral';
        currentStreak = pnl !== 0 ? 1 : 0;
      } else {
        const thisType = pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'neutral';
        if (thisType === streakType && thisType !== 'neutral') {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return {
      totalPnL,
      todayPnL,
      monthPnL,
      totalTrades: closedTrades.length,
      todayTrades: todayTrades.length,
      wins,
      losses,
      breakeven,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      avgRR,
      currentStreak,
      streakType
    };
  }, [trades]);

  const recentTrades = trades.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Trader'}
          </h1>
          <p className="text-gray-400 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Trades') + '?action=new'}>
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold">
              <TrendingUp className="w-4 h-4 mr-2" />
              Log Trade
            </Button>
          </Link>
          <Link to={createPageUrl('Journal')}>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
              <Calendar className="w-4 h-4 mr-2" />
              Daily Journal
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's P&L"
          value={`${metrics.todayPnL >= 0 ? '+' : ''}$${metrics.todayPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${metrics.todayTrades} trades`}
          changeType={metrics.todayPnL >= 0 ? 'positive' : 'negative'}
          icon={Wallet}
          iconColor={metrics.todayPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
        <StatCard
          title="Monthly P&L"
          value={`${metrics.monthPnL >= 0 ? '+' : ''}$${metrics.monthPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          changeType={metrics.monthPnL >= 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
          iconColor={metrics.monthPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
        <StatCard
          title="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          subtitle={`${metrics.wins}W / ${metrics.losses}L`}
          changeType={metrics.winRate >= 50 ? 'positive' : 'negative'}
          icon={Target}
          iconColor="text-cyan-400"
        />
        <StatCard
          title="Profit Factor"
          value={metrics.profitFactor.toFixed(2)}
          subtitle={`Avg RR: ${metrics.avgRR.toFixed(2)}`}
          changeType={metrics.profitFactor >= 1.5 ? 'positive' : metrics.profitFactor >= 1 ? 'neutral' : 'negative'}
          icon={Activity}
          iconColor="text-violet-400"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* P&L Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Equity Curve</h2>
              <p className="text-sm text-gray-400">Last 30 days performance</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                {metrics.totalPnL >= 0 ? '+' : ''}{((metrics.totalPnL / (user?.stats_cache?.total_pnl || 10000)) * 100).toFixed(2)}%
              </Badge>
            </div>
          </div>
          <PnLChart data={dailyStats} height={280} />
        </div>

        {/* Win Rate Donut */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Trade Distribution</h2>
          </div>
          <WinRateChart 
            wins={metrics.wins} 
            losses={metrics.losses} 
            breakeven={metrics.breakeven}
            size={180}
          />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <p className="text-lg font-bold text-emerald-400">{metrics.wins}</p>
              <p className="text-xs text-gray-400">Wins</p>
            </div>
            <div className="p-2 rounded-lg bg-red-500/10">
              <p className="text-lg font-bold text-red-400">{metrics.losses}</p>
              <p className="text-xs text-gray-400">Losses</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-500/10">
              <p className="text-lg font-bold text-gray-400">{metrics.breakeven}</p>
              <p className="text-xs text-gray-400">BE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Trades */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Trades</h2>
            <Link to={createPageUrl('Trades')}>
              <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {tradesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10" />
                      <div>
                        <div className="h-4 w-20 bg-white/10 rounded mb-2" />
                        <div className="h-3 w-32 bg-white/10 rounded" />
                      </div>
                    </div>
                    <div className="h-5 w-16 bg-white/10 rounded" />
                  </div>
                </div>
              ))
            ) : recentTrades.length === 0 ? (
              <div className="p-8 text-center">
                <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No trades yet</p>
                <Link to={createPageUrl('Trades') + '?action=new'}>
                  <Button variant="link" className="text-emerald-400 mt-2">
                    Log your first trade
                  </Button>
                </Link>
              </div>
            ) : (
              recentTrades.map((trade) => (
                <Link 
                  key={trade.id} 
                  to={createPageUrl('TradeDetail') + `?id=${trade.id}`}
                  className="block p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        (trade.net_pnl || 0) >= 0 ? "bg-emerald-500/20" : "bg-red-500/20"
                      )}>
                        {(trade.net_pnl || 0) >= 0 
                          ? <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                          : <ArrowDownRight className="w-5 h-5 text-red-400" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{trade.symbol}</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              trade.direction === 'long' 
                                ? "border-emerald-500/30 text-emerald-400" 
                                : "border-red-500/30 text-red-400"
                            )}
                          >
                            {trade.direction?.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">
                          {trade.entry_time && format(new Date(trade.entry_time), 'MMM d, h:mm a')}
                          {trade.strategy_id && ` • Strategy`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-semibold",
                        (trade.net_pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {(trade.net_pnl || 0) >= 0 ? '+' : ''}${(trade.net_pnl || 0).toFixed(2)}
                      </p>
                      {trade.r_multiple && (
                        <p className="text-xs text-gray-400">{trade.r_multiple.toFixed(2)}R</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Current Streak */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Current Streak</h3>
              <Badge 
                variant="outline" 
                className={cn(
                  metrics.streakType === 'win' 
                    ? "border-emerald-500/30 text-emerald-400" 
                    : metrics.streakType === 'loss'
                    ? "border-red-500/30 text-red-400"
                    : "border-gray-500/30 text-gray-400"
                )}
              >
                {metrics.streakType === 'win' ? '🔥 Hot' : metrics.streakType === 'loss' ? '❄️ Cold' : '➖ Neutral'}
              </Badge>
            </div>
            <div className="flex items-end gap-2">
              <span className={cn(
                "text-4xl font-bold",
                metrics.streakType === 'win' ? "text-emerald-400" : metrics.streakType === 'loss' ? "text-red-400" : "text-gray-400"
              )}>
                {metrics.currentStreak}
              </span>
              <span className="text-gray-400 mb-1">
                {metrics.streakType === 'win' ? 'winning' : metrics.streakType === 'loss' ? 'losing' : ''} trades
              </span>
            </div>
          </div>

          {/* AI Insights */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-400" />
                <h3 className="font-semibold text-white">AI Insights</h3>
              </div>
              <Link to={createPageUrl('AIAgent')}>
                <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300 h-7 px-2">
                  View All
                </Button>
              </Link>
            </div>
            {aiInsights.length === 0 ? (
              <div className="text-center py-4">
                <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Trade more to unlock AI insights</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiInsights.slice(0, 2).map((insight) => (
                  <div key={insight.id} className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                    <p className="text-sm font-medium text-white mb-1">{insight.title}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{insight.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">Alerts</h3>
              </div>
              {alerts.length > 0 && (
                <Badge className="bg-amber-500/20 text-amber-400 border-0">
                  {alerts.length} new
                </Badge>
              )}
            </div>
            {alerts.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                <p className="text-sm text-gray-400">All clear!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert) => (
                  <div 
                    key={alert.id} 
                    className={cn(
                      "p-3 rounded-lg border",
                      alert.severity === 'critical' 
                        ? "bg-red-500/10 border-red-500/30" 
                        : alert.severity === 'warning'
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-white/5 border-white/10"
                    )}
                  >
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}