import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Wallet,
  Target,
  Save,
  Upload,
  Camera
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState(null);

  React.useEffect(() => {
    if (user && !formData) {
      setFormData({
        full_name: user.full_name || '',
        timezone: user.timezone || 'UTC',
        trading_experience: user.trading_experience || 'intermediate',
        preferred_markets: user.preferred_markets || [],
        notification_preferences: user.notification_preferences || {
          email_alerts: true,
          push_alerts: true,
          daily_summary: true,
          coach_messages: true,
          ai_insights: true
        },
        trading_goals: user.trading_goals || {
          monthly_target: 5000,
          risk_per_trade: 1,
          max_daily_loss: 500,
          target_win_rate: 50
        }
      });
    }
  }, [user, formData]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading || !formData) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-white/10 rounded w-1/4 animate-pulse" />
        <div className="glass-card p-6 animate-pulse">
          <div className="h-32 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  const TIMEZONES = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Hong_Kong',
    'Asia/Singapore', 'Australia/Sydney'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="goals" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
            <Target className="w-4 h-4 mr-2" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Profile Information</h3>
            
            {/* Avatar */}
            <div className="flex items-center gap-6 mb-6">
              <Avatar className="w-20 h-20 border-2 border-emerald-500/50">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-400 text-black font-bold text-xl">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm" className="border-white/20">
                  <Camera className="w-4 h-4 mr-2" />
                  Change Photo
                </Button>
                <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData(f => ({ ...f, full_name: e.target.value }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={user?.email}
                  disabled
                  className="bg-white/5 border-white/10 opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select 
                  value={formData.timezone}
                  onValueChange={(v) => setFormData(f => ({ ...f, timezone: v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trading Experience</Label>
                <Select 
                  value={formData.trading_experience}
                  onValueChange={(v) => setFormData(f => ({ ...f, trading_experience: v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (< 1 year)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (3-5 years)</SelectItem>
                    <SelectItem value="professional">Professional (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="mt-6 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Trading Goals</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Monthly P&L Target ($)</Label>
                <Input
                  type="number"
                  value={formData.trading_goals.monthly_target}
                  onChange={(e) => setFormData(f => ({
                    ...f,
                    trading_goals: { ...f.trading_goals, monthly_target: parseFloat(e.target.value) || 0 }
                  }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Risk Per Trade (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.trading_goals.risk_per_trade}
                  onChange={(e) => setFormData(f => ({
                    ...f,
                    trading_goals: { ...f.trading_goals, risk_per_trade: parseFloat(e.target.value) || 0 }
                  }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Daily Loss ($)</Label>
                <Input
                  type="number"
                  value={formData.trading_goals.max_daily_loss}
                  onChange={(e) => setFormData(f => ({
                    ...f,
                    trading_goals: { ...f.trading_goals, max_daily_loss: parseFloat(e.target.value) || 0 }
                  }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Target Win Rate (%)</Label>
                <Input
                  type="number"
                  value={formData.trading_goals.target_win_rate}
                  onChange={(e) => setFormData(f => ({
                    ...f,
                    trading_goals: { ...f.trading_goals, target_win_rate: parseFloat(e.target.value) || 0 }
                  }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Notification Preferences</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Email Alerts</p>
                  <p className="text-sm text-gray-400">Receive important alerts via email</p>
                </div>
                <Switch
                  checked={formData.notification_preferences.email_alerts}
                  onCheckedChange={(checked) => setFormData(f => ({
                    ...f,
                    notification_preferences: { ...f.notification_preferences, email_alerts: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Push Notifications</p>
                  <p className="text-sm text-gray-400">Browser push notifications for real-time alerts</p>
                </div>
                <Switch
                  checked={formData.notification_preferences.push_alerts}
                  onCheckedChange={(checked) => setFormData(f => ({
                    ...f,
                    notification_preferences: { ...f.notification_preferences, push_alerts: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Daily Summary</p>
                  <p className="text-sm text-gray-400">Receive a daily performance summary email</p>
                </div>
                <Switch
                  checked={formData.notification_preferences.daily_summary}
                  onCheckedChange={(checked) => setFormData(f => ({
                    ...f,
                    notification_preferences: { ...f.notification_preferences, daily_summary: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Coach Messages</p>
                  <p className="text-sm text-gray-400">Notifications when your coach sends feedback</p>
                </div>
                <Switch
                  checked={formData.notification_preferences.coach_messages}
                  onCheckedChange={(checked) => setFormData(f => ({
                    ...f,
                    notification_preferences: { ...f.notification_preferences, coach_messages: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">AI Insights</p>
                  <p className="text-sm text-gray-400">Get notified about new AI-generated insights</p>
                </div>
                <Switch
                  checked={formData.notification_preferences.ai_insights}
                  onCheckedChange={(checked) => setFormData(f => ({
                    ...f,
                    notification_preferences: { ...f.notification_preferences, ai_insights: checked }
                  }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}