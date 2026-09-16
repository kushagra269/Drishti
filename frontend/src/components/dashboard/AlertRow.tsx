import type { PriorityAlert, AlertSeverity } from '../../types/dashboard';

interface AlertRowProps {
  alert: PriorityAlert;
}

const severityConfig: Record<AlertSeverity, { dot: string; badge: string; badgeText: string; label: string }> = {
  high:   { dot: 'var(--color-danger)', badge: 'rgba(185, 74, 74, 0.15)', badgeText: 'var(--color-danger)', label: 'HIGH' },
  medium: { dot: 'var(--color-warning)', badge: 'rgba(212, 154, 70, 0.15)', badgeText: 'var(--color-warning)', label: 'MED' },
  low:    { dot: 'var(--color-success)', badge: 'rgba(95, 167, 124, 0.15)', badgeText: 'var(--color-success)', label: 'LOW' },
};

export function AlertRow({ alert }: AlertRowProps) {
  const cfg = severityConfig[alert.severity];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 0',
        borderBottom: '1px solid var(--border-soft)',
      }}
    >
      <div style={{ paddingTop: 4, flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: cfg.dot }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: cfg.badgeText,
              backgroundColor: cfg.badge,
              padding: '1px 6px',
              borderRadius: 3,
              letterSpacing: '0.06em',
              flexShrink: 0,
            }}
          >
            {cfg.label}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {alert.title}
          </span>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{alert.description}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          {alert.plate && (
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              {alert.plate}
            </span>
          )}
          {alert.camera && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{alert.camera}</span>
          )}
          {alert.location && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {alert.location}</span>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{alert.timeAgo}</span>
        </div>
      </div>
    </div>
  );
}
