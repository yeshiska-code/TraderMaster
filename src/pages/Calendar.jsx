import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek,
  parseISO
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  Calendar as CalendarIcon,
  BarChart3
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const { data: dailyStats = [] } = useQuery({
    queryKey: ['dailyStats', format(currentMonth, 'yyyy-MM')],
    queryFn: () => base44.entities.DailyStats.filter({}, '-date', 100),
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.Trade.filter({}, '-entry_time', 500),
  });

  // Create stats map by date
  const statsMap = useMemo(() => {
    const map = new Map();
    
    // Group trades by date
    trades.forEach(trade => {
      if (!trade.entry_time) return;
      const dateKey = format(new Date(trade.entry_time), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, { trades: [], pnl: 0, wins: 0, losses: 0 });
      }
      const day = map.get(dateKey);
      day.trades.push(trade);
      const pnl = trade.net_pnl || 0;
      day.pnl += pnl;
      if (pnl > 0) day.wins++;
      if (pnl < 0) day.losses++;
    });

    // Merge with daily stats
    dailyStats.forEach(stat => {
      const dateKey = stat.date;
      if (!map.has(dateKey)) {
        map.set(dateKey, { trades: [], pnl: stat.net_pnl || 0, wins: stat.winning_trades || 0, losses: stat.losing_trades || 0 });
      }
    });

    return map;
  }, [trades, dailyStats]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Selected date details
  const selectedDateDetails = useMemo(() => {
    if (!selectedDate) return null;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return statsMap.get(dateKey);
  }, [selectedDate, statsMap]);

  // Month summary
  const monthSummary = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    let totalPnL = 0;
    let tradingDays = 0;
    let greenDays = 0;
    let redDays = 0;
    let totalTrades = 0;

    statsMap.forEach((value, key) => {
      const date = parseISO(key);
      if (date >= monthStart && date <= monthEnd) {
        tradingDays++;
        totalPnL += value.pnl;
        totalTrades += value.trades.length;
        if (value.pnl > 0) greenDays++;
        if (value.pnl < 0) redDays++;
      }
    });

    return { totalPnL, tradingDays, greenDays, redDays, totalTrades };
  }, [currentMonth, statsMap]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Trading Calendar</h1>
          <p className="text-gray-400 mt-1">Visualize your daily trading performance</p>
        </div>
      </div>

      {/* Month Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-gray-400">Month P&L</p>
          <p className={cn(
            "text-2xl font-bold",
            monthSummary.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {monthSummary.totalPnL >= 0 ? '+' : ''}${monthSummary.totalPnL.toFixed(2)}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-gray-400">Trading Days</p>
          <p className="text-2xl font-bold text-white">{monthSummary.tradingDays}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-gray-400">Green Days</p>
          <p className="text-2xl font-bold text-emerald-400">{monthSummary.greenDays}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-gray-400">Red Days</p>
          <p className="text-2xl font-bold text-red-400">{monthSummary.redDays}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-gray-400">Total Trades</p>
          <p className="text-2xl font-bold text-white">{monthSummary.totalTrades}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 glass-card p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="border-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date())}
                className="border-white/10"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="border-white/10"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayData = statsMap.get(dateKey);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "aspect-square p-2 rounded-xl transition-all text-left flex flex-col",
                    isCurrentMonth ? "hover:bg-white/10" : "opacity-30",
                    isSelected && "ring-2 ring-emerald-500 bg-emerald-500/10",
                    isToday && !isSelected && "ring-2 ring-white/30",
                    dayData && dayData.pnl > 0 && "bg-emerald-500/10",
                    dayData && dayData.pnl < 0 && "bg-red-500/10"
                  )}
                >
                  <span className={cn(
                    "text-sm",
                    isCurrentMonth ? "text-white" : "text-gray-500"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayData && isCurrentMonth && (
                    <div className="mt-auto">
                      <span className={cn(
                        "text-xs font-semibold",
                        dayData.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {dayData.pnl >= 0 ? '+' : ''}${Math.abs(dayData.pnl).toFixed(0)}
                      </span>
                      {dayData.trades.length > 0 && (
                        <div className="flex items-center gap-0.5 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ opacity: dayData.wins / Math.max(dayData.trades.length, 1) }} />
                          <span className="text-[10px] text-gray-400">{dayData.trades.length}</span>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Details Sidebar */}
        <div className="glass-card p-6">
          {selectedDate ? (
            <>
              <h3 className="text-lg font-semibold text-white mb-1">
                {format(selectedDate, 'EEEE')}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                {format(selectedDate, 'MMMM d, yyyy')}
              </p>

              {selectedDateDetails ? (
                <div className="space-y-6">
                  {/* Day P&L */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-gray-400 mb-1">Day's P&L</p>
                    <p className={cn(
                      "text-3xl font-bold",
                      selectedDateDetails.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {selectedDateDetails.pnl >= 0 ? '+' : ''}${selectedDateDetails.pnl.toFixed(2)}
                    </p>
                  </div>

                  {/* Day Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-emerald-500/10">
                      <p className="text-2xl font-bold text-emerald-400">{selectedDateDetails.wins}</p>
                      <p className="text-xs text-gray-400">Wins</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10">
                      <p className="text-2xl font-bold text-red-400">{selectedDateDetails.losses}</p>
                      <p className="text-xs text-gray-400">Losses</p>
                    </div>
                  </div>

                  {/* Trades List */}
                  {selectedDateDetails.trades.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Trades</h4>
                      <div className="space-y-2">
                        {selectedDateDetails.trades.map((trade) => (
                          <Link
                            key={trade.id}
                            to={createPageUrl('TradeDetail') + `?id=${trade.id}`}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {(trade.net_pnl || 0) >= 0 
                                ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                                : <TrendingDown className="w-4 h-4 text-red-400" />
                              }
                              <div>
                                <p className="font-medium text-white">{trade.symbol}</p>
                                <p className="text-xs text-gray-400">
                                  {trade.direction?.toUpperCase()} • {trade.entry_time && format(new Date(trade.entry_time), 'HH:mm')}
                                </p>
                              </div>
                            </div>
                            <span className={cn(
                              "font-semibold",
                              (trade.net_pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                            )}>
                              {(trade.net_pnl || 0) >= 0 ? '+' : ''}${(trade.net_pnl || 0).toFixed(2)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View Journal Button */}
                  <Link to={createPageUrl('Journal') + `?date=${format(selectedDate, 'yyyy-MM-dd')}`}>
                    <Button variant="outline" className="w-full border-white/20">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      View Day's Journal
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No trading activity</p>
                  <Link to={createPageUrl('Trades') + '?action=new'}>
                    <Button variant="link" className="text-emerald-400 mt-2">
                      Log a trade
                    </Button>
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Select a day to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}