import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { VehicleDetection } from '../../types/dashboard';
import { getNextLiveDetection } from '../../services/dashboardService';
import { DetectionRow } from './DetectionRow';

const MAX_DETECTIONS = 5;
const STREAM_INTERVAL_MS = 6000; // new detection every 6 seconds

interface LiveDetectionStreamProps {
  initialDetections: VehicleDetection[];
  loading?: boolean;
}

export function LiveDetectionStream({ initialDetections, loading = false }: LiveDetectionStreamProps) {
  const [detections, setDetections] = useState<VehicleDetection[]>([]);
  const [newId, setNewId] = useState<string | null>(null);
  const initialized = useRef(false);

  // Seed with initial data
  useEffect(() => {
    if (!initialized.current && initialDetections.length > 0) {
      setDetections(initialDetections.slice(0, MAX_DETECTIONS));
      initialized.current = true;
    }
  }, [initialDetections]);

  // Stream new detections periodically
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      const next = getNextLiveDetection();
      setNewId(next.id);
      setDetections((prev) => [next, ...prev].slice(0, MAX_DETECTIONS));
      // Clear new indicator after animation
      setTimeout(() => setNewId(null), 500);
    }, STREAM_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loading]);

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
      <div
        className="flex items-center justify-between px-5 pt-5 pb-4"
        style={{ borderBottom: '1px solid #F0F3F8' }}
      >
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>
            Live ANPR Detections
          </h2>
          <p style={{ fontSize: 12.5, color: '#98A2B3', margin: '2px 0 0' }}>
            Most recent plate recognitions
          </p>
        </div>
        <Link
          to="/search"
          className="flex items-center gap-1 transition-colors"
          style={{ fontSize: 12.5, color: '#2457D6', fontWeight: 500, textDecoration: 'none', flexShrink: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#3B6FE8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#2457D6')}
        >
          View All
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Detections */}
      <div className="flex-1 px-5 overflow-hidden">
        {loading ? (
          <div className="space-y-3 pt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid #F5F7FA' }}>
                <div style={{ width: 36, height: 28, borderRadius: 5, backgroundColor: '#F0F3F8', animation: 'pulse 1.5s infinite' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '55%', height: 13, backgroundColor: '#F0F3F8', borderRadius: 3, marginBottom: 6, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: '35%', height: 11, backgroundColor: '#F0F3F8', borderRadius: 3, animation: 'pulse 1.5s infinite' }} />
                </div>
                <div style={{ width: 60, height: 13, backgroundColor: '#F0F3F8', borderRadius: 3, animation: 'pulse 1.5s infinite' }} />
              </div>
            ))}
          </div>
        ) : detections.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p style={{ fontSize: 13, color: '#98A2B3' }}>No recent vehicle detections.</p>
          </div>
        ) : (
          <div>
            {detections.map((d) => (
              <DetectionRow key={d.id} detection={d} isNew={d.id === newId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
