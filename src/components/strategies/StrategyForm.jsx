import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Plus, X, Trash2 } from 'lucide-react';
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const ASSET_CLASSES = ['futures', 'forex', 'stocks', 'options', 'crypto', 'cfd'];
const SESSIONS = ['asian', 'london', 'new_york', 'overlap_london_ny', 'overnight'];

export default function StrategyForm({ strategy, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: strategy?.name || '',
    description: strategy?.description || '',
    status: strategy?.status || 'active',
    asset_classes: strategy?.asset_classes || [],
    symbols: strategy?.symbols || [],
    timeframes: strategy?.timeframes || [],
    sessions: strategy?.sessions || [],
    entry_rules: strategy?.entry_rules || [],
    exit_rules: strategy?.exit_rules || [],
    risk_rules: strategy?.risk_rules || {
      risk_per_trade: 1,
      max_daily_risk: 3,
      max_concurrent_trades: 3,
      max_trades_per_day: 5,
      min_rr_ratio: 1.5
    },
    setup_types: strategy?.setup_types || [],
    tags: strategy?.tags || []
  });

  const [symbolInput, setSymbolInput] = useState('');
  const [timeframeInput, setTimeframeInput] = useState('');
  const [setupInput, setSetupInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (strategy?.id) {
        return base44.entities.Strategy.update(strategy.id, data);
      }
      return base44.entities.Strategy.create(data);
    },
    onSuccess: () => {
      onSuccess();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const addToArray = (field, value, clearFn) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(f => ({ ...f, [field]: [...f[field], value.trim()] }));
      clearFn('');
    }
  };

  const removeFromArray = (field, value) => {
    setFormData(f => ({ ...f, [field]: f[field].filter(v => v !== value) }));
  };

  const toggleArrayItem = (field, value) => {
    setFormData(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(v => v !== value)
        : [...f[field], value]
    }));
  };

  const addEntryRule = () => {
    setFormData(f => ({
      ...f,
      entry_rules: [...f.entry_rules, {
        id: Date.now().toString(),
        name: '',
        condition_type: 'indicator',
        indicator: '',
        operator: 'equals',
        value: '',
        required: true
      }]
    }));
  };

  const updateEntryRule = (id, updates) => {
    setFormData(f => ({
      ...f,
      entry_rules: f.entry_rules.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const removeEntryRule = (id) => {
    setFormData(f => ({ ...f, entry_rules: f.entry_rules.filter(r => r.id !== id) }));
  };

  const addExitRule = () => {
    setFormData(f => ({
      ...f,
      exit_rules: [...f.exit_rules, {
        id: Date.now().toString(),
        name: '',
        type: 'stop_loss',
        value: ''
      }]
    }));
  };

  const updateExitRule = (id, updates) => {
    setFormData(f => ({
      ...f,
      exit_rules: f.exit_rules.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const removeExitRule = (id) => {
    setFormData(f => ({ ...f, exit_rules: f.exit_rules.filter(r => r.id !== id) }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-white/5">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="entry">Entry Rules</TabsTrigger>
          <TabsTrigger value="exit">Exit Rules</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Strategy Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., London Breakout"
              className="bg-white/5 border-white/10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe your strategy..."
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="testing">Testing</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Asset Classes</Label>
            <div className="flex flex-wrap gap-2">
              {ASSET_CLASSES.map(ac => (
                <Button
                  key={ac}
                  type="button"
                  variant={formData.asset_classes.includes(ac) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayItem('asset_classes', ac)}
                  className={cn(
                   formData.asset_classes.includes(ac) && "bg-emerald-500 text-white"
                  )}
                >
                  {ac.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sessions</Label>
            <div className="flex flex-wrap gap-2">
              {SESSIONS.map(session => (
                <Button
                  key={session}
                  type="button"
                  variant={formData.sessions.includes(session) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayItem('sessions', session)}
                  className={cn(
                   formData.sessions.includes(session) && "bg-emerald-500 text-white"
                  )}
                >
                  {session.replace(/_/g, ' ').toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Symbols</Label>
            <div className="flex gap-2">
              <Input
                value={symbolInput}
                onChange={(e) => setSymbolInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('symbols', symbolInput, setSymbolInput))}
                placeholder="e.g., ES, NQ, EUR/USD"
                className="bg-white/5 border-white/10"
              />
              <Button type="button" variant="outline" onClick={() => addToArray('symbols', symbolInput, setSymbolInput)}>
                Add
              </Button>
            </div>
            {formData.symbols.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.symbols.map(symbol => (
                  <Badge key={symbol} className="bg-white/10 text-white">
                    {symbol}
                    <button type="button" onClick={() => removeFromArray('symbols', symbol)} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Setup Types</Label>
            <div className="flex gap-2">
              <Input
                value={setupInput}
                onChange={(e) => setSetupInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('setup_types', setupInput, setSetupInput))}
                placeholder="e.g., Breakout, Pullback, Reversal"
                className="bg-white/5 border-white/10"
              />
              <Button type="button" variant="outline" onClick={() => addToArray('setup_types', setupInput, setSetupInput)}>
                Add
              </Button>
            </div>
            {formData.setup_types.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.setup_types.map(setup => (
                  <Badge key={setup} className="bg-cyan-500/20 text-cyan-400">
                    {setup}
                    <button type="button" onClick={() => removeFromArray('setup_types', setup)} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="entry" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <Label>Entry Rules</Label>
            <Button type="button" variant="outline" size="sm" onClick={addEntryRule}>
              <Plus className="w-4 h-4 mr-1" />
              Add Rule
            </Button>
          </div>

          {formData.entry_rules.length === 0 ? (
            <div className="p-8 rounded-xl bg-white/5 border border-dashed border-white/20 text-center">
              <p className="text-gray-400 mb-2">No entry rules defined</p>
              <Button type="button" variant="outline" size="sm" onClick={addEntryRule}>
                <Plus className="w-4 h-4 mr-1" />
                Add Entry Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.entry_rules.map((rule, idx) => (
                <div key={rule.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-400">Rule {idx + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEntryRule(rule.id)}
                      className="h-8 w-8 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input
                    value={rule.name}
                    onChange={(e) => updateEntryRule(rule.id, { name: e.target.value })}
                    placeholder="Rule name (e.g., Price above 20 EMA)"
                    className="bg-white/5 border-white/10"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={rule.indicator}
                      onChange={(e) => updateEntryRule(rule.id, { indicator: e.target.value })}
                      placeholder="Indicator"
                      className="bg-white/5 border-white/10"
                    />
                    <Select 
                      value={rule.operator}
                      onValueChange={(v) => updateEntryRule(rule.id, { operator: v })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                        <SelectItem value="crosses_above">Crosses Above</SelectItem>
                        <SelectItem value="crosses_below">Crosses Below</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={rule.value}
                      onChange={(e) => updateEntryRule(rule.id, { value: e.target.value })}
                      placeholder="Value"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="exit" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <Label>Exit Rules</Label>
            <Button type="button" variant="outline" size="sm" onClick={addExitRule}>
              <Plus className="w-4 h-4 mr-1" />
              Add Rule
            </Button>
          </div>

          {formData.exit_rules.length === 0 ? (
            <div className="p-8 rounded-xl bg-white/5 border border-dashed border-white/20 text-center">
              <p className="text-gray-400 mb-2">No exit rules defined</p>
              <Button type="button" variant="outline" size="sm" onClick={addExitRule}>
                <Plus className="w-4 h-4 mr-1" />
                Add Exit Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.exit_rules.map((rule, idx) => (
                <div key={rule.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-400">Exit {idx + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExitRule(rule.id)}
                      className="h-8 w-8 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select 
                      value={rule.type}
                      onValueChange={(v) => updateExitRule(rule.id, { type: v })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stop_loss">Stop Loss</SelectItem>
                        <SelectItem value="take_profit">Take Profit</SelectItem>
                        <SelectItem value="trailing_stop">Trailing Stop</SelectItem>
                        <SelectItem value="time_based">Time-Based</SelectItem>
                        <SelectItem value="indicator_based">Indicator-Based</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={rule.value}
                      onChange={(e) => updateExitRule(rule.id, { value: e.target.value })}
                      placeholder="Value (e.g., 2R, -$100, 15:30)"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="risk" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Risk Per Trade (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.risk_rules.risk_per_trade}
                onChange={(e) => setFormData(f => ({
                  ...f,
                  risk_rules: { ...f.risk_rules, risk_per_trade: parseFloat(e.target.value) || 0 }
                }))}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Daily Risk (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.risk_rules.max_daily_risk}
                onChange={(e) => setFormData(f => ({
                  ...f,
                  risk_rules: { ...f.risk_rules, max_daily_risk: parseFloat(e.target.value) || 0 }
                }))}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Concurrent Trades</Label>
              <Input
                type="number"
                value={formData.risk_rules.max_concurrent_trades}
                onChange={(e) => setFormData(f => ({
                  ...f,
                  risk_rules: { ...f.risk_rules, max_concurrent_trades: parseInt(e.target.value) || 0 }
                }))}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Trades Per Day</Label>
              <Input
                type="number"
                value={formData.risk_rules.max_trades_per_day}
                onChange={(e) => setFormData(f => ({
                  ...f,
                  risk_rules: { ...f.risk_rules, max_trades_per_day: parseInt(e.target.value) || 0 }
                }))}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Minimum R:R Ratio</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.risk_rules.min_rr_ratio}
                onChange={(e) => setFormData(f => ({
                  ...f,
                  risk_rules: { ...f.risk_rules, min_rr_ratio: parseFloat(e.target.value) || 0 }
                }))}
                className="bg-white/5 border-white/10"
              />
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
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Saving...' : (strategy?.id ? 'Update Strategy' : 'Create Strategy')}
        </Button>
      </div>
    </form>
  );
}