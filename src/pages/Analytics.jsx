import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Activity,
  Clock,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Layers
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from '@/components/ui/StatCard';
import { cn } from "@/lib/utils";

const COLORS = ['#10b981', '#ef4444', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 border border-white/20">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.Trade.filter({}, '-entry_time', 1000),
  });

  // Filter trades by time range
  const filteredTrades = useMemo(() => {
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d': startDate = subDays(now, 7); break;
      case '30d': startDate = subDays(now, 30); break;
      case '90d': startDate = subDays(now, 90); break;
      case '1y': startDate = subMonths(now, 12); break;
      case 'all': startDate = new Date(0); break;
      default: startDate = subDays(now, 30);
    }

    return trades.filter(t => t.entry_time && new Date(t.entry_time) >= startDate);
  }, [trades, timeRange]);

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const closed = filteredTrades.filter(t => t.status === 'closed' && t.net_pnl !== undefined);
    const wins = closed.filter(t => (t.net_pnl || 0) > 0);
    const losses = closed.filter(t => (t.net_pnl || 0) < 0);
    
    const totalPnL = closed.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
    const grossProfit = wins.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.net_pnl || 0), 0));
    
    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    
    // Expectancy = (Win% × Avg Win) - (Loss% × Avg Loss)
    const expectancy = (winRate / 100 * avgWin) - ((100 - winRate) / 100 * avgLoss);
    
    // Max drawdown calculation
    let maxDrawdown = 0;
    let peak = 0;
    let runningPnL = 0;
    
    closed.sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time)).forEach(trade => {
      runningPnL += trade.net_pnl || 0;
      if (runningPnL > peak) peak = runningPnL;
      const drawdown = peak - runningPnL;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    
    // Average trade duration
    const tradesWithDuration = closed.filter(t => t.duration_minutes);
    const avgDuration = tradesWithDuration.length > 0 
      ? tradesWithDuration.reduce((sum, t) => sum + t.duration_minutes, 0) / tradesWithDuration.length 
      : 0;

    // R-multiple stats
    const tradesWithR = closed.filter(t => t.r_multiple);
    const avgR = tradesWithR.length > 0 
      ? tradesWithR.reduce((sum, t) => sum + t.r_multiple, 0) / tradesWithR.length 
      : 0;
    const totalR = tradesWithR.reduce((sum, t) => sum + t.r_multiple, 0);

    // Largest win/loss
    const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.net_pnl)) : 0;
    const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.net_pnl)) : 0;

    // Consecutive wins/losses
    let maxConsecWins = 0, maxConsecLosses = 0, currentConsec = 0, lastType = null;
    closed.forEach(t => {
      const isWin = (t.net_pnl || 0) > 0;
      if (isWin === lastType) {
        currentConsec++;
      } else {
        currentConsec = 1;
        lastType = isWin;
      }
      if (isWin && currentConsec > maxConsecWins) maxConsecWins = currentConsec;
      if (!isWin && currentConsec > maxConsecLosses) maxConsecLosses = currentConsec;
    });

    return {
      totalTrades: closed.length,
      wins: wins.length,
      losses: losses.length,
      totalPnL,
      grossProfit,
      grossLoss,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      expectancy,
      maxDrawdown,
      avgDuration,
      avgR,
      totalR,
      largestWin,
      largestLoss,
      maxConsecWins,
      maxConsecLosses
    };
  }, [filteredTrades]);

  // Chart data
  const equityCurveData = useMemo(() => {
    const closed = filteredTrades
      .filter(t => t.status === 'closed' && t.entry_time)
      .sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time));
    
    let cumulative = 0;
    return closed.map(t => {
      cumulative += t.net_pnl || 0;
      return {
        date: format(new Date(t.entry_time), 'MMM d'),
        pnl: cumulative,
        trade: t.net_pnl || 0
      };
    });
  }, [filteredTrades]);

  const pnlByDayOfWeek = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats = days.map(d => ({ day: d.substring(0, 3), pnl: 0, trades: 0, wins: 0 }));
    
    filteredTrades.forEach(t => {
      if (!t.entry_time) return;
      const dayIdx = new Date(t.entry_time).getDay();
      dayStats[dayIdx].pnl += t.net_pnl || 0;
      dayStats[dayIdx].trades++;
      if ((t.net_pnl || 0) > 0) dayStats[dayIdx].wins++;
    });

    return dayStats.map(d => ({
      ...d,
      winRate: d.trades > 0 ? (d.wins / d.trades * 100) : 0
    }));
  }, [filteredTrades]);

  const pnlBySession = useMemo(() => {
    const sessionStats = {};
    filteredTrades.forEach(t => {
      if (!t.session) return;
      if (!sessionStats[t.session]) {
        sessionStats[t.session] = { pnl: 0, trades: 0, wins: 0 };
      }
      sessionStats[t.session].pnl += t.net_pnl || 0;
      sessionStats[t.session].trades++;
      if ((t.net_pnl || 0) > 0) sessionStats[t.session].wins++;
    });

    return Object.entries(sessionStats).map(([session, data]) => ({
      session: session.replace(/_/g, ' ').toUpperCase(),
      pnl: data.pnl,
      trades: data.trades,
      winRate: data.trades > 0 ? (data.wins / data.trades * 100) : 0
    }));
  }, [filteredTrades]);

  const symbolPerformance = useMemo(() => {
    const symbolStats = {};
    filteredTrades.forEach(t => {
      if (!t.symbol) return;
      if (!symbolStats[t.symbol]) {
        symbolStats[t.symbol] = { pnl: 0, trades: 0, wins: 0 };
      }
      symbolStats[t.symbol].pnl += t.net_pnl || 0;
      symbolStats[t.symbol].trades++;
      if ((t.net_pnl || 0) > 0) symbolStats[t.symbol].wins++;
    });

    return Object.entries(symbolStats)
      .map(([symbol, data]) => ({
        symbol,
        pnl: data.pnl,
        trades: data.trades,
        winRate: data.trades > 0 ? (data.wins / data.trades * 100) : 0
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [filteredTrades]);

  const winDistribution = useMemo(() => {
    const ranges = [
      { range: '< -$500', min: -Infinity, max: -500, count: 0 },
      { range: '-$500 to -$100', min: -500, max: -100, count: 0 },
      { range: '-$100 to $0', min: -100, max: 0, count: 0 },
      { range: '$0 to $100', min: 0, max: 100, count: 0 },
      { range: '$100 to $500', min: 100, max: 500, count: 0 },
      { range: '> $500', min: 500, max: Infinity, count: 0 },
    ];

    filteredTrades.forEach(t => {
      const pnl = t.net_pnl || 0;
      const range = ranges.find(r => pnl > r.min && pnl <= r.max);
      if (range) range.count++;
    });

    return ranges;
  }, [filteredTrades]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Performance Analytics</h1>
          <p className="text-gray-400 mt-1">Deep insights into your trading performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total P&L"
          value={`${metrics.totalPnL >= 0 ? '+' : ''}$${metrics.totalPnL.toFixed(2)}`}
          subtitle={`${metrics.totalTrades} trades`}
          changeType={metrics.totalPnL >= 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
          iconColor={metrics.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
        <StatCard
          title="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          subtitle={`${metrics.wins}W / ${metrics.losses}L`}
          changeType={metrics.winRate >= 50 ? 'positive' : 'negative'}
          icon={Target}
        />
        <StatCard
          title="Profit Factor"
          value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
          subtitle={`Expectancy: $${metrics.expectancy.toFixed(2)}`}
          changeType={metrics.profitFactor >= 1.5 ? 'positive' : metrics.profitFactor >= 1 ? 'neutral' : 'negative'}
          icon={Activity}
        />
        <StatCard
          title="Max Drawdown"
          value={`-$${metrics.maxDrawdown.toFixed(2)}`}
          subtitle={`Avg R: ${metrics.avgR.toFixed(2)}`}
          changeType="negative"
          icon={TrendingDown}
          iconColor="text-red-400"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
            Overview
          </TabsTrigger>
          <TabsTrigger value="time" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
            Time Analysis
          </TabsTrigger>
          <TabsTrigger value="symbols" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
            Symbols
          </TabsTrigger>
          <TabsTrigger value="distribution" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
            Distribution
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Equity Curve */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Equity Curve</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={equityCurveData}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="pnl" stroke="#10b981" strokeWidth={2} fill="url(#colorPnl)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Additional Metrics Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Win/Loss Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Average Win</span>
                  <span className="text-emerald-400 font-semibold">+${metrics.avgWin.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Average Loss</span>
                  <span className="text-red-400 font-semibold">-${metrics.avgLoss.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Largest Win</span>
                  <span className="text-emerald-400 font-semibold">+${metrics.largestWin.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Largest Loss</span>
                  <span className="text-red-400 font-semibold">${metrics.largestLoss.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Streak Analysis</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Max Consecutive Wins</span>
                  <span className="text-emerald-400 font-semibold">{metrics.maxConsecWins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Max Consecutive Losses</span>
                  <span className="text-red-400 font-semibold">{metrics.maxConsecLosses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Gross Profit</span>
                  <span className="text-emerald-400 font-semibold">+${metrics.grossProfit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Gross Loss</span>
                  <span className="text-red-400 font-semibold">-${metrics.grossLoss.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">R-Multiple Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Average R</span>
                  <span className={cn("font-semibold", metrics.avgR >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {metrics.avgR.toFixed(2)}R
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total R</span>
                  <span className={cn("font-semibold", metrics.totalR >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {metrics.totalR.toFixed(2)}R
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg Duration</span>
                  <span className="text-white font-semibold">{Math.round(metrics.avgDuration)} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Trade Count</span>
                  <span className="text-white font-semibold">{metrics.totalTrades}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* P&L by Day of Week */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">P&L by Day of Week</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pnlByDayOfWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="pnl" name="P&L" fill="#10b981" radius={[4, 4, 0, 0]}>
                    {pnlByDayOfWeek.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* P&L by Session */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">P&L by Session</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pnlBySession} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="session" type="category" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="pnl" name="P&L" fill="#10b981" radius={[0, 4, 4, 0]}>
                    {pnlBySession.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="symbols" className="space-y-6 mt-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance by Symbol</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase py-3">Symbol</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase py-3">Trades</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase py-3">Win Rate</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase py-3">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {symbolPerformance.slice(0, 15).map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="py-3 font-medium text-white">{item.symbol}</td>
                      <td className="py-3 text-right text-gray-300">{item.trades}</td>
                      <td className="py-3 text-right">
                        <span className={cn(
                          "font-medium",
                          item.winRate >= 50 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {item.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={cn(
                          "font-semibold",
                          item.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">P&L Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={winDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="range" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Trades" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Win vs Loss Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Wins', value: metrics.wins },
                      { name: 'Losses', value: metrics.losses }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}