import type { ReactNode } from 'react';

interface AnalyticsSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function AnalyticsSection({ title, subtitle, children, className = '' }: AnalyticsSectionProps) {
  return (
    <section
      className={`rounded-xl p-5 ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="mb-4">
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
        {subtitle && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export const chartTooltipStyle = {
  borderRadius: 8,
  border: '1px solid var(--border-default)',
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  boxShadow: 'var(--shadow-md)',
  fontSize: 12,
} as const;

export const axisTick = { fontSize: 11, fill: '#748292' };
