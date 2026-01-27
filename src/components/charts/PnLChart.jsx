import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  const value = payload[0].value;
  const isPositive = value >= 0;
  
  return (
    <div className="glass-card p-3 border border-white/20">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={cn(
        "text-lg font-bold",
        isPositive ? "text-emerald-400" : "text-red-400"
      )}>
        {isPositive ? '+' : ''}{value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
      </p>
    </div>
  );
};

export default function PnLChart({ 
  data = [], 
  height = 300,
  showGrid = true,
  showAxis = true,
  gradient = true,
  className
}) {
  // Calculate cumulative P&L
  const chartData = React.useMemo(() => {
    let cumulative = 0;
    return data.map(item => {
      cumulative += item.net_pnl || 0;
      return {
        ...item,
        date: item.date,
        displayDate: format(new Date(item.date), 'MMM d'),
        pnl: item.net_pnl || 0,
        cumulative
      };
    });
  }, [data]);

  const maxValue = Math.max(...chartData.map(d => d.cumulative), 0);
  const minValue = Math.min(...chartData.map(d => d.cumulative), 0);

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlGradientPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pnlGradientNegative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255,255,255,0.05)" 
              vertical={false}
            />
          )}
          
          {showAxis && (
            <>
              <XAxis 
                dataKey="displayDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                dx={-10}
                domain={[minValue * 1.1, maxValue * 1.1]}
              />
            </>
          )}
          
          <Tooltip content={<CustomTooltip />} />
          
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
          
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#pnlGradientPositive)"
            dot={false}
            activeDot={{ r: 6, fill: '#10b981', stroke: '#0a0b0f', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}