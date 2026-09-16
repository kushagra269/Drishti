import { Link } from 'react-router-dom';
import type { TrafficCorridor, Severity } from '../../types/dashboard';
import { ArrowRight } from 'lucide-react';

const severityConfig: Record<Severity, { label: string; color: string; barColor: string; speedColor: string }> = {
  severe:   { label: 'Severe',   color: '#DC2626', barColor: '#DC2626', speedColor: '#DC2626' },
  high:     { label: 'High',     color: '#EA580C', barColor: '#EA580C', speedColor: '#EA580C' },
  moderate: { label: 'Moderate', color: '#D97706', barColor: '#F59E0B', speedColor: '#D97706' },
  normal:   { label: 'Normal',   color: '#16A34A', barColor: '#22C55E', speedColor: '#16A34A' },
};

// Max speed for bar calculation
const MAX_SPEED = 60;

interface TrafficSnapshotProps {
  corridors: TrafficCorridor[];
  loading?: boolean;
}

export function TrafficSnapshot({ corridors, loading = false }: TrafficSnapshotProps) {
  return (
    <div
      className="rounded-xl flex flex-col"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E6EAF0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        height: '100%',
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #F0F3F8' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Traffic Now</h2>
        <p style={{ fontSize: 12.5, color: '#98A2B3', margin: '2px 0 0' }}>Current city congestion</p>
      </div>

      {/* Corridors */}
      <div className="flex-1 px-5 py-3">
        {loading ? (
          <div className="space-y-5 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="rounded mb-2" style={{ width: '60%', height: 13, backgroundColor: '#F0F3F8', animation: 'pulse 1.5s infinite' }} />
                <div className="rounded" style={{ width: '100%', height: 4, backgroundColor: '#F0F3F8', animation: 'pulse 1.5s infinite' }} />
              </div>
            ))}
          </div>
        ) : corridors.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p style={{ fontSize: 13, color: '#98A2B3' }}>Traffic data temporarily unavailable.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {corridors.slice(0, 4).map((corridor) => {
              const cfg = severityConfig[corridor.severity];
              const barWidth = Math.min(100, (corridor.speed / MAX_SPEED) * 100);

              return (
                <div key={corridor.id} className="py-0.5">
                  {/* Name + severity badge */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{corridor.name}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: cfg.color,
                        backgroundColor: `${cfg.color}12`,
                        padding: '1px 7px',
                        borderRadius: 999,
                        border: `1px solid ${cfg.color}30`,
                      }}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 3, backgroundColor: '#F0F3F8', borderRadius: 2, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${barWidth}%`,
                        backgroundColor: cfg.barColor,
                        borderRadius: 2,
                        transition: 'width 0.6s ease-out',
                      }}
                    />
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between mt-1.5">
                    <span style={{ fontSize: 12, color: cfg.speedColor, fontWeight: 500 }}>
                      {corridor.speed} km/h
                    </span>
                    <span style={{ fontSize: 11.5, color: '#98A2B3' }}>
                      {corridor.vehiclesPerHour.toLocaleString()} veh/hr
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer link */}
      <div className="px-5 pb-5 pt-3" style={{ borderTop: '1px solid #F0F3F8', marginTop: 'auto' }}>
        <Link
          to="/analytics"
          className="flex items-center gap-1 transition-colors"
          style={{ fontSize: 13, color: '#2457D6', fontWeight: 500, textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#3B6FE8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#2457D6')}
        >
          View Traffic Analytics
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
