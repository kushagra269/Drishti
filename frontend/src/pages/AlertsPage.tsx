// ============================================================
// NETRA — Alerts Page (Master-Detail Redesign)
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, X, Camera, AlertTriangle, Layers, RotateCw, Copy, ChevronRight, Clock, ArrowRight
} from 'lucide-react';
import { useNetraStore } from '../store/netraStore';
import { getAlerts, updateAlertStatus, getAlertStats } from '../services/alertService';
import type { Alert, AlertType, AlertPriority, AlertStatus } from '../types/blacklist';

// ── Label helpers ─────────────────────────────────────────────

const TYPE_LABELS: Record<AlertType, string> = {
  watchlist_hit: 'Watchlist Hit',
  route_anomaly: 'Route Anomaly',
  duplicate_plate: 'Potential Duplicate Plate',
  repeated_circulation: 'Repeated Circulation',
};

const PRIORITY_COLOR: Record<AlertPriority, string> = {
  high: 'var(--color-danger)',
  medium: 'var(--color-warning)',
  low: 'var(--text-secondary)',
};

const STATUS_LABEL: Record<AlertStatus, string> = {
  new: 'New',
  acknowledged: 'Acknowledged',
  under_review: 'Under Review',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const STATUS_COLOR: Record<AlertStatus, string> = {
  new: 'var(--accent-primary)',
  acknowledged: 'var(--color-warning)',
  under_review: 'var(--text-secondary)',
  resolved: 'var(--color-success)',
  dismissed: 'var(--text-muted)',
};

// ── Skeleton row ──────────────────────────────────────────────
function SkeletonAlertRow() {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)' }}>
      <div style={{ width: 40, height: 11, borderRadius: 3, backgroundColor: 'var(--border-default)', marginBottom: 8 }} />
      <div style={{ width: 120, height: 14, borderRadius: 4, backgroundColor: 'var(--border-default)', marginBottom: 6 }} />
      <div style={{ width: 180, height: 11, borderRadius: 3, backgroundColor: 'var(--border-default)' }} />
    </div>
  );
}

// ── Camera Sequence Diagram ───────────────────────────────────
function SequenceDiagram({ sequence }: { sequence: { camera: string; location: string; timestamp: string; confidence?: number }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {sequence.map((step, i) => (
        <div key={i}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px',
            backgroundColor: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-surface)',
            borderRadius: 6, border: '1px solid var(--border-soft)',
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Camera size={13} color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{step.camera}</span>
              <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '1px 0 0' }}>{step.location}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{step.timestamp}</p>
              {step.confidence && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0' }}>{step.confidence}% OCR</p>}
            </div>
          </div>
          {i < sequence.length - 1 && (
            <div style={{ display: 'flex', alignItems: 'center', padding: '2px 0 2px 24px' }}>
              <ChevronRight size={12} color="var(--border-default)" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Inspector Pane ────────────────────────────────────────────
interface AlertInspectorProps {
  alert: Alert | null;
  onClose: () => void;
}

function AlertInspector({ alert, onClose }: AlertInspectorProps) {

  const navigate = useNavigate();

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0,
      width: 'clamp(440px, 35vw, 560px)',
      backgroundColor: 'var(--drawer-bg)',
      boxShadow: 'var(--drawer-shadow)',
      borderLeft: '1px solid var(--border-default)',
      display: 'flex', flexDirection: 'column',
      transform: alert ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1)',
      zIndex: 10,
    }}>
      {alert && (
        <>
          {/* HEADER (Sticky) */}
          <div style={{
            padding: '24px 32px 20px',
            borderBottom: '1px solid var(--border-soft)',
            backgroundColor: 'var(--drawer-bg)',
            position: 'sticky', top: 0, zIndex: 11,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLOR[alert.priority], letterSpacing: '0.06em', margin: '0 0 12px', textTransform: 'uppercase' }}>
                  {alert.priority} PRIORITY &middot; {TYPE_LABELS[alert.type]}
                </div>
                <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'ui-monospace, SFMono-Regular, Geist Mono, monospace', margin: '0 0 4px', letterSpacing: '0.02em' }}>
                  {alert.plate}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, margin: '-8px -8px 0 0', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* SCROLLABLE BODY */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>

        {/* DETAILS for Watchlist Hit */}
        {(alert.type === 'watchlist_hit') && (
          <>
            <div>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                Location
              </p>
              <p style={{ fontSize: 17.5, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                {alert.camera}
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0' }}>
                {alert.location}
              </p>
            </div>

            <div style={{ height: 1, backgroundColor: 'var(--border-soft)', margin: '32px 0' }} />

            <div>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                Time
              </p>
              <p style={{ fontSize: 16.5, color: 'var(--text-primary)', margin: '0' }}>
                {alert.createdAtDisplay}
              </p>
            </div>

            <div style={{ height: 1, backgroundColor: 'var(--border-soft)', margin: '32px 0' }} />

            <div>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                Detail
              </p>
              <p style={{ fontSize: 16.5, color: 'var(--text-primary)', margin: '0' }}>
                {alert.whyFlagged}
              </p>
            </div>
          </>
        )}

        {/* DETAILS for Route Anomaly & Repeated Circulation */}
        {(alert.type === 'route_anomaly' || alert.type === 'repeated_circulation') && (
          <>
            <div>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                Detail
              </p>
              <p style={{ fontSize: 16.5, color: 'var(--text-primary)', margin: '0' }}>
                {alert.whyFlagged}
              </p>
            </div>

            <div style={{ height: 1, backgroundColor: 'var(--border-soft)', margin: '32px 0' }} />

            {alert.observedSequence && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                    Observations
                  </p>
                  {alert.durationMinutes && (
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {alert.durationMinutes} min {alert.observationCount ? `· ${alert.observationCount} observations` : ''}
                    </span>
                  )}
                </div>
                <SequenceDiagram sequence={alert.observedSequence} />
              </div>
            )}
          </>
        )}

        {/* DETAILS for Duplicate Plate */}
        {alert.type === 'duplicate_plate' && alert.observations && (
          <>
             <div>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                Detail
              </p>
              <p style={{ fontSize: 16.5, color: 'var(--text-primary)', margin: '0' }}>
                {alert.whyFlagged}
              </p>
            </div>

            <div style={{ height: 1, backgroundColor: 'var(--border-soft)', margin: '32px 0' }} />
            
            <div>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                Observations
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {alert.observations.map((obs) => (
                  <div key={obs.label} style={{ padding: '16px', borderRadius: 8, border: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-surface)' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{obs.label}</p>
                    <p style={{ fontSize: 14.5, fontWeight: 650, color: 'var(--text-primary)', margin: 0 }}>{obs.camera}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{obs.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
          </div>
          
          {/* Footer Action */}
          <div style={{
            padding: '20px 32px', borderTop: '1px solid var(--border-soft)',
            backgroundColor: 'var(--drawer-bg)', position: 'sticky', bottom: 0, zIndex: 11
          }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => navigate(`/cameras?cam=${alert.camera || (alert.observedSequence ? alert.observedSequence[0].camera : '')}`)}
                style={{
                  flex: 1, height: 44, borderRadius: 8, border: 'none',
                  backgroundColor: 'var(--accent-primary)', color: '#FFFFFF',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background-color 0.2s',
                  boxShadow: '0 2px 8px rgba(36, 87, 214, 0.25)'
                }}
              >
                View Camera <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate(`/trajectory?plate=${alert.plate}`)}
                style={{
                  flex: 1, height: 44, borderRadius: 8, border: '1px solid var(--border-strong)',
                  backgroundColor: 'transparent', color: 'var(--text-primary)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background-color 0.2s'
                }}
              >
                Track Trajectory
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── List Row ──────────────────────────────────────────────────
interface AlertRowProps {
  alert: Alert;
  isSelected: boolean;
  onClick: () => void;
}

function AlertListRow({ alert, isSelected, onClick }: AlertRowProps) {
  const [hovered, setHovered] = useState(false);
  const borderColor = PRIORITY_COLOR[alert.priority];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-soft)',
        cursor: 'pointer',
        backgroundColor: isSelected ? 'var(--bg-selected)' : hovered ? 'var(--bg-row-hover)' : 'transparent',
        borderLeft: isSelected ? `2px solid ${borderColor}` : '2px solid transparent',
        transition: 'background-color 150ms, border-color 150ms',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: borderColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {alert.priority}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {alert.createdAtDisplay}
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'ui-monospace, SFMono-Regular, Geist Mono, monospace', letterSpacing: '0.03em' }}>
          {alert.plate}
        </span>
      </div>
      
      <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2, fontWeight: 500 }}>
        {TYPE_LABELS[alert.type]}
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
        {alert.camera ? `${alert.camera} · ${alert.location}` : alert.summary}
      </div>
    </div>
  );
}

// ── Main AlertsPage ───────────────────────────────────────────
export function AlertsPage() {
  const { alerts, setAlerts, newAlertId, clearNewAlertId } = useNetraStore();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchParams] = useSearchParams();
  const urlAlertId = searchParams.get('alertId');
  const [selectedId, setSelectedId] = useState<string | null>(urlAlertId || null);
  useEffect(() => {
    if (urlAlertId) setSelectedId(urlAlertId);
  }, [urlAlertId]);
  const [newIndicator, setNewIndicator] = useState(false);
  const [visible, setVisible] = useState(false);
  const stats = getAlertStats();

  useEffect(() => {
    setLoading(true);
    getAlerts().then((a) => {
      setAlerts(a);
      setLoading(false);
      setTimeout(() => setVisible(true), 30);
    });
  }, []);

  useEffect(() => {
    if (newAlertId) {
      setNewIndicator(true);
      const t = setTimeout(() => {
        setNewIndicator(false);
        clearNewAlertId();
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [newAlertId]);

  const filtered = alerts.filter((a) => {
    const q = query.toLowerCase();
    return !q || a.plate.toLowerCase().includes(q) || a.camera?.toLowerCase().includes(q) || a.title.toLowerCase().includes(q);
  });

  const selected = selectedId ? alerts.find((a) => a.id === selectedId) ?? null : null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', height: '100%', backgroundColor: 'var(--bg-canvas)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, maxWidth: 1200, position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-surface)' }}>
      {/* ── Page Header ─────────────────────────────── */}
      <div style={{
        paddingTop: 14, paddingBottom: 12, paddingLeft: 24, paddingRight: 24, flexShrink: 0,
        opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(-4px)',
        transition: 'opacity 150ms ease, transform 150ms ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 650, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Alerts
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 400 }}>
              Live ANPR intelligence requiring review
            </p>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, gap: 0 }}>
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                <strong style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{stats.active}</strong>
                <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>Active</span>
              </span>
              <span style={{ margin: '0 16px', width: 1, height: 14, backgroundColor: 'var(--border-default)', display: 'inline-block', verticalAlign: 'middle' }} />
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                <strong style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--color-danger)' }}>{stats.high}</strong>
                <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>High Priority</span>
              </span>
              <span style={{ margin: '0 16px', width: 1, height: 14, backgroundColor: 'var(--border-default)', display: 'inline-block', verticalAlign: 'middle' }} />
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                <strong style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{stats.resolvedToday}</strong>
                <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>Resolved Today</span>
              </span>
            </div>
          </div>
        </div>

        {/* Search Field */}
        <div style={{ position: 'relative', width: 400, marginTop: 12 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search plate or camera..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%', height: 38, paddingLeft: 36, paddingRight: query ? 34 : 12,
              fontSize: 13, border: '1px solid var(--border-default)', borderRadius: 8,
              backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 150ms',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <X size={14} color="var(--text-muted)" />
            </button>
          )}
        </div>
      </div>

      {/* ── Workspace ────────────────────────────────────── */}
      <div style={{
        flex: 1, minHeight: 0,
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-surface)',
        opacity: visible ? 1 : 0, transition: 'opacity 150ms ease',
      }}>
        {/* LEFT: Intelligence Queue (100%) */}
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 44, padding: '0 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-table-header)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Intelligence Queue</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              [...Array(6)].map((_, i) => <SkeletonAlertRow key={i} />)
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <AlertTriangle size={24} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                  {query ? 'No alerts match this search.' : 'No alerts in the queue.'}
                </p>
              </div>
            ) : (
              filtered.map((a) => (
                <AlertListRow
                  key={a.id}
                  alert={a}
                  isSelected={a.id === selectedId}
                  onClick={() => setSelectedId(a.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* OVERLAY: Inspector Drawer */}
        <AlertInspector alert={selected} onClose={() => setSelectedId(null)} />
      </div>
      </div>
    </div>
  );
}

