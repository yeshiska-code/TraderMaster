import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Upload, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const ASSET_CLASSES = ['futures', 'forex', 'stocks', 'options', 'crypto', 'cfd', 'other'];
const SESSIONS = ['asian', 'london', 'new_york', 'overlap_london_ny', 'overnight', 'other'];
const MARKET_CONDITIONS = ['trending', 'ranging', 'volatile', 'low_volatility', 'news_driven'];
const TRADE_QUALITIES = ['a_plus', 'a', 'b', 'c', 'd', 'f'];
const EMOTIONAL_STATES_ENTRY = ['calm', 'confident', 'anxious', 'fearful', 'greedy', 'frustrated', 'revenge', 'fomo', 'bored', 'tired'];
const EMOTIONAL_STATES_EXIT = ['satisfied', 'relieved', 'disappointed', 'regretful', 'angry', 'neutral'];
const MISTAKES = ['early_entry', 'late_entry', 'early_exit', 'late_exit', 'moved_stop', 'oversized', 'undersized', 'no_stop_loss', 'revenge_trade', 'fomo', 'overtrading', 'wrong_direction', 'ignored_rules'];

export default function TradeForm({ trade, accounts, strategies, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    account_id: trade?.account_id || '',
    symbol: trade?.symbol || '',
    asset_class: trade?.asset_class || 'futures',
    direction: trade?.direction || 'long',
    entry_price: trade?.entry_price || '',
    exit_price: trade?.exit_price || '',
    quantity: trade?.quantity || '',
    entry_time: trade?.entry_time ? new Date(trade.entry_time) : new Date(),
    exit_time: trade?.exit_time ? new Date(trade.exit_time) : null,
    stop_loss: trade?.stop_loss || '',
    take_profit: trade?.take_profit || '',
    commission: trade?.commission || 0,
    fees: trade?.fees || 0,
    strategy_id: trade?.strategy_id || '',
    setup_type: trade?.setup_type || '',
    session: trade?.session || '',
    market_condition: trade?.market_condition || '',
    trade_quality: trade?.trade_quality || '',
    followed_rules: trade?.followed_rules ?? true,
    emotional_state_entry: trade?.emotional_state_entry || '',
    emotional_state_exit: trade?.emotional_state_exit || '',
    notes: trade?.notes || '',
    tags: trade?.tags || [],
    mistakes: trade?.mistakes || [],
    status: trade?.status || 'closed',
  });

  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Calculate P&L
  const calculatePnL = () => {
    if (!formData.entry_price || !formData.exit_price || !formData.quantity) return null;
    
    const entry = parseFloat(formData.entry_price);
    const exit = parseFloat(formData.exit_price);
    const qty = parseFloat(formData.quantity);
    const commission = parseFloat(formData.commission) || 0;
    const fees = parseFloat(formData.fees) || 0;
    
    let grossPnL;
    if (formData.direction === 'long') {
      grossPnL = (exit - entry) * qty;
    } else {
      grossPnL = (entry - exit) * qty;
    }
    
    const netPnL = grossPnL - commission - fees;
    return { grossPnL, netPnL };
  };

  const pnl = calculatePnL();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        source: 'manual',
        entry_time: data.entry_time?.toISOString(),
        exit_time: data.exit_time?.toISOString(),
        entry_price: parseFloat(data.entry_price),
        exit_price: data.exit_price ? parseFloat(data.exit_price) : null,
        quantity: parseFloat(data.quantity),
        stop_loss: data.stop_loss ? parseFloat(data.stop_loss) : null,
        take_profit: data.take_profit ? parseFloat(data.take_profit) : null,
        commission: parseFloat(data.commission) || 0,
        fees: parseFloat(data.fees) || 0,
        gross_pnl: pnl?.grossPnL,
        net_pnl: pnl?.netPnL,
      };

      // Calculate R-multiple if stop loss is set
      if (payload.stop_loss && payload.entry_price) {
        const risk = Math.abs(payload.entry_price - payload.stop_loss) * payload.quantity;
        if (risk > 0 && payload.net_pnl) {
          payload.r_multiple = payload.net_pnl / risk;
          payload.initial_risk = risk;
        }
      }

      // Calculate duration
      if (payload.entry_time && payload.exit_time) {
        const duration = (new Date(payload.exit_time) - new Date(payload.entry_time)) / (1000 * 60);
        payload.duration_minutes = Math.round(duration);
      }

      if (trade?.id) {
        return base44.entities.Trade.update(trade.id, payload);
      }
      return base44.entities.Trade.create(payload);
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  };

  const toggleMistake = (mistake) => {
    setFormData(f => ({
      ...f,
      mistakes: f.mistakes.includes(mistake)
        ? f.mistakes.filter(m => m !== mistake)
        : [...f.mistakes, mistake]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-white/5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="psychology">Psychology</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select 
                value={formData.account_id} 
                onValueChange={(v) => setFormData(f => ({ ...f, account_id: v }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.account_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Asset Class</Label>
              <Select 
                value={formData.asset_class} 
                onValueChange={(v) => setFormData(f => ({ ...f, asset_class: v }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_CLASSES.map(ac => (
                    <SelectItem key={ac} value={ac}>{ac.replace('_', ' ').toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Symbol *</Label>
              <Input
                value={formData.symbol}
                onChange={(e) => setFormData(f => ({ ...f, symbol: e.target.value.toUpperCase() }))}
                placeholder="e.g., ES, NQ, EUR/USD"
                className="bg-white/5 border-white/10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Direction *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.direction === 'long' ? 'default' : 'outline'}
                  className={cn(
                    "flex-1",
                    formData.direction === 'long' 
                      ? "bg-emerald-500 hover:bg-emerald-600 text-black" 
                      : "border-white/10"
                  )}
                  onClick={() => setFormData(f => ({ ...f, direction: 'long' }))}
                >
                  LONG
                </Button>
                <Button
                  type="button"
                  variant={formData.direction === 'short' ? 'default' : 'outline'}
                  className={cn(
                    "flex-1",
                    formData.direction === 'short' 
                      ? "bg-red-500 hover:bg-red-600 text-white" 
                      : "border-white/10"
                  )}
                  onClick={() => setFormData(f => ({ ...f, direction: 'short' }))}
                >
                  SHORT
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Entry Price *</Label>
              <Input
                type="number"
                step="any"
                value={formData.entry_price}
                onChange={(e) => setFormData(f => ({ ...f, entry_price: e.target.value }))}
                className="bg-white/5 border-white/10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Exit Price</Label>
              <Input
                type="number"
                step="any"
                value={formData.exit_price}
                onChange={(e) => setFormData(f => ({ ...f, exit_price: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input
                type="number"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData(f => ({ ...f, quantity: e.target.value }))}
                className="bg-white/5 border-white/10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stop Loss</Label>
              <Input
                type="number"
                step="any"
                value={formData.stop_loss}
                onChange={(e) => setFormData(f => ({ ...f, stop_loss: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Take Profit</Label>
              <Input
                type="number"
                step="any"
                value={formData.take_profit}
                onChange={(e) => setFormData(f => ({ ...f, take_profit: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entry Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white/5 border-white/10",
                      !formData.entry_time && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.entry_time ? format(formData.entry_time, "PPP HH:mm") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.entry_time}
                    onSelect={(date) => setFormData(f => ({ ...f, entry_time: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Exit Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white/5 border-white/10",
                      !formData.exit_time && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.exit_time ? format(formData.exit_time, "PPP HH:mm") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.exit_time}
                    onSelect={(date) => setFormData(f => ({ ...f, exit_time: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Commission</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.commission}
                onChange={(e) => setFormData(f => ({ ...f, commission: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Other Fees</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.fees}
                onChange={(e) => setFormData(f => ({ ...f, fees: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          {/* P&L Display */}
          {pnl && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Calculated P&L:</span>
                <span className={cn(
                  "text-2xl font-bold",
                  pnl.netPnL >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {pnl.netPnL >= 0 ? '+' : ''}${pnl.netPnL.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Strategy</Label>
              <Select 
                value={formData.strategy_id} 
                onValueChange={(v) => setFormData(f => ({ ...f, strategy_id: v }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Setup Type</Label>
              <Input
                value={formData.setup_type}
                onChange={(e) => setFormData(f => ({ ...f, setup_type: e.target.value }))}
                placeholder="e.g., Breakout, Pullback"
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Session</Label>
              <Select 
                value={formData.session} 
                onValueChange={(v) => setFormData(f => ({ ...f, session: v }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {SESSIONS.map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Market Condition</Label>
              <Select 
                value={formData.market_condition} 
                onValueChange={(v) => setFormData(f => ({ ...f, market_condition: v }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {MARKET_CONDITIONS.map(mc => (
                    <SelectItem key={mc} value={mc}>{mc.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Trade Quality</Label>
            <div className="flex gap-2">
              {TRADE_QUALITIES.map(q => (
                <Button
                  key={q}
                  type="button"
                  variant={formData.trade_quality === q ? 'default' : 'outline'}
                  className={cn(
                    "flex-1",
                    formData.trade_quality === q && "bg-emerald-500 text-black"
                  )}
                  onClick={() => setFormData(f => ({ ...f, trade_quality: q }))}
                >
                  {q.replace('_', '+').toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag..."
                className="bg-white/5 border-white/10"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>Add</Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
              placeholder="Trade notes, observations, lessons learned..."
              className="bg-white/5 border-white/10 min-h-[100px]"
            />
          </div>
        </TabsContent>

        <TabsContent value="psychology" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Emotional State at Entry</Label>
              <Select 
                value={formData.emotional_state_entry} 
                onValueChange={(v) => setFormData(f => ({ ...f, emotional_state_entry: v }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {EMOTIONAL_STATES_ENTRY.map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Emotional State at Exit</Label>
              <Select 
                value={formData.emotional_state_exit} 
                onValueChange={(v) => setFormData(f => ({ ...f, emotional_state_exit: v }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {EMOTIONAL_STATES_EXIT.map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Did you follow your rules?</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.followed_rules ? 'default' : 'outline'}
                className={cn(
                  "flex-1",
                  formData.followed_rules && "bg-emerald-500 text-black"
                )}
                onClick={() => setFormData(f => ({ ...f, followed_rules: true }))}
              >
                Yes
              </Button>
              <Button
                type="button"
                variant={!formData.followed_rules ? 'default' : 'outline'}
                className={cn(
                  "flex-1",
                  !formData.followed_rules && "bg-red-500 text-white"
                )}
                onClick={() => setFormData(f => ({ ...f, followed_rules: false }))}
              >
                No
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mistakes Made</Label>
            <div className="flex flex-wrap gap-2">
              {MISTAKES.map(mistake => (
                <Button
                  key={mistake}
                  type="button"
                  variant={formData.mistakes.includes(mistake) ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    formData.mistakes.includes(mistake) && "bg-red-500/80 hover:bg-red-600 text-white border-0"
                  )}
                  onClick={() => toggleMistake(mistake)}
                >
                  {mistake.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Saving...' : (trade?.id ? 'Update Trade' : 'Save Trade')}
        </Button>
      </div>
    </form>
  );
}