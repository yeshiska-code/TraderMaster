import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TradovateConnectButton from '@/components/accounts/TradovateConnectButton';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Settings,
  Trash2,
  Edit,
  Link2,
  Unlink,
  RefreshCw,
  MoreHorizontal,
  AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { cn } from "@/lib/utils";

const BROKERS = [
  { value: 'interactive_brokers', label: 'Interactive Brokers' },
  { value: 'td_ameritrade', label: 'TD Ameritrade' },
  { value: 'tradovate', label: 'Tradovate' },
  { value: 'ninja_trader', label: 'NinjaTrader' },
  { value: 'meta_trader_4', label: 'MetaTrader 4' },
  { value: 'meta_trader_5', label: 'MetaTrader 5' },
  { value: 'tradestation', label: 'TradeStation' },
  { value: 'ctrader', label: 'cTrader' },
  { value: 'topstep', label: 'TopStep' },
  { value: 'apex', label: 'Apex Trader Funding' },
  { value: 'ftmo', label: 'FTMO' },
  { value: 'the5ers', label: 'The5ers' },
  { value: 'mff', label: 'MyForexFunds' },
  { value: 'other', label: 'Other' },
];

const ACCOUNT_TYPES = [
  { value: 'live', label: 'Live Account' },
  { value: 'demo', label: 'Demo Account' },
  { value: 'prop_firm', label: 'Prop Firm' },
  { value: 'funded', label: 'Funded Account' },
  { value: 'evaluation', label: 'Evaluation' },
];

export default function Accounts() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.TradingAccount.filter({ user_id: user.id });
    },
    enabled: !!user,
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.Trade.filter({}, '-entry_time', 1000),
  });

  const [formData, setFormData] = useState({
    account_name: '',
    broker: 'tradovate',
    account_type: 'live',
    account_number: '',
    initial_balance: 0,
    current_balance: 0,
    currency: 'USD',
    status: 'active',
    connection_type: 'manual',
    risk_settings: {
      max_daily_loss: 0,
      max_drawdown: 0,
      max_position_size: 0,
      max_trades_per_day: 0
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, user_id: user.id };
      if (editingAccount?.id) {
        return base44.entities.TradingAccount.update(editingAccount.id, payload);
      }
      return base44.entities.TradingAccount.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setShowForm(false);
      setEditingAccount(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TradingAccount.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });

  const resetForm = () => {
    setFormData({
      account_name: '',
      broker: 'tradovate',
      account_type: 'live',
      account_number: '',
      initial_balance: 0,
      current_balance: 0,
      currency: 'USD',
      status: 'active',
      connection_type: 'manual',
      risk_settings: {
        max_daily_loss: 0,
        max_drawdown: 0,
        max_position_size: 0,
        max_trades_per_day: 0
      }
    });
  };

  const openEditForm = (account) => {
    setEditingAccount(account);
    setFormData({
      account_name: account.account_name || '',
      broker: account.broker || 'tradovate',
      account_type: account.account_type || 'live',
      account_number: account.account_number || '',
      initial_balance: account.initial_balance || 0,
      current_balance: account.current_balance || 0,
      currency: account.currency || 'USD',
      status: account.status || 'active',
      connection_type: account.connection_type || 'manual',
      risk_settings: account.risk_settings || {
        max_daily_loss: 0,
        max_drawdown: 0,
        max_position_size: 0,
        max_trades_per_day: 0
      }
    });
    setShowForm(true);
  };

  // Calculate account stats
  const getAccountStats = (accountId) => {
    const accountTrades = trades.filter(t => t.account_id === accountId && t.status === 'closed');
    const totalPnL = accountTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
    const wins = accountTrades.filter(t => (t.net_pnl || 0) > 0).length;
    const winRate = accountTrades.length > 0 ? (wins / accountTrades.length) * 100 : 0;
    return { totalPnL, wins, losses: accountTrades.length - wins, winRate, totalTrades: accountTrades.length };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      initial_balance: parseFloat(formData.initial_balance) || 0,
      current_balance: parseFloat(formData.current_balance) || parseFloat(formData.initial_balance) || 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Trading Accounts</h1>
          <p className="text-gray-400 mt-1">Manage your connected trading accounts</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Tradovate Connection */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Tradovate Integration</h2>
            <p className="text-sm text-gray-400">Connect your Tradovate account to auto-sync trades</p>
          </div>
        </div>
        <div className="flex gap-4">
          <TradovateConnectButton environment="demo" />
          <TradovateConnectButton environment="live" />
        </div>
      </div>

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-6 bg-white/10 rounded w-1/2 mb-4" />
              <div className="h-4 bg-white/10 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No accounts yet</h3>
          <p className="text-gray-400 mb-6">Add your first trading account to start tracking</p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(account => {
            const stats = getAccountStats(account.id);
            const brokerInfo = BROKERS.find(b => b.value === account.broker);
            const pnlChange = account.initial_balance > 0 
              ? ((account.current_balance - account.initial_balance) / account.initial_balance * 100)
              : 0;

            return (
              <div key={account.id} className="glass-card p-6 hover:border-white/20 transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      account.status === 'active' ? "bg-emerald-500/20" : "bg-gray-500/20"
                    )}>
                      <Wallet className={cn(
                        "w-6 h-6",
                        account.status === 'active' ? "text-emerald-400" : "text-gray-400"
                      )} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{account.account_name}</h3>
                      <p className="text-sm text-gray-400">{brokerInfo?.label || account.broker}</p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass border-white/10">
                      <DropdownMenuItem onClick={() => openEditForm(account)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem 
                        className="text-red-400"
                        onClick={() => {
                          if (confirm('Delete this account?')) {
                            deleteMutation.mutate(account.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Balance */}
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-1">Current Balance</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-white">
                      ${account.current_balance?.toLocaleString() || '0'}
                    </span>
                    {pnlChange !== 0 && (
                      <span className={cn(
                        "text-sm font-medium",
                        pnlChange >= 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {pnlChange >= 0 ? '+' : ''}{pnlChange.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <p className="text-lg font-bold text-white">{stats.totalTrades}</p>
                    <p className="text-xs text-gray-400">Trades</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <p className={cn(
                      "text-lg font-bold",
                      stats.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      ${Math.abs(stats.totalPnL).toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-400">P&L</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <p className="text-lg font-bold text-white">{stats.winRate.toFixed(0)}%</p>
                    <p className="text-xs text-gray-400">Win Rate</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      account.account_type === 'live' ? "border-emerald-500/30 text-emerald-400" :
                      account.account_type === 'funded' ? "border-cyan-500/30 text-cyan-400" :
                      account.account_type === 'prop_firm' ? "border-violet-500/30 text-violet-400" :
                      "border-gray-500/30 text-gray-400"
                    )}
                  >
                    {ACCOUNT_TYPES.find(t => t.value === account.account_type)?.label || account.account_type}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      account.status === 'active' ? "border-emerald-500/30 text-emerald-400" :
                      "border-gray-500/30 text-gray-400"
                    )}
                  >
                    {account.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Account Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) {
          setEditingAccount(null);
          resetForm();
        }
      }}>
        <DialogContent className="glass border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Account' : 'Add Trading Account'}</DialogTitle>
            <DialogDescription>
              {editingAccount ? 'Update your account details' : 'Connect a new trading account'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Account Name *</Label>
              <Input
                value={formData.account_name}
                onChange={(e) => setFormData(f => ({ ...f, account_name: e.target.value }))}
                placeholder="e.g., Main Futures Account"
                className="bg-white/5 border-white/10"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Broker/Platform *</Label>
                <Select 
                  value={formData.broker}
                  onValueChange={(v) => setFormData(f => ({ ...f, broker: v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BROKERS.map(b => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Account Type *</Label>
                <Select 
                  value={formData.account_type}
                  onValueChange={(v) => setFormData(f => ({ ...f, account_type: v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                value={formData.account_number}
                onChange={(e) => setFormData(f => ({ ...f, account_number: e.target.value }))}
                placeholder="Optional"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Initial Balance</Label>
                <Input
                  type="number"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData(f => ({ ...f, initial_balance: e.target.value }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Current Balance</Label>
                <Input
                  type="number"
                  value={formData.current_balance}
                  onChange={(e) => setFormData(f => ({ ...f, current_balance: e.target.value }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select 
                  value={formData.currency}
                  onValueChange={(v) => setFormData(f => ({ ...f, currency: v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(v) => setFormData(f => ({ ...f, status: v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Saving...' : (editingAccount ? 'Update Account' : 'Add Account')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}