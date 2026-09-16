import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TrafficFlowData, TrafficFlowPoint } from '../../types/dashboard';

type Period = 'today' | '7days' | '30days';

interface TrafficFlowChartProps {
  data: TrafficFlowData | null;
  loading?: boolean;
}

const periodLabels: Record<Period, string> = {
  today:  'Today',
  '7days':  '7 Days',
  '30days': '30 Days',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: TrafficFlowPoint }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E6EAF0',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 6 }}>{d.label}</p>
      <p style={{ fontSize: 12, color: '#667085', margin: '2px 0' }}>
        Vehicles: <strong style={{ color: '#111827' }}>{d.vehicles.toLocaleString()}</strong>
      </p>
      <p style={{ fontSize: 12, color: '#667085', margin: '2px 0' }}>
        Avg Speed: <strong style={{ color: '#111827' }}>{d.avgSpeed} km/h</strong>
      </p>
    </div>
  );
}

export function TrafficFlowChart({ data, loading = false }: TrafficFlowChartProps) {
  const [period, setPeriod] = useState<Period>('today');

  const chartData = data
    ? period === 'today'
      ? data.today
      : period === '7days'
      ? data.sevenDays
      : data.thirtyDays
    : [];

  return (
    <div
      className="rounded-xl"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E6EAF0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pt-5 pb-4"
        style={{ borderBottom: '1px solid #F0F3F8' }}
      >
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Traffic Flow Today</h2>
          <p style={{ fontSize: 12.5, color: '#98A2B3', margin: '2px 0 0' }}>Hourly vehicle volume across city</p>
        </div>

        {/* Period selector */}
        <div
          style={{
            display: 'flex',
            gap: 2,
            backgroundColor: '#F5F7FA',
            borderRadius: 6,
            padding: 2,
            border: '1px solid #E6EAF0',
          }}
        >
          {(Object.entries(periodLabels) as [Period, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              style={{
                padding: '3px 10px',
                fontSize: 12,
                fontWeight: period === key ? 500 : 400,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: period === key ? '#FFFFFF' : 'transparent',
                color: period === key ? '#111827' : '#98A2B3',
                boxShadow: period === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 px-2 pt-4 pb-3">
        {loading ? (
          <div
            style={{ height: '100%', backgroundColor: '#F5F7FA', borderRadius: 8, minHeight: 200, animation: 'pulse 1.5s infinite' }}
          />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 16, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="vehicleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2457D6" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2457D6" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E6EAF0"
                vertical={false}
              />

              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11.5, fill: '#98A2B3' }}
                dy={6}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11.5, fill: '#98A2B3' }}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                width={38}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E6EAF0', strokeWidth: 1 }} />

              <Area
                type="monotone"
                dataKey="vehicles"
                stroke="#2457D6"
                strokeWidth={1.75}
                fill="url(#vehicleGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#2457D6', strokeWidth: 0 }}
                animationDuration={700}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
