import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  subtext: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  loading?: boolean;
  accentColor?: string;
}

export function MetricCard({
  icon,
  label,
  value,
  subtext,
  trend,
  trendLabel,
  loading = false,
  accentColor = 'var(--accent-primary)',
}: MetricCardProps) {
  if (loading) {
    return (
      <div
        className="rounded-xl p-5 flex flex-col justify-between"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
          minHeight: 108,
        }}
      >
        <div className="flex justify-between items-start">
          <div className="rounded" style={{ width: 32, height: 32, backgroundColor: 'var(--bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div className="rounded" style={{ width: 60, height: 16, backgroundColor: 'var(--bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <div>
          <div className="rounded mb-2" style={{ width: 80, height: 28, backgroundColor: 'var(--bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div className="rounded" style={{ width: 120, height: 14, backgroundColor: 'var(--bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      </div>
    );
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'var(--color-success)' : trend === 'down' ? 'var(--color-danger)' : 'var(--text-muted)';

  return (
    <div
      className="rounded-xl p-5 flex flex-col justify-between"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
        minHeight: 108,
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 34, height: 34, backgroundColor: `${accentColor}22` }}
        >
          <span style={{ color: accentColor, display: 'flex' }}>{icon}</span>
        </div>

        {trend && trendLabel && (
          <div className="flex items-center gap-1">
            <TrendIcon size={12} color={trendColor} />
            <span style={{ fontSize: 12, fontWeight: 500, color: trendColor }}>{trendLabel}</span>
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 30, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 2 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{subtext}</div>
      </div>
    </div>
  );
}
