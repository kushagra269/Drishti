// ============================================================
// NETRA — Alerts Service Layer
// Replace mock implementations with FastAPI calls later.
// ============================================================

import type { Alert, AlertStatus, AlertPriority, AlertType } from '../types/blacklist';

// ── In-memory alert store ─────────────────────────────────────
let _alerts: Alert[] = [
  {
    id: 'a-001',
    type: 'watchlist_hit',
    priority: 'high',
    status: 'new',
    plate: 'GJ01AB1234',
    title: 'Watchlist vehicle detected',
    summary: 'CAM-173 · Randesan · 09:43 PM',
    whyFlagged:
      'GJ01AB1234 is on the active watchlist under CASE-2026-0142 (Theft Investigation). The vehicle was captured by CAM-173 at 09:43 PM with 96% OCR confidence.',
    createdAt: new Date(Date.now() - 17 * 60 * 1000).toISOString(),
    createdAtDisplay: '09:43 PM',
    camera: 'CAM-173',
    location: 'Randesan',
    confidence: 96,
    watchlistVehicleId: 'w-001',
    watchlistReason: 'Theft Investigation',
    caseRef: 'CASE-2026-0142',
    makeModel: 'Maruti Suzuki Baleno',
    color: 'White',
  },
  {
    id: 'a-002',
    type: 'route_anomaly',
    priority: 'medium',
    status: 'under_review',
    plate: 'GJ18XY4421',
    title: 'Route anomaly',
    summary: 'Unusual camera sequence detected · 4 observations · 38 min',
    whyFlagged:
      'GJ18XY4421 was observed on an unusual camera sequence (CAM-024 → CAM-0435 → CAM-173 → CAM-024) over 38 minutes. This sequence deviates from the expected road topology for this corridor.',
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    createdAtDisplay: '09:05 PM',
    observedSequence: [
      { camera: 'CAM-024', location: 'Kudasan', timestamp: '08:32 PM', confidence: 93 },
      { camera: 'CAM-0435', location: 'Sargasan', timestamp: '08:47 PM', confidence: 90 },
      { camera: 'CAM-173', location: 'Randesan', timestamp: '08:59 PM', confidence: 92 },
      { camera: 'CAM-024', location: 'Kudasan', timestamp: '09:10 PM', confidence: 91 },
    ],
    durationMinutes: 38,
    observationCount: 4,
  },
  {
    id: 'a-003',
    type: 'repeated_circulation',
    priority: 'medium',
    status: 'new',
    plate: 'GJ05CD5678',
    title: 'Repeated circulation',
    summary: '2 repeated loops · CAM-024 → CAM-0435 → CAM-201 → CAM-024 · 37 min',
    whyFlagged:
      'GJ05CD5678 completed 2 full cycles of the sequence CAM-024 → CAM-0435 → CAM-201 → CAM-024 within 37 minutes. Repeated circulation in a closed loop without an apparent destination is flagged for analyst review.',
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    createdAtDisplay: '09:20 PM',
    observedSequence: [
      { camera: 'CAM-024', location: 'Kudasan', timestamp: '08:43 PM', confidence: 88 },
      { camera: 'CAM-0435', location: 'Sargasan', timestamp: '08:52 PM', confidence: 86 },
      { camera: 'CAM-201', location: 'Bhaijipura', timestamp: '09:01 PM', confidence: 85 },
      { camera: 'CAM-024', location: 'Kudasan', timestamp: '09:12 PM', confidence: 87 },
      { camera: 'CAM-0435', location: 'Sargasan', timestamp: '09:18 PM', confidence: 84 },
      { camera: 'CAM-201', location: 'Bhaijipura', timestamp: '09:24 PM', confidence: 86 },
      { camera: 'CAM-024', location: 'Kudasan', timestamp: '09:20 PM', confidence: 89 },
    ],
    durationMinutes: 37,
    cycles: 2,
  },
  {
    id: 'a-004',
    type: 'duplicate_plate',
    priority: 'high',
    status: 'new',
    plate: 'GJ09AB9921',
    title: 'Potential duplicate plate observation',
    summary: 'Multiple inconsistent observations detected · Review required',
    whyFlagged:
      'Two observations of GJ09AB9921 were recorded within 1 minute at locations that are physically 4.2 km apart (CAM-173 and CAM-194). This is not consistent with normal travel time and requires analyst verification.',
    createdAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    createdAtDisplay: '09:32 PM',
    observations: [
      { label: 'Observation A', camera: 'CAM-173', timestamp: '09:31 PM', confidence: 96 },
      { label: 'Observation B', camera: 'CAM-194', timestamp: '09:32 PM', confidence: 93 },
    ],
  },
  {
    id: 'a-005',
    type: 'watchlist_hit',
    priority: 'high',
    status: 'acknowledged',
    plate: 'GJ09AB9921',
    title: 'Watchlist vehicle detected',
    summary: 'CAM-173 · Randesan · 09:31 PM',
    whyFlagged:
      'GJ09AB9921 is on the active watchlist under CASE-2026-0158 (Plate Verification Required). Detected by CAM-173 at 09:31 PM with 96% confidence.',
    createdAt: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
    createdAtDisplay: '09:31 PM',
    camera: 'CAM-173',
    location: 'Randesan',
    confidence: 96,
    watchlistVehicleId: 'w-004',
    watchlistReason: 'Plate Verification Required',
    caseRef: 'CASE-2026-0158',
    makeModel: 'Hyundai Creta',
    color: 'Black',
  },
  {
    id: 'a-006',
    type: 'route_anomaly',
    priority: 'medium',
    status: 'resolved',
    plate: 'GJ01MN7732',
    title: 'Route anomaly',
    summary: 'Unusual camera sequence · 3 observations · 22 min',
    whyFlagged:
      'GJ01MN7732 was observed on an atypical sequence (CAM-106 → CAM-173 → CAM-106) over 22 minutes. The sequence implies a U-turn at a restricted median area.',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    createdAtDisplay: '07:00 PM',
    observedSequence: [
      { camera: 'CAM-106', location: 'Sec 10a', timestamp: '06:48 PM', confidence: 91 },
      { camera: 'CAM-173', location: 'Randesan', timestamp: '06:55 PM', confidence: 89 },
      { camera: 'CAM-106', location: 'Sec 10a', timestamp: '07:10 PM', confidence: 90 },
    ],
    durationMinutes: 22,
    observationCount: 3,
  },
];

let _nextAlertId = 7;

const delay = (ms = 200) => new Promise((res) => setTimeout(res, ms));

// ── Filtering helpers ─────────────────────────────────────────

export interface AlertFilters {
  query?: string;
  type?: AlertType | 'all';
  priority?: AlertPriority | 'all';
  status?: AlertStatus | 'all';
}

export async function getAlerts(filters: AlertFilters = {}): Promise<Alert[]> {
  await delay();
  let result = [..._alerts];

  if (filters.query) {
    const q = filters.query.toLowerCase();
    result = result.filter(
      (a) =>
        a.plate.toLowerCase().includes(q) ||
        a.camera?.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q),
    );
  }
  if (filters.type && filters.type !== 'all') {
    result = result.filter((a) => a.type === filters.type);
  }
  if (filters.priority && filters.priority !== 'all') {
    result = result.filter((a) => a.priority === filters.priority);
  }
  if (filters.status && filters.status !== 'all') {
    result = result.filter((a) => a.status === filters.status);
  }

  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getAlert(id: string): Promise<Alert | null> {
  await delay(100);
  return _alerts.find((a) => a.id === id) ?? null;
}

export async function updateAlertStatus(id: string, status: AlertStatus): Promise<Alert | null> {
  await delay(150);
  const idx = _alerts.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  _alerts[idx] = { ..._alerts[idx], status };
  return _alerts[idx];
}

export async function acknowledgeAlert(id: string): Promise<Alert | null> {
  return updateAlertStatus(id, 'acknowledged');
}

export async function resolveAlert(id: string): Promise<Alert | null> {
  return updateAlertStatus(id, 'resolved');
}

// Internal: inject a new alert from store simulation
export function _injectAlert(alert: Omit<Alert, 'id'>): Alert {
  const newAlert: Alert = {
    ...alert,
    id: `a-${String(_nextAlertId++).padStart(3, '0')}`,
  };
  _alerts = [newAlert, ..._alerts];
  return newAlert;
}

export function getAlertsSync(): Alert[] {
  return [..._alerts];
}

// Stats
export function getAlertStats() {
  const active = _alerts.filter((a) => a.status === 'new' || a.status === 'acknowledged' || a.status === 'under_review').length;
  const high = _alerts.filter((a) => a.priority === 'high' && a.status !== 'resolved' && a.status !== 'dismissed').length;
  const resolvedToday = _alerts.filter((a) => a.status === 'resolved').length;
  return { active, high, resolvedToday };
}
