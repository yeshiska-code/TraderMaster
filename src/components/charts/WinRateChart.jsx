import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from "@/lib/utils";

const COLORS = ['#10b981', '#ef4444', '#6b7280'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="glass-card p-2 border border-white/20">
      <p className="text-xs text-gray-400">{payload[0].name}</p>
      <p className="text-sm font-bold text-white">{payload[0].value} trades</p>
    </div>
  );
};

export default function WinRateChart({ 
  wins = 0, 
  losses = 0, 
  breakeven = 0,
  size = 200,
  showLabels = true,
  className
}) {
  const total = wins + losses + breakeven;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
  
  const data = [
    { name: 'Wins', value: wins, color: '#10b981' },
    { name: 'Losses', value: losses, color: '#ef4444' },
    { name: 'Breakeven', value: breakeven, color: '#6b7280' },
  ].filter(d => d.value > 0);

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.35}
              outerRadius={size * 0.45}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{winRate}%</span>
          <span className="text-xs text-gray-400">Win Rate</span>
        </div>
      </div>
      
      {showLabels && (
        <div className="flex items-center gap-4 mt-4">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-400">
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}