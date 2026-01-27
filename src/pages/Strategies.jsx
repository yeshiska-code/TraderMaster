import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Target, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Settings,
  Trash2,
  Edit,
  Copy,
  Play,
  Pause,
  ChevronRight,
  Search,
  Filter
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import StrategyForm from '@/components/strategies/StrategyForm';

export default function Strategies() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => base44.entities.Strategy.filter({}),
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.Trade.filter({}, '-entry_time', 1000),
  });

  // Calculate strategy performance
  const strategyStats = useMemo(() => {
    const stats = {};
    
    strategies.forEach(strategy => {
      const strategyTrades = trades.filter(t => t.strategy_id === strategy.id);
      const closed = strategyTrades.filter(t => t.status === 'closed');
      const wins = closed.filter(t => (t.net_pnl || 0) > 0);
      
      stats[strategy.id] = {
        totalTrades: closed.length,
        wins: wins.length,
        losses: closed.length - wins.length,
        winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
        totalPnL: closed.reduce((sum, t) => sum + (t.net_pnl || 0), 0),
        avgPnL: closed.length > 0 ? closed.reduce((sum, t) => sum + (t.net_pnl || 0), 0) / closed.length : 0,
        profitFactor: (() => {
          const grossProfit = wins.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
          const grossLoss = Math.abs(closed.filter(t => (t.net_pnl || 0) < 0).reduce((sum, t) => sum + (t.net_pnl || 0), 0));
          return grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
        })()
      };
    });

    return stats;
  }, [strategies, trades]);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Strategy.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Strategy.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
    }
  });

  const filteredStrategies = strategies.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by total P&L
  const sortedStrategies = [...filteredStrategies].sort((a, b) => {
    const aPnL = strategyStats[a.id]?.totalPnL || 0;
    const bPnL = strategyStats[b.id]?.totalPnL || 0;
    return bPnL - aPnL;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Strategies</h1>
          <p className="text-gray-400 mt-1">Build, track, and optimize your trading strategies</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Strategy
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search strategies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>
      </div>

      {/* Strategies Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-6 bg-white/10 rounded w-1/2 mb-4" />
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
              <div className="h-4 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : sortedStrategies.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No strategies yet</h3>
          <p className="text-gray-400 mb-6">Create your first strategy to start tracking its performance</p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Strategy
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedStrategies.map(strategy => {
            const stats = strategyStats[strategy.id] || {};
            
            return (
              <div key={strategy.id} className="glass-card p-6 hover:border-white/20 transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      stats.totalPnL >= 0 ? "bg-emerald-500/20" : "bg-red-500/20"
                    )}>
                      <Target className={cn(
                        "w-5 h-5",
                        stats.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
                      )} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{strategy.name}</h3>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs mt-1",
                          strategy.status === 'active' ? "border-emerald-500/30 text-emerald-400" :
                          strategy.status === 'testing' ? "border-amber-500/30 text-amber-400" :
                          "border-gray-500/30 text-gray-400"
                        )}
                      >
                        {strategy.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass border-white/10">
                      <DropdownMenuItem onClick={() => {
                        setEditingStrategy(strategy);
                        setShowForm(true);
                      }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setEditingStrategy({ ...strategy, id: undefined, name: `${strategy.name} (Copy)` });
                        setShowForm(true);
                      }}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        updateMutation.mutate({
                          id: strategy.id,
                          data: { status: strategy.status === 'active' ? 'inactive' : 'active' }
                        });
                      }}>
                        {strategy.status === 'active' ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem 
                        className="text-red-400"
                        onClick={() => {
                          if (confirm('Delete this strategy?')) {
                            deleteMutation.mutate(strategy.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Description */}
                {strategy.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{strategy.description}</p>
                )}

                {/* Stats */}
                <div className="space-y-4">
                  {/* P&L */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total P&L</span>
                    <span className={cn(
                      "font-semibold",
                      stats.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL?.toFixed(2) || '0.00'}
                    </span>
                  </div>

                  {/* Win Rate Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">Win Rate</span>
                      <span className="text-sm font-medium text-white">{stats.winRate?.toFixed(1) || 0}%</span>
                    </div>
                    <Progress value={stats.winRate || 0} className="h-2" />
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center p-2 rounded-lg bg-white/5">
                      <p className="text-lg font-bold text-white">{stats.totalTrades || 0}</p>
                      <p className="text-xs text-gray-400">Trades</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-emerald-500/10">
                      <p className="text-lg font-bold text-emerald-400">{stats.wins || 0}</p>
                      <p className="text-xs text-gray-400">Wins</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-red-500/10">
                      <p className="text-lg font-bold text-red-400">{stats.losses || 0}</p>
                      <p className="text-xs text-gray-400">Losses</p>
                    </div>
                  </div>

                  {/* Profit Factor */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-sm text-gray-400">Profit Factor</span>
                    <Badge 
                      className={cn(
                        stats.profitFactor >= 1.5 ? "bg-emerald-500/20 text-emerald-400" :
                        stats.profitFactor >= 1 ? "bg-amber-500/20 text-amber-400" :
                        "bg-red-500/20 text-red-400"
                      )}
                    >
                      {stats.profitFactor === Infinity ? '∞' : stats.profitFactor?.toFixed(2) || '0.00'}
                    </Badge>
                  </div>

                  {/* Tags */}
                  {strategy.setup_types?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {strategy.setup_types.slice(0, 3).map((setup, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-white/10">
                          {setup}
                        </Badge>
                      ))}
                      {strategy.setup_types.length > 3 && (
                        <Badge variant="outline" className="text-xs border-white/10">
                          +{strategy.setup_types.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Strategy Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) setEditingStrategy(null);
      }}>
        <DialogContent className="glass border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStrategy?.id ? 'Edit Strategy' : 'Create Strategy'}</DialogTitle>
            <DialogDescription>
              Define your trading strategy rules and criteria
            </DialogDescription>
          </DialogHeader>
          <StrategyForm
            strategy={editingStrategy}
            onSuccess={() => {
              setShowForm(false);
              setEditingStrategy(null);
              queryClient.invalidateQueries({ queryKey: ['strategies'] });
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingStrategy(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}