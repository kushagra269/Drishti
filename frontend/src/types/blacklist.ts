// ============================================================
// NETRA — Blacklist / Watchlist & Alerts — TypeScript Types
// ============================================================

export type WatchlistPriority = 'high' | 'medium' | 'low';
export type WatchlistStatus = 'active' | 'monitoring' | 'suspended';

export interface WatchlistDetection {
  id: string;
  timestamp: string;       // ISO or display string
  camera: string;          // e.g. "CAM-04"
  location: string;
  confidence: number;      // 0–100
  thumbnailUrl?: string;
}

export interface WatchlistVehicle {
  id: string;
  plate: string;
  makeModel: string;
  color: string;
  reason: string;
  caseRef: string;
  addedDate: string;       // display string
  addedBy: string;
  priority: WatchlistPriority;
  status: WatchlistStatus;
  lastSeen?: {
    camera: string;
    location: string;
    timestamp: string;
    timeAgo: string;
    confidence: number;
    thumbnailUrl?: string;
  };
  detections: WatchlistDetection[];
  notes?: string;
  photoUrl?: string;
}

// ── Alert types ──────────────────────────────────────────────

export type AlertType =
  | 'watchlist_hit'
  | 'route_anomaly'
  | 'duplicate_plate'
  | 'repeated_circulation';

export type AlertPriority = 'high' | 'medium' | 'low';

export type AlertStatus =
  | 'new'
  | 'acknowledged'
  | 'under_review'
  | 'resolved'
  | 'dismissed';

export interface AlertCameraSequence {
  camera: string;
  location: string;
  timestamp: string;
  confidence?: number;
}

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  plate: string;
  title: string;
  summary: string;          // one-line summary for the feed
  whyFlagged: string;       // human-readable explanation
  createdAt: string;        // ISO string
  createdAtDisplay: string; // formatted for display
  camera?: string;
  location?: string;
  confidence?: number;
  // Watchlist hit
  watchlistVehicleId?: string;
  watchlistReason?: string;
  caseRef?: string;
  makeModel?: string;
  color?: string;
  thumbnailUrl?: string;
  // Route anomaly / repeated circulation
  observedSequence?: AlertCameraSequence[];
  durationMinutes?: number;
  observationCount?: number;
  cycles?: number;
  // Duplicate plate
  observations?: Array<{
    label: string;
    camera: string;
    timestamp: string;
    confidence: number;
  }>;
}
