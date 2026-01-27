import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Edit,
  Trash2,
  Clock,
  Target,
  DollarSign,
  Activity,
  Brain,
  MessageSquare,
  Star,
  Image,
  Tag
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import TradeForm from '@/components/trades/TradeForm';

export default function TradeDetail() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(location.search);
  const tradeId = params.get('id');

  const [showEditForm, setShowEditForm] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const { data: trade, isLoading } = useQuery({
    queryKey: ['trade', tradeId],
    queryFn: async () => {
      const trades = await base44.entities.Trade.filter({ id: tradeId });
      return trades[0];
    },
    enabled: !!tradeId
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
    mutationFn: () => base44.entities.Trade.delete(tradeId),
    onSuccess: () => {
      window.location.href = createPageUrl('Trades');
    }
  });

  if (isLoading || !trade) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-white/10 rounded w-1/4 animate-pulse" />
        <div className="glass-card p-6 animate-pulse">
          <div className="h-32 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  const isWin = (trade.net_pnl || 0) > 0;
  const account = accounts.find(a => a.id === trade.account_id);
  const strategy = strategies.find(s => s.id === trade.strategy_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Trades')}>
            <Button variant="ghost" size="icon" className="border border-white/10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{trade.symbol}</h1>
              <Badge 
                variant="outline" 
                className={cn(
                  trade.direction === 'long' 
                    ? "border-emerald-500/30 text-emerald-400" 
                    : "border-red-500/30 text-red-400"
                )}
              >
                {trade.direction?.toUpperCase()}
              </Badge>
            </div>
            <p className="text-gray-400 mt-1">
              {trade.entry_time && format(new Date(trade.entry_time), 'EEEE, MMMM d, yyyy • h:mm a')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/20" onClick={() => setShowEditForm(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={() => {
              if (confirm('Delete this trade?')) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* P&L Card */}
          <div className={cn(
            "glass-card p-6 relative overflow-hidden",
            isWin ? "glow-green" : ""
          )}>
            <div className={cn(
              "absolute inset-0",
              isWin ? "bg-gradient-to-br from-emerald-500/10 to-transparent" : "bg-gradient-to-br from-red-500/10 to-transparent"
            )} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Net P&L</p>
                  <p className={cn(
                    "text-5xl font-bold",
                    isWin ? "text-emerald-400" : "text-red-400"
                  )}>
                    {isWin ? '+' : ''}${(trade.net_pnl || 0).toFixed(2)}
                  </p>
                </div>
                <div className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center",
                  isWin ? "bg-emerald-500/20" : "bg-red-500/20"
                )}>
                  {isWin 
                    ? <TrendingUp className="w-10 h-10 text-emerald-400" />
                    : <TrendingDown className="w-10 h-10 text-red-400" />
                  }
                </div>
              </div>
              
              {trade.r_multiple && (
                <div className="mt-4 flex items-center gap-4">
                  <Badge className={cn(
                    "text-lg px-3 py-1",
                    trade.r_multiple >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {trade.r_multiple >= 0 ? '+' : ''}{trade.r_multiple.toFixed(2)}R
                  </Badge>
                  {trade.pnl_percentage && (
                    <span className="text-gray-400">
                      {trade.pnl_percentage >= 0 ? '+' : ''}{trade.pnl_percentage.toFixed(2)}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Trade Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">Entry</span>
              </div>
              <p className="text-lg font-semibold text-white">${trade.entry_price?.toFixed(2)}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">Exit</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}
              </p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">Size</span>
              </div>
              <p className="text-lg font-semibold text-white">{trade.quantity}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">Duration</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {trade.duration_minutes ? `${trade.duration_minutes}m` : '-'}
              </p>
            </div>
          </div>

          {/* Risk Management */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Risk Management</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Stop Loss</p>
                <p className="font-semibold text-white">
                  {trade.stop_loss ? `$${trade.stop_loss.toFixed(2)}` : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Take Profit</p>
                <p className="font-semibold text-white">
                  {trade.take_profit ? `$${trade.take_profit.toFixed(2)}` : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Initial Risk</p>
                <p className="font-semibold text-white">
                  {trade.initial_risk ? `$${trade.initial_risk.toFixed(2)}` : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Commissions</p>
                <p className="font-semibold text-white">
                  ${((trade.commission || 0) + (trade.fees || 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {trade.notes && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{trade.notes}</p>
            </div>
          )}

          {/* Screenshots */}
          {(trade.entry_screenshot || trade.exit_screenshot) && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Screenshots</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {trade.entry_screenshot && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Entry</p>
                    <img 
                      src={trade.entry_screenshot} 
                      alt="Entry screenshot" 
                      className="rounded-xl border border-white/10"
                    />
                  </div>
                )}
                {trade.exit_screenshot && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Exit</p>
                    <img 
                      src={trade.exit_screenshot} 
                      alt="Exit screenshot" 
                      className="rounded-xl border border-white/10"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Context */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Context</h3>
            <div className="space-y-4">
              {account && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Account</p>
                  <p className="font-medium text-white">{account.account_name}</p>
                </div>
              )}
              {strategy && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Strategy</p>
                  <p className="font-medium text-white">{strategy.name}</p>
                </div>
              )}
              {trade.setup_type && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Setup</p>
                  <p className="font-medium text-white">{trade.setup_type}</p>
                </div>
              )}
              {trade.session && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Session</p>
                  <Badge variant="outline" className="border-white/20">
                    {trade.session.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </div>
              )}
              {trade.market_condition && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Market</p>
                  <Badge variant="outline" className="border-white/20">
                    {trade.market_condition.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Quality & Psychology */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quality & Psychology</h3>
            <div className="space-y-4">
              {trade.trade_quality && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Trade Quality</p>
                  <Badge className={cn(
                    "text-lg px-3 py-1",
                    trade.trade_quality === 'a_plus' || trade.trade_quality === 'a' ? "bg-emerald-500/20 text-emerald-400" :
                    trade.trade_quality === 'b' ? "bg-amber-500/20 text-amber-400" :
                    "bg-red-500/20 text-red-400"
                  )}>
                    {trade.trade_quality.replace('_', '+').toUpperCase()}
                  </Badge>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-400 mb-2">Followed Rules?</p>
                <Badge className={cn(
                  trade.followed_rules ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                )}>
                  {trade.followed_rules ? 'Yes' : 'No'}
                </Badge>
              </div>

              {trade.emotional_state_entry && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Emotion at Entry</p>
                  <Badge variant="outline" className="border-white/20">
                    {trade.emotional_state_entry.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </div>
              )}

              {trade.emotional_state_exit && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Emotion at Exit</p>
                  <Badge variant="outline" className="border-white/20">
                    {trade.emotional_state_exit.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Mistakes */}
          {trade.mistakes?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Mistakes</h3>
              <div className="flex flex-wrap gap-2">
                {trade.mistakes.map((mistake, idx) => (
                  <Badge key={idx} className="bg-red-500/20 text-red-400">
                    {mistake.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {trade.tags?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {trade.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="border-emerald-500/30 text-emerald-400">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="glass border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trade</DialogTitle>
          </DialogHeader>
          <TradeForm
            trade={trade}
            accounts={accounts}
            strategies={strategies}
            onSuccess={() => {
              setShowEditForm(false);
              queryClient.invalidateQueries({ queryKey: ['trade', tradeId] });
            }}
            onCancel={() => setShowEditForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}