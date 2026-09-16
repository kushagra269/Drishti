import { Link } from 'react-router-dom';
import { Route } from 'lucide-react';
import type { VehicleDetection } from '../../types/dashboard';

interface DetectionRowProps {
  detection: VehicleDetection;
  isNew?: boolean;
}

function VehicleThumbnail({ color, makeModel }: { color: string; makeModel: string }) {
  const initial = makeModel.charAt(0).toUpperCase();
  const bgMap: Record<string, string> = {
    White: 'var(--bg-elevated)', Black: '#2D3748', Silver: '#CBD5E0', Blue: '#BEE3F8',
    Red: '#FED7D7', Grey: '#E2E8F0', Yellow: '#FEFCBF', Green: '#C6F6D5',
  };
  const textMap: Record<string, string> = {
    White: 'var(--text-secondary)', Black: '#FFFFFF', Silver: '#4A5568', Blue: '#2B6CB0',
    Red: '#C53030', Grey: '#4A5568', Yellow: '#744210', Green: '#276749',
  };
  return (
    <div
      style={{
        width: 36,
        height: 28,
        borderRadius: 5,
        backgroundColor: bgMap[color] ?? 'var(--bg-elevated)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '1px solid var(--border-soft)',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: textMap[color] ?? 'var(--text-secondary)' }}>{initial}</span>
    </div>
  );
}

export function DetectionRow({ detection, isNew = false }: DetectionRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 0',
        borderBottom: '1px solid var(--border-soft)',
        animation: isNew ? 'slideIn 0.35s ease-out' : undefined,
        transition: 'background 0.15s',
      }}
    >
      <VehicleThumbnail color={detection.color} makeModel={detection.makeModel} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
            {detection.plate}
          </span>
          {detection.isBlacklisted && (
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                color: 'var(--color-danger)',
                backgroundColor: 'rgba(185, 74, 74, 0.12)',
                border: '1px solid rgba(185, 74, 74, 0.35)',
                borderRadius: 3,
                padding: '1px 4px',
                letterSpacing: '0.05em',
              }}
            >
              WATCH
            </span>
          )}
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {detection.color} {detection.makeModel}
        </p>
      </div>

      <div style={{ textAlign: 'right', minWidth: 0, flexShrink: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', margin: 0 }}>{detection.camera}</p>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0, marginTop: 1, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
          {detection.location}
        </p>
      </div>

      <div style={{ textAlign: 'right', minWidth: 64, flexShrink: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
          {detection.timestamp}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, marginTop: 1 }}>
          {detection.confidence}%
        </p>
      </div>

      {(detection.isBlacklisted || detection.confidence >= 90) && (
        <Link
          to={`/trajectory?plate=${encodeURIComponent(detection.plate)}`}
          title="Track trajectory"
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            padding: '4px 8px',
            borderRadius: 6,
            backgroundColor: 'var(--accent-subtle)',
            border: '1px solid var(--border-default)',
          }}
        >
          <Route size={12} />
          Track
        </Link>
      )}
    </div>
  );
}
