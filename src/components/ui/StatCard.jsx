import React from 'react';
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', // positive, negative, neutral
  icon: Icon,
  iconColor = 'text-emerald-400',
  bgGlow,
  subtitle,
  className
}) {
  const getTrendIcon = () => {
    if (changeType === 'positive') return <TrendingUp className="w-3 h-3" />;
    if (changeType === 'negative') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (changeType === 'positive') return 'text-emerald-400';
    if (changeType === 'negative') return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]",
        "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10",
        bgGlow && "glow-green",
        className
      )}
    >
      {/* Background Decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 blur-2xl" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          {Icon && (
            <div className={cn("p-2 rounded-xl bg-white/5", iconColor)}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl lg:text-3xl font-bold text-white mb-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
              {getTrendIcon()}
              <span>{change}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}