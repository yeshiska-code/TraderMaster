import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Users, 
  Activity, 
  Shield,
  Settings,
  TrendingUp,
  Database,
  Bell,
  Zap,
  Search,
  MoreHorizontal,
  UserPlus,
  Mail,
  Ban,
  CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from '@/components/ui/StatCard';
import { cn } from "@/lib/utils";

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['allTrades'],
    queryFn: () => base44.entities.Trade.filter({}, '-created_date', 1000),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['allAccounts'],
    queryFn: () => base44.entities.TradingAccount.filter({}),
  });

  const { data: automations = [] } = useQuery({
    queryKey: ['automations'],
    queryFn: () => base44.entities.AutomationRule.filter({}),
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      return base44.users.inviteUser(email, role);
    },
    onSuccess: () => {
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('user');
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    }
  });

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter || u.user_type === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => {
    if (!u.last_active) return false;
    const lastActive = new Date(u.last_active);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return lastActive > weekAgo;
  }).length;
  const totalTrades = trades.length;
  const totalVolume = trades.reduce((sum, t) => sum + Math.abs(t.net_pnl || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 mt-1">Manage users, settings, and monitor platform activity</p>
        </div>
        <Button
          onClick={() => setShowInviteDialog(true)}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          iconColor="text-cyan-400"
        />
        <StatCard
          title="Active (7d)"
          value={activeUsers}
          icon={Activity}
          iconColor="text-emerald-400"
        />
        <StatCard
          title="Total Trades"
          value={totalTrades.toLocaleString()}
          icon={TrendingUp}
          iconColor="text-violet-400"
        />
        <StatCard
          title="Trading Volume"
          value={`$${(totalVolume / 1000).toFixed(0)}k`}
          icon={Database}
          iconColor="text-amber-400"
        />
      </div>

      <Tabs defaultValue="users">
        <TabsList className="bg-white/5 p-1">
          <TabsTrigger value="users" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="automations" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
            <Zap className="w-4 h-4 mr-2" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-white/10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="trader">Trader</SelectItem>
                <SelectItem value="coach">Coach</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Last Active</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-4">
                            <div className="h-4 bg-white/10 rounded w-3/4" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-white/5">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-400 text-black text-xs font-bold">
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-white">{user.full_name || 'Unknown'}</p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              user.role === 'admin' ? "border-violet-500/30 text-violet-400" :
                              user.user_type === 'coach' ? "border-cyan-500/30 text-cyan-400" :
                              "border-gray-500/30 text-gray-400"
                            )}
                          >
                            {user.role === 'admin' ? 'Admin' : user.user_type || 'Trader'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-emerald-500/20 text-emerald-400">
                            Active
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {user.created_date && format(new Date(user.created_date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {user.last_active 
                            ? format(new Date(user.last_active), 'MMM d, h:mm a')
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass border-white/10">
                              <DropdownMenuItem>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Shield className="w-4 h-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem className="text-red-400">
                                <Ban className="w-4 h-4 mr-2" />
                                Suspend
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
        </TabsContent>

        <TabsContent value="automations" className="mt-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Automation Rules</h3>
            {automations.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No automation rules configured</p>
              </div>
            ) : (
              <div className="space-y-3">
                {automations.map(rule => (
                  <div key={rule.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{rule.name}</p>
                        <p className="text-sm text-gray-400">{rule.description}</p>
                      </div>
                      <Badge 
                        className={cn(
                          rule.status === 'active' ? "bg-emerald-500/20 text-emerald-400" :
                          "bg-gray-500/20 text-gray-400"
                        )}
                      >
                        {rule.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Platform Settings</h3>
            <p className="text-gray-400">Platform configuration options will be available here.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation to join the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
              disabled={!inviteEmail || inviteMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
            >
              {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}