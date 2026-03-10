'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface HourlyTrafficChartProps {
  data: { hour: number; count: number }[];
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return '12am';
  if (hour === 12) return '12pm';
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

export function WeeklyActivityBar({ data }: HourlyTrafficChartProps) {
  const currentHour = new Date().getHours();
  const hasData = data.some((d) => d.count > 0);

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400">Gym Traffic</span>
        <span className="text-[10px] text-slate-500">Avg per hour (30d)</span>
      </div>
      {hasData ? (
        <div className="h-[100px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="hour"
                tickFormatter={formatHour}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                  padding: '6px 10px',
                }}
                labelFormatter={(h) => formatHour(h as number)}
                formatter={(value: number) => [`${value} avg`, 'Check-ins']}
                cursor={{ stroke: '#475569', strokeDasharray: '3 3' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#trafficGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#06b6d4',
                  stroke: '#0e1729',
                  strokeWidth: 2,
                }}
              />
              {/* Current hour indicator line */}
              {currentHour >= 5 && currentHour <= 23 && (
                <Area
                  type="monotone"
                  dataKey={() => null}
                  stroke="none"
                  fill="none"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[100px] flex items-center justify-center">
          <span className="text-sm text-slate-500">No traffic data yet</span>
        </div>
      )}
    </div>
  );
}
