// ============================================================
// NETRA — Blacklisted Vehicles Page (Master-Detail Redesign)
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Plus, X, ChevronRight, ArrowRight,
  Camera, Pencil, ShieldOff, Trash2, AlertTriangle,
} from 'lucide-react';
import { useNetraStore } from '../store/netraStore';
import {
  getWatchlist,
  addWatchlistVehicle,
  removeWatchlistVehicle,
  updateWatchlistVehicle,
} from '../services/blacklistService';
import type { WatchlistVehicle, WatchlistPriority, WatchlistStatus } from '../types/blacklist';

// ── Design tokens ─────────────────────────────────────────────

const PRIORITY_COLOR: Record<WatchlistPriority, string> = {
  high: 'var(--color-danger)',
  medium: 'var(--color-warning)',
  low: 'var(--text-secondary)',
};

const STATUS_LABEL: Record<WatchlistStatus, string> = {
  active: 'Active',
  monitoring: 'Monitoring',
  suspended: 'Suspended',
};

const STATUS_COLOR: Record<WatchlistStatus, string> = {
  active: 'var(--color-success)',
  monitoring: 'var(--accent-primary)',
  suspended: 'var(--text-muted)',
};

function PrioritySelector({ value, onChange }: { value: WatchlistPriority; onChange: (v: WatchlistPriority) => void }) {
  const options: WatchlistPriority[] = ['high', 'medium', 'low'];
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map((p) => (
        <PrioritySegment key={p} option={p} isSelected={value === p} onClick={() => onChange(p)} />
      ))}
    </div>
  );
}

function PrioritySegment({ option, isSelected, onClick }: { option: WatchlistPriority; isSelected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  const bgColor = isSelected ? `var(--priority-${option}-bg)` : hovered ? 'var(--priority-bg-hover)' : 'var(--priority-bg-resting)';
  const textColor = isSelected ? `var(--priority-${option}-text)` : hovered ? 'var(--priority-text-hover)' : 'var(--priority-text-unselected)';
  const borderColor = isSelected ? 'transparent' : 'var(--priority-border)';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1, height: 44, borderRadius: 10,
        backgroundColor: bgColor, border: `1px solid ${borderColor}`, color: textColor,
        fontSize: 14, fontWeight: 600, cursor: 'pointer',
        transition: 'background-color 150ms, color 150ms, border-color 150ms', textTransform: 'capitalize',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {option}
    </button>
  );
}

function PriorityText({ priority }: { priority: WatchlistPriority }) {
  const labels: Record<WatchlistPriority, string> = { high: 'High', medium: 'Medium', low: 'Low' };
  const colors: Record<WatchlistPriority, string> = {
    high: 'var(--color-danger)',
    medium: 'var(--color-warning)',
    low: 'var(--text-secondary)',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: colors[priority] }}>{labels[priority]}</span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 80, padding: '0 20px', borderBottom: '1px solid var(--border-soft)' }}>
      <div style={{ width: 120, height: 14, borderRadius: 4, backgroundColor: 'var(--border-default)', marginRight: 40 }} />
      <div style={{ width: 160, height: 14, borderRadius: 4, backgroundColor: 'var(--border-default)', marginRight: 40 }} />
      <div style={{ width: 100, height: 14, borderRadius: 4, backgroundColor: 'var(--border-default)' }} />
    </div>
  );
}

// ── Add Vehicle Modal ─────────────────────────────────────────
interface AddVehicleModalProps {
  onClose: () => void;
  onAdd: (vehicle: WatchlistVehicle) => void;
}

function AddVehicleModal({ onClose, onAdd }: AddVehicleModalProps) {
  const [plate, setPlate] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<WatchlistPriority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [plateError, setPlateError] = useState('');

  const handleSubmit = async () => {
    if (!plate.trim()) { setPlateError('License plate is required'); return; }
    setSubmitting(true);
    try {
      const v = await addWatchlistVehicle({ plate, reason, priority });
      onAdd(v);
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase: React.CSSProperties = {
    width: '100%', height: 40, padding: '0 12px',
    fontSize: 13.5, border: '1px solid var(--border-default)', borderRadius: 8,
    outline: 'none', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)',
    transition: 'border-color 150ms',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const labelBase: React.CSSProperties = {
    display: 'block', fontSize: 11.5, fontWeight: 500,
    color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.02em',
    textTransform: 'uppercase',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--backdrop-modal)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: 400, backgroundColor: 'var(--bg-elevated)',
          borderRadius: 12, border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-md)',
          animation: 'fadeIn 0.16s ease-out',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px 16px', borderBottom: '1px solid var(--border-soft)',
        }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              Add to Watchlist
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '3px 0 0' }}>
              Register vehicle for DRISHTI network monitoring
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' }}>
            <X size={16} color="var(--text-muted)" />
          </button>
        </div>

        <div style={{ padding: '20px 22px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelBase}>License Plate <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input
              style={{
                ...inputBase,
                borderColor: plateError ? 'var(--color-danger)' : 'var(--border-default)',
                fontWeight: 650, letterSpacing: '0.06em', textTransform: 'uppercase',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}
              placeholder="GJ 01 AB 1234"
              value={plate}
              onChange={(e) => { setPlate(e.target.value); setPlateError(''); }}
            />
            {plateError && <p style={{ fontSize: 11.5, color: 'var(--color-danger)', marginTop: 4 }}>{plateError}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelBase}>Priority</label>
            <PrioritySelector value={priority} onChange={setPriority} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelBase}>
              Watchlist Reason
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, textTransform: 'none', fontSize: 11 }}>— optional</span>
            </label>
            <input
              style={inputBase}
              placeholder="e.g. Theft Investigation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '12px 22px 16px', borderTop: '1px solid var(--border-soft)',
          backgroundColor: 'var(--bg-secondary)',
        }}>
          <button onClick={onClose}
            style={{
               height: 36, padding: '0 16px', borderRadius: 7,
               border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)',
               fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer',
            }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            style={{
               height: 36, padding: '0 20px', borderRadius: 7,
               border: 'none',
               backgroundColor: submitting ? 'var(--accent-hover)' : 'var(--accent-primary)',
               fontSize: 13, fontWeight: 600, color: '#FFFFFF',
               cursor: submitting ? 'default' : 'pointer',
               transition: 'background-color 150ms',
            }}>
            {submitting ? 'Adding…' : 'Add to Watchlist'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inspector Pane ────────────────────────────────────────────
interface VehicleInspectorProps {
  vehicle: WatchlistVehicle | null;
  onClose: () => void;
}

function VehicleInspector({ vehicle, onClose }: VehicleInspectorProps) {
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'fixed', top: 64, right: 0, bottom: 0,
      width: 'min(420px, 92vw)',
      backgroundColor: 'var(--drawer-bg)',
      boxShadow: 'var(--drawer-shadow)',
      borderLeft: '1px solid var(--border-default)',
      display: 'flex', flexDirection: 'column',
      transform: vehicle ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1)',
      zIndex: 40,
    }}>
      {vehicle && (
        <>
          {/* HEADER */}
          <div style={{
            padding: '24px 26px 20px',
            borderBottom: '1px solid var(--border-soft)',
            backgroundColor: 'var(--drawer-bg)',
            position: 'sticky', top: 0, zIndex: 11,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', margin: '0 0 8px' }}>
                  ACTIVE &middot; WATCHLISTED
                </div>
                <div style={{ fontSize: 22, fontWeight: 650, color: 'var(--text-primary)', fontFamily: 'ui-monospace, SFMono-Regular, Geist Mono, monospace', margin: '0 0 5px', letterSpacing: '0.02em' }}>
                  {vehicle.plate}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {vehicle.color} {vehicle.makeModel}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '-8px -8px 0 0', color: 'var(--text-muted)', borderRadius: 8 }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-row-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* SCROLLABLE BODY */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 26px' }}>
            {/* EVIDENCE IMAGE */}
            <div style={{ marginBottom: 22, position: 'relative' }}>
              {vehicle.photoUrl ? (
                <div style={{ width: '100%', maxHeight: 160, aspectRatio: '16/9', borderRadius: 9, overflow: 'hidden', border: '1px solid var(--photo-border)', position: 'relative' }}>
                  <img src={vehicle.photoUrl} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {vehicle.lastSeen && (
                    <div style={{ position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(30, 41, 59, 0.85)', color: '#FFFFFF', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, backdropFilter: 'blur(4px)' }}>
                      {vehicle.lastSeen.camera} &middot; {vehicle.lastSeen.confidence || 96}% OCR
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ width: '100%', maxHeight: 160, aspectRatio: '16/9', borderRadius: 9, backgroundColor: 'var(--photo-bg)', border: '1px solid var(--photo-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative' }}>
                  <Camera size={20} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Last detection snapshot</p>
                  {vehicle.lastSeen && (
                    <div style={{ position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(30, 41, 59, 0.85)', color: '#FFFFFF', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, backdropFilter: 'blur(4px)' }}>
                      {vehicle.lastSeen.camera} &middot; {vehicle.lastSeen.confidence || 96}% OCR
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ height: 1, backgroundColor: 'var(--border-soft)', margin: '0 0 20px' }} />

            {/* WATCHLIST REASON & PRIORITY */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 10px' }}>
                    Watchlist Reason
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 550, color: 'var(--text-primary)', margin: 0 }}>
                    {vehicle.reason || '—'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 10px' }}>
                    Added
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 550, color: 'var(--text-primary)', margin: 0 }}>
                    30 Aug 2026
                  </p>
                </div>
              </div>
              
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 10px' }}>
                  Priority
                </p>
                <div style={{ fontSize: 14, fontWeight: 550, color: PRIORITY_COLOR[vehicle.priority] }}>
                  <span style={{ textTransform: 'capitalize' }}>{vehicle.priority}</span>
                </div>
              </div>
            </div>

            <div style={{ height: 1, backgroundColor: 'var(--border-soft)', margin: '0 0 20px' }} />

            {/* LAST OBSERVATION */}
            <div style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                Last Observation
              </p>
              {vehicle.lastSeen ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'var(--bg-selected)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Camera size={16} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {vehicle.lastSeen.camera}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                      {vehicle.lastSeen.location}
                    </p>
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>
                      02 Sep 2026, 08:42 PM
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)', margin: 0 }}>
                      OCR Confidence {vehicle.lastSeen.confidence || 96}%
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>&mdash;</p>
              )}
            </div>
            
            <div style={{ height: 1, backgroundColor: 'var(--border-soft)', margin: '0 0 20px' }} />

            {/* DETECTION HISTORY */}
            {vehicle.detections && vehicle.detections.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                  Detection History ({vehicle.detections.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {vehicle.detections.map((d, i) => (
                    <div key={d.id} style={{ display: 'flex', position: 'relative', marginBottom: i === vehicle.detections.length - 1 ? 0 : 20 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 14 }}>
                        <div style={{ width: i === 0 ? 6 : 5, height: i === 0 ? 6 : 5, borderRadius: '50%', backgroundColor: i === 0 ? 'var(--accent-primary)' : 'var(--text-muted)', zIndex: 2, marginTop: 4 }} />
                        {i !== vehicle.detections.length - 1 && (
                          <div style={{ width: 1, flex: 1, backgroundColor: 'var(--border-soft)', marginTop: 4, marginBottom: -20 }} />
                        )}
                      </div>
                      <div style={{ flex: 1, paddingBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '0 0 2px' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{d.camera}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}>{d.timestamp}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 2px' }}>{d.location}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.confidence}% OCR</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div style={{
            padding: '16px 26px',
            borderTop: '1px solid var(--border-soft)',
            backgroundColor: 'var(--drawer-bg)',
            position: 'sticky', bottom: 0, zIndex: 11,
          }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => navigate(`/cameras?cam=${vehicle.lastSeen?.camera}`)}
                disabled={!vehicle.lastSeen}
                style={{
                  flex: 1, height: 46, borderRadius: 8, border: 'none',
                  backgroundColor: vehicle.lastSeen ? 'var(--accent-primary)' : 'var(--bg-subtle)', 
                  color: vehicle.lastSeen ? '#FFFFFF' : 'var(--text-muted)',
                  fontSize: 14, fontWeight: 600, cursor: vehicle.lastSeen ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'background-color 0.2s',
                }}
              >
                View Camera <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate(`/trajectory?plate=${vehicle.plate}`)}
                style={{
                  flex: 1, height: 46, borderRadius: 8, border: '1px solid var(--border-strong)',
                  backgroundColor: 'transparent', color: 'var(--text-primary)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                Track Trajectory
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button style={{ flex: 1, height: 40, borderRadius: 7, border: '1px solid var(--border-default)', backgroundColor: 'transparent', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Edit</button>
              <button style={{ flex: 1, height: 40, borderRadius: 7, border: '1px solid var(--border-default)', backgroundColor: 'transparent', color: 'var(--color-warning)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Disable</button>
              <button style={{ width: 40, height: 40, borderRadius: 7, border: '1px solid var(--border-default)', backgroundColor: 'transparent', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── List Row ──────────────────────────────────────────────────
interface ListRowProps {
  v: WatchlistVehicle;
  isSelected: boolean;
  onClick: () => void;
}

function VehicleListRow({ v, isSelected, onClick }: ListRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', height: 68, padding: '0 16px',
        borderBottom: '1px solid var(--border-soft)', cursor: 'pointer',
        backgroundColor: isSelected ? 'var(--bg-selected)' : hovered ? 'var(--bg-row-hover)' : 'transparent',
        borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
        transition: 'background-color 160ms, border-color 160ms',
      }}
    >
      <div style={{ flex: 1.2, minWidth: 0, paddingRight: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'ui-monospace, SFMono-Regular, Geist Mono, monospace', letterSpacing: '0.04em', transition: 'color 120ms' }}>
          {v.plate}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {v.color} {v.makeModel}
        </div>
      </div>
      <div style={{ flex: 1.5, minWidth: 0, paddingRight: 16 }}>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {v.reason || <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
        {v.lastSeen ? (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
              {v.lastSeen.camera}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {v.lastSeen.timeAgo}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</div>
        )}
      </div>
      <div style={{ flex: 0.8, minWidth: 0 }}>
        <PriorityText priority={v.priority} />
      </div>
      <div style={{ width: 24, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
        <ChevronRight
          size={16}
          color={isSelected ? 'var(--accent-primary)' : hovered ? 'var(--text-secondary)' : 'var(--text-muted)'}
          style={{
            transform: hovered && !isSelected ? 'translateX(2px)' : 'translateX(0)',
            transition: 'transform 160ms, color 160ms',
          }}
        />
      </div>
    </div>
  );
}

// ── Main BlacklistPage ────────────────────────────────────────
export function BlacklistPage() {
  const { watchlist, setWatchlist, addToWatchlist } = useNetraStore();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchParams] = useSearchParams();
  const urlId = searchParams.get('id');
  const [selectedId, setSelectedId] = useState<string | null>(urlId || null);
  useEffect(() => {
    if (urlId) setSelectedId(urlId);
  }, [urlId]);
  const [showModal, setShowModal] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setLoading(true);
    getWatchlist().then((v) => {
      setWatchlist(v);
      setLoading(false);
      setTimeout(() => setVisible(true), 30);
    });
  }, []);

  const filtered = watchlist.filter((v) => {
    const q = query.toLowerCase();
    return !q || v.plate.toLowerCase().includes(q) || v.reason.toLowerCase().includes(q) || v.makeModel.toLowerCase().includes(q);
  });

  const selected = selectedId ? watchlist.find((v) => v.id === selectedId) ?? null : null;

  const activeCount = watchlist.filter((v) => v.status === 'active').length;
  const detectedToday = watchlist.filter((v) => v.lastSeen?.timeAgo.includes('min') || v.lastSeen?.timeAgo.includes('hr')).length;
  const monitoringCount = watchlist.filter((v) => v.status === 'monitoring').length;

  const handleAdd = (vehicle: WatchlistVehicle) => { addToWatchlist(vehicle); setShowModal(false); };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', width: '100%', height: '100%',
      position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-canvas, #F5F7FA)',
    }}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
        maxWidth: selected ? 1100 : 960,
        margin: '0 auto',
        width: '100%',
        padding: '0 20px',
        paddingRight: selected ? 'clamp(20px, 2vw, 28px)' : 20,
        transition: 'max-width 250ms ease',
        backgroundColor: 'var(--bg-surface, #FFFFFF)',
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
      }}>
      {/* ── Page Header ──────────────────────────────────── */}
      <div style={{
        paddingTop: 14, paddingBottom: 12, flexShrink: 0,
        opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(-4px)',
        transition: 'opacity 150ms ease, transform 150ms ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 650, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Blacklisted Vehicles
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 400 }}>
              Vehicles currently monitored across the DRISHTI camera network
            </p>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, gap: 0, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                <strong style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{activeCount}</strong>
                <span style={{ color: 'var(--text-secondary)', marginLeft: 5 }}>Active</span>
              </span>
              <span style={{ margin: '0 12px', width: 1, height: 12, backgroundColor: 'var(--border-default)', display: 'inline-block' }} />
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                <strong style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{detectedToday}</strong>
                <span style={{ color: 'var(--text-secondary)', marginLeft: 5 }}>Detected Today</span>
              </span>
              <span style={{ margin: '0 12px', width: 1, height: 12, backgroundColor: 'var(--border-default)', display: 'inline-block' }} />
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                <strong style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{monitoringCount}</strong>
                <span style={{ color: 'var(--text-secondary)', marginLeft: 5 }}>Monitoring</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 8, border: 'none',
              backgroundColor: 'var(--accent-primary)', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'background-color 160ms', flexShrink: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-primary)'; }}
          >
            <Plus size={15} /> Add Vehicle
          </button>
        </div>
        
        {/* Search Field */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 420, marginTop: 12 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search plate, reason or vehicle..."
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
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
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
        borderRadius: '10px 10px 0 0',
        backgroundColor: 'var(--bg-surface)',
        opacity: visible ? 1 : 0, transition: 'opacity 150ms ease',
      }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 40, padding: '0 16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-table-header)', flexShrink: 0 }}>
            <div style={{ flex: 1.2, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Plate</div>
            <div style={{ flex: 1.4, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Reason</div>
            <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Last seen</div>
            <div style={{ flex: 0.7, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Priority</div>
            <div style={{ width: 24, flexShrink: 0 }}></div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <AlertTriangle size={24} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                  {query ? 'No vehicles match this search.' : 'No watchlist entries yet.'}
                </p>
              </div>
            ) : (
              filtered.map((v) => (
                <VehicleListRow
                  key={v.id}
                  v={v}
                  isSelected={v.id === selectedId}
                  onClick={() => setSelectedId(v.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
      </div>

      {/* OVERLAY: Inspector Drawer */}
      <VehicleInspector vehicle={selected} onClose={() => setSelectedId(null)} />

      {showModal && <AddVehicleModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
}
