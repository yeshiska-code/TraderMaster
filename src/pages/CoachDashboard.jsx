import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  Eye,
  MessageSquare,
  Flag,
  Star,
  Activity,
  Target,
  AlertTriangle,
  ChevronRight,
  Search
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import StatCard from '@/components/ui/StatCard';
import { cn } from "@/lib/utils";

export default function CoachDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: relationships = [], isLoading } = useQuery({
    queryKey: ['coachingRelationships'],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.CoachingRelationship.filter({ coach_id: user.id });
    },
    enabled: !!user
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['allTrades'],
    queryFn: () => base44.entities.Trade.filter({}, '-entry_time', 500),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['tradeReviews'],
    queryFn: () => base44.entities.TradeReview.filter({}),
  });

  // Get students with their data
  const students = relationships.map(rel => {
    const studentUser = allUsers.find(u => u.id === rel.student_id);
    const studentTrades = trades.filter(t => t.created_by === studentUser?.email);
    const closedTrades = studentTrades.filter(t => t.status === 'closed');
    const pendingReviews = studentTrades.filter(t => t.review_status === 'pending').length;
    const flaggedTrades = studentTrades.filter(t => t.review_status === 'flagged').length;
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
    const wins = closedTrades.filter(t => (t.net_pnl || 0) > 0).length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

    return {
      ...rel,
      user: studentUser,
      trades: studentTrades,
      totalPnL,
      winRate,
      totalTrades: closedTrades.length,
      pendingReviews,
      flaggedTrades
    };
  }).filter(s => s.user);

  // Filter students
  const filteredStudents = students.filter(s =>
    s.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Overall stats
  const totalStudents = students.length;
  const totalPendingReviews = students.reduce((sum, s) => sum + s.pendingReviews, 0);
  const avgWinRate = students.length > 0 
    ? students.reduce((sum, s) => sum + s.winRate, 0) / students.length 
    : 0;
  const studentsInProfit = students.filter(s => s.totalPnL > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Coach Dashboard</h1>
          <p className="text-gray-400 mt-1">Monitor and support your students</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Students"
          value={totalStudents}
          icon={Users}
          iconColor="text-cyan-400"
        />
        <StatCard
          title="Pending Reviews"
          value={totalPendingReviews}
          icon={MessageSquare}
          iconColor="text-amber-400"
          changeType={totalPendingReviews > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          title="Avg Win Rate"
          value={`${avgWinRate.toFixed(1)}%`}
          icon={Target}
          iconColor="text-emerald-400"
          changeType={avgWinRate >= 50 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Students in Profit"
          value={`${studentsInProfit}/${totalStudents}`}
          icon={TrendingUp}
          iconColor="text-violet-400"
        />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-white/5 border-white/10"
        />
      </div>

      {/* Students Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10" />
                <div>
                  <div className="h-4 bg-white/10 rounded w-24 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-32" />
                </div>
              </div>
              <div className="h-20 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No students yet</h3>
          <p className="text-gray-400">Students will appear here when they join your coaching program</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map(student => (
            <div key={student.id} className="glass-card p-6 hover:border-white/20 transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-white/10">
                    <AvatarImage src={student.user?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-400 text-black font-bold">
                      {student.user?.full_name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-white">{student.user?.full_name || 'Student'}</h3>
                    <p className="text-sm text-gray-400">{student.user?.email}</p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    student.status === 'active' ? "border-emerald-500/30 text-emerald-400" :
                    "border-gray-500/30 text-gray-400"
                  )}
                >
                  {student.status}
                </Badge>
              </div>

              {/* Performance */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Performance</span>
                  <span className={cn(
                    "font-semibold",
                    student.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {student.totalPnL >= 0 ? '+' : ''}${student.totalPnL.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Win Rate</span>
                  <span className="text-xs text-gray-400">{student.winRate.toFixed(1)}%</span>
                </div>
                <Progress value={student.winRate} className="h-1.5" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-white/5">
                  <p className="text-lg font-bold text-white">{student.totalTrades}</p>
                  <p className="text-xs text-gray-400">Trades</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-500/10">
                  <p className="text-lg font-bold text-amber-400">{student.pendingReviews}</p>
                  <p className="text-xs text-gray-400">Pending</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-500/10">
                  <p className="text-lg font-bold text-red-400">{student.flaggedTrades}</p>
                  <p className="text-xs text-gray-400">Flagged</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 border-white/10">
                  <Eye className="w-4 h-4 mr-1" />
                  View Trades
                </Button>
                <Button variant="outline" size="sm" className="flex-1 border-white/10">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Message
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Recent Trades to Review</h3>
        </div>
        <div className="divide-y divide-white/5">
          {trades
            .filter(t => t.review_status === 'pending')
            .slice(0, 10)
            .map(trade => {
              const trader = allUsers.find(u => u.email === trade.created_by);
              return (
                <div key={trade.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-white/10 text-sm">
                          {trader?.full_name?.charAt(0) || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{trade.symbol}</span>
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
                          <span className={cn(
                            "text-sm font-semibold",
                            (trade.net_pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                          )}>
                            {(trade.net_pnl || 0) >= 0 ? '+' : ''}${(trade.net_pnl || 0).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {trader?.full_name || 'Unknown'} • {trade.entry_time && format(new Date(trade.entry_time), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-emerald-400">
                      Review
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          {trades.filter(t => t.review_status === 'pending').length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No pending trades to review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}