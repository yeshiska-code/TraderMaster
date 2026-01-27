import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Plus, 
  Filter, 
  Download, 
  Upload,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  X,
  ChevronDown,
  Calendar,
  Target,
  TrendingUp,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import TradeForm from '@/components/trades/TradeForm';

export default function Trades() {
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const [showNewTrade, setShowNewTrade] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    direction: 'all',
    status: 'all',
    symbol: 'all',
    outcome: 'all',
  });
  const [sortConfig, setSortConfig] = useState({ key: 'entry_time', direction: 'desc' });

  // Check URL for action
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      setShowNewTrade(true);
    }
  }, [location]);

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.Trade.filter({}, '-entry_time', 500),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.TradingAccount.filter({}),
  });

  const { data: strategies = [] } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => base44.entities.Strategy.filter({}),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Trade.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });

  // Filter and sort trades
  const filteredTrades = useMemo(() => {
    let result = [...trades];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.symbol?.toLowerCase().includes(query) ||
        t.notes?.toLowerCase().includes(query) ||
        t.setup_type?.toLowerCase().includes(query)
      );
    }

    // Filters
    if (filters.direction !== 'all') {
      result = result.filter(t => t.direction === filters.direction);
    }
    if (filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status);
    }
    if (filters.symbol !== 'all') {
      result = result.filter(t => t.symbol === filters.symbol);
    }
    if (filters.outcome !== 'all') {
      if (filters.outcome === 'win') {
        result = result.filter(t => (t.net_pnl || 0) > 0);
      } else if (filters.outcome === 'loss') {
        result = result.filter(t => (t.net_pnl || 0) < 0);
      } else if (filters.outcome === 'breakeven') {
        result = result.filter(t => t.net_pnl === 0);
      }
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [trades, searchQuery, filters, sortConfig]);

  // Get unique symbols for filter
  const uniqueSymbols = [...new Set(trades.map(t => t.symbol).filter(Boolean))];

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const closed = filteredTrades.filter(t => t.status === 'closed');
    const totalPnL = closed.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
    const wins = closed.filter(t => (t.net_pnl || 0) > 0).length;
    const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;
    
    return { totalPnL, wins, losses: closed.length - wins, winRate, total: closed.length };
  }, [filteredTrades]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Trade Journal</h1>
          <p className="text-gray-400 mt-1">Track and analyze all your trades</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/20 text-gray-300">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" className="border-white/20 text-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={() => setShowNewTrade(true)}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Trade
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-gray-400">Total P&L</p>
          <p className={cn(
            "text-2xl font-bold",
            summaryStats.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {summaryStats.totalPnL >= 0 ? '+' : ''}${summaryStats.totalPnL.toFixed(2)}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-gray-400">Win Rate</p>
          <p className="text-2xl font-bold text-white">{summaryStats.winRate.toFixed(1)}%</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-gray-400">Wins / Losses</p>
          <p className="text-2xl font-bold">
            <span className="text-emerald-400">{summaryStats.wins}</span>
            <span className="text-gray-500"> / </span>
            <span className="text-red-400">{summaryStats.losses}</span>
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-gray-400">Total Trades</p>
          <p className="text-2xl font-bold text-white">{summaryStats.total}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by symbol, notes, setup..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>
          
          <Select value={filters.direction} onValueChange={(v) => setFilters(f => ({ ...f, direction: v }))}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              <SelectItem value="long">Long</SelectItem>
              <SelectItem value="short">Short</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.outcome} onValueChange={(v) => setFilters(f => ({ ...f, outcome: v }))}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10">
              <SelectValue placeholder="Outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="win">Winners</SelectItem>
              <SelectItem value="loss">Losers</SelectItem>
              <SelectItem value="breakeven">Breakeven</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.symbol} onValueChange={(v) => setFilters(f => ({ ...f, symbol: v }))}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10">
              <SelectValue placeholder="Symbol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Symbols</SelectItem>
              {uniqueSymbols.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchQuery || filters.direction !== 'all' || filters.outcome !== 'all' || filters.symbol !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilters({ direction: 'all', status: 'all', symbol: 'all', outcome: 'all' });
              }}
              className="text-gray-400"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Trades Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Direction</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Entry</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Exit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Size</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">P&L</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">R-Multiple</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-white/10 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p>No trades found</p>
                    <Button 
                      variant="link" 
                      className="text-emerald-400 mt-2"
                      onClick={() => setShowNewTrade(true)}
                    >
                      Log your first trade
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade) => (
                  <tr 
                    key={trade.id}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => window.location.href = createPageUrl('TradeDetail') + `?id=${trade.id}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          (trade.net_pnl || 0) >= 0 ? "bg-emerald-500/20" : "bg-red-500/20"
                        )}>
                          {(trade.net_pnl || 0) >= 0 
                            ? <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                            : <ArrowDownRight className="w-4 h-4 text-red-400" />
                          }
                        </div>
                        <span className="font-semibold text-white">{trade.symbol}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="px-4 py-3 text-gray-300">${trade.entry_price?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{trade.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "font-semibold",
                        (trade.net_pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {(trade.net_pnl || 0) >= 0 ? '+' : ''}${(trade.net_pnl || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {trade.r_multiple ? `${trade.r_multiple.toFixed(2)}R` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {trade.entry_time && format(new Date(trade.entry_time), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-white/10">
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl('TradeDetail') + `?id=${trade.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setEditingTrade(trade);
                            setShowNewTrade(true);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Trade
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setEditingTrade({ ...trade, id: undefined });
                            setShowNewTrade(true);
                          }}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem 
                            className="text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this trade?')) {
                                deleteMutation.mutate(trade.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New/Edit Trade Dialog */}
      <Dialog open={showNewTrade} onOpenChange={(open) => {
        setShowNewTrade(open);
        if (!open) setEditingTrade(null);
      }}>
        <DialogContent className="glass border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTrade?.id ? 'Edit Trade' : 'Log New Trade'}</DialogTitle>
            <DialogDescription>
              {editingTrade?.id ? 'Update the trade details below' : 'Enter your trade details below'}
            </DialogDescription>
          </DialogHeader>
          <TradeForm
            trade={editingTrade}
            accounts={accounts}
            strategies={strategies}
            onSuccess={() => {
              setShowNewTrade(false);
              setEditingTrade(null);
              queryClient.invalidateQueries({ queryKey: ['trades'] });
            }}
            onCancel={() => {
              setShowNewTrade(false);
              setEditingTrade(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}