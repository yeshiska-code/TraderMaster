import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, 
  CalendarDays, 
  Table2, 
  Brain, 
  Target, 
  LineChart, 
  Heart, 
  Sparkles,
  Bell, 
  Settings, 
  Users, 
  Shield,
  Menu,
  X,
  ChevronDown,
  LogOut,
  TrendingUp,
  Wallet,
  Zap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const publicPages = ['Landing', 'Login', 'Register', 'Onboarding'];

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Calendar', icon: CalendarDays, page: 'Calendar' },
  { name: 'Trades', icon: Table2, page: 'Trades' },
  { name: 'Strategies', icon: Target, page: 'Strategies' },
  { name: 'Analytics', icon: LineChart, page: 'Analytics' },
  { name: 'Journal', icon: Heart, page: 'Journal' },
  { name: 'AI Agent', icon: Sparkles, page: 'AIAgent' },
];

const coachNavItems = [
  { name: 'Coach Dashboard', icon: Users, page: 'CoachDashboard' },
];

const adminNavItems = [
  { name: 'Admin Panel', icon: Shield, page: 'AdminPanel' },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['unreadAlerts'],
    queryFn: async () => {
      if (!user) return [];
      const allAlerts = await base44.entities.Alert.filter({ 
        user_id: user.id, 
        is_read: false 
      }, '-created_date', 5);
      return allAlerts;
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  // Public pages without layout
  if (publicPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  const isCoach = user?.user_type === 'coach' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin' || user?.user_type === 'super_admin';

  const allNavItems = [
    ...navItems,
    ...(isCoach ? coachNavItems : []),
    ...(isAdmin ? adminNavItems : []),
  ];

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-lg">TradeEdge</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-16 bottom-0 w-72 glass border-r border-white/10 p-4 overflow-y-auto">
            <nav className="space-y-1">
              {allNavItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      isActive 
                        ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive && "text-emerald-400")} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex fixed left-0 top-0 bottom-0 z-40 flex-col transition-all duration-300 glass border-r border-white/10",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center glow-green">
              <TrendingUp className="w-6 h-6 text-black" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-xl gradient-text">TradeEdge</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white"
          >
            <ChevronDown className={cn("w-4 h-4 transition-transform", sidebarOpen ? "rotate-90" : "-rotate-90")} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {allNavItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-emerald-400")} />
                {sidebarOpen && (
                  <span className="font-medium truncate">{item.name}</span>
                )}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-lg text-white text-sm opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-white/10">
          {sidebarOpen && user?.subscription_tier !== 'enterprise' && (
            <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-violet-300">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">Unlock AI insights & advanced analytics</p>
              <Button size="sm" className="w-full bg-violet-500 hover:bg-violet-600 text-white text-xs">
                Upgrade Now
              </Button>
            </div>
          )}
          
          <Link
            to={createPageUrl('Settings')}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-white/5",
              currentPageName === 'Settings' && "bg-white/5 text-white"
            )}
          >
            <Settings className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={cn(
          "min-h-screen transition-all duration-300 pt-16 lg:pt-0",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        {/* Top Bar */}
        <header className="hidden lg:flex h-16 items-center justify-between px-6 border-b border-white/10 glass sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white">{currentPageName}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            <div className="hidden xl:flex items-center gap-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-400">Balance:</span>
                <span className="text-sm font-semibold text-emerald-400">
                  ${user?.stats_cache?.total_pnl?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-gray-400">Win Rate:</span>
                <span className="text-sm font-semibold text-cyan-400">
                  {user?.stats_cache?.win_rate?.toFixed(1) || '0'}%
                </span>
              </div>
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5 text-gray-400" />
                  {alerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center animate-pulse">
                      {alerts.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 glass border-white/10">
                <div className="p-3 border-b border-white/10">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                {alerts.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    No new notifications
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <DropdownMenuItem key={alert.id} className="p-3 cursor-pointer">
                      <div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-gray-400">{alert.message}</p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 px-2">
                  <Avatar className="w-8 h-8 border-2 border-emerald-500/50">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-400 text-black font-bold text-sm">
                      {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden xl:block text-left">
                    <p className="text-sm font-medium">{user?.full_name || 'Trader'}</p>
                    <p className="text-xs text-gray-400">{user?.subscription_tier || 'Free'} Plan</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass border-white/10">
                <div className="p-3 border-b border-white/10">
                  <p className="font-semibold">{user?.full_name || 'Trader'}</p>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('Settings')} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('Accounts')} className="cursor-pointer">
                    <Wallet className="w-4 h-4 mr-2" />
                    Accounts
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  className="text-red-400 cursor-pointer"
                  onClick={() => base44.auth.logout()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}