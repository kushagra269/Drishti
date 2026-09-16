import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import type { PriorityAlert } from '../../types/dashboard';
import { AlertRow } from './AlertRow';

interface PriorityAlertsProps {
  alerts: PriorityAlert[];
  loading?: boolean;
}

export function PriorityAlerts({ alerts, loading = false }: PriorityAlertsProps) {
  return (
    <div
      className="rounded-xl flex flex-col"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E6EAF0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pt-5 pb-4"
        style={{ borderBottom: '1px solid #F0F3F8' }}
      >
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Priority Alerts</h2>
          <p style={{ fontSize: 12.5, color: '#98A2B3', margin: '2px 0 0' }}>Active incidents requiring attention</p>
        </div>
        {alerts.length > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#DC2626',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 999,
              padding: '2px 8px',
            }}
          >
            {alerts.filter((a) => a.severity === 'high').length} high
          </span>
        )}
      </div>

      {/* Alert list */}
      <div className="flex-1 px-5">
        {loading ? (
          <div className="space-y-3 pt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ paddingBottom: 12, borderBottom: '1px solid #F5F7FA' }}>
                <div style={{ width: '50%', height: 13, backgroundColor: '#F0F3F8', borderRadius: 3, marginBottom: 6, animation: 'pulse 1.5s infinite' }} />
                <div style={{ width: '80%', height: 11, backgroundColor: '#F0F3F8', borderRadius: 3, animation: 'pulse 1.5s infinite' }} />
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-2 py-6"
          >
            <CheckCircle size={20} color="#16A34A" strokeWidth={1.5} />
            <p style={{ fontSize: 13, color: '#667085', margin: 0 }}>No priority alerts at this time</p>
          </div>
        ) : (
          <div>
            {alerts.slice(0, 3).map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 pt-3" style={{ borderTop: alerts.length > 0 ? '1px solid #F0F3F8' : 'none', marginTop: 4 }}>
        <Link
          to="/alerts"
          className="flex items-center gap-1 transition-colors"
          style={{ fontSize: 13, color: '#2457D6', fontWeight: 500, textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#3B6FE8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#2457D6')}
        >
          View All Alerts
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
