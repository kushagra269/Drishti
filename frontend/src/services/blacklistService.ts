// ============================================================
// NETRA — Blacklist / Watchlist Service Layer
// Replace mock implementations with FastAPI calls later.
// ============================================================

import type {
  WatchlistVehicle,
  WatchlistPriority,
  WatchlistStatus,
} from '../types/blacklist';

// ── Shared in-memory store (mock "database") ─────────────────
let _vehicles: WatchlistVehicle[] = [
  {
    id: 'w-001',
    plate: 'GJ09KR2997',
    makeModel: 'Maruti Suzuki Baleno',
    color: 'White',
    reason: 'Theft Investigation',
    caseRef: 'CASE-2026-0142',
    addedDate: '30 Aug 2026',
    addedBy: 'Inspector R. Mehta',
    priority: 'high',
    status: 'active',
    notes: 'Vehicle suspected in multiple ATM vicinity incidents. Monitor all corridors.',
    lastSeen: {
      camera: 'CAM-173',
      location: 'Randesan',
      timestamp: '02 Sep 2026, 08:42 PM',
      timeAgo: '8 min ago',
      confidence: 96,
    },
    detections: [
      { id: 'd-1a', timestamp: '08:42 PM', camera: 'CAM-173', location: 'Randesan', confidence: 96 },
      { id: 'd-1b', timestamp: '08:07 PM', camera: 'CAM-024', location: 'Kudasan', confidence: 94 },
      { id: 'd-1c', timestamp: '07:31 PM', camera: 'CAM-091', location: 'Info city', confidence: 91 },
      { id: 'd-1d', timestamp: '06:54 PM', camera: 'CAM-065', location: 'Sargasan', confidence: 95 },
      { id: 'd-1e', timestamp: '01 Sep, 07:20 PM', camera: 'CAM-155', location: 'Gift City', confidence: 89 },
    ],
  },
  {
    id: 'w-002',
    plate: 'GJ18XY4421',
    makeModel: 'Honda City',
    color: 'Silver',
    reason: 'Ongoing Investigation',
    caseRef: 'CASE-2026-0117',
    addedDate: '28 Aug 2026',
    addedBy: 'ACP Traffic Wing',
    priority: 'medium',
    status: 'active',
    lastSeen: {
      camera: 'CAM-011',
      location: 'Rysan',
      timestamp: '02 Sep 2026, 06:51 PM',
      timeAgo: '2 hr ago',
      confidence: 93,
    },
    detections: [
      { id: 'd-2a', timestamp: '06:51 PM', camera: 'CAM-011', location: 'Rysan', confidence: 93 },
      { id: 'd-2b', timestamp: '05:22 PM', camera: 'CAM-133', location: 'Sec 28', confidence: 90 },
    ],
  },
  {
    id: 'w-003',
    plate: 'GJ05CD5678',
    makeModel: 'Toyota Innova',
    color: 'Grey',
    reason: 'Evidence Review',
    caseRef: 'CASE-2026-0094',
    addedDate: '21 Aug 2026',
    addedBy: 'Inspector D. Shah',
    priority: 'low',
    status: 'monitoring',
    detections: [
      { id: 'd-3a', timestamp: '31 Aug, 03:11 PM', camera: 'CAM-194', location: 'Adalaj', confidence: 87 },
      { id: 'd-3b', timestamp: '29 Aug, 11:44 AM', camera: 'CAM-043', location: 'Koba circle', confidence: 85 },
    ],
  },
  {
    id: 'w-004',
    plate: 'GJ09AB9921',
    makeModel: 'Hyundai Creta',
    color: 'Black',
    reason: 'Plate Verification Required',
    caseRef: 'CASE-2026-0158',
    addedDate: '01 Sep 2026',
    addedBy: 'System Flag',
    priority: 'high',
    status: 'active',
    notes: 'Flagged for potential duplicate plate observation. Analyst review required.',
    lastSeen: {
      camera: 'CAM-143',
      location: 'Gift City',
      timestamp: '02 Sep 2026, 09:32 PM',
      timeAgo: '12 min ago',
      confidence: 93,
    },
    detections: [
      { id: 'd-4a', timestamp: '09:32 PM', camera: 'CAM-143', location: 'Gift City', confidence: 93 },
      { id: 'd-4b', timestamp: '09:31 PM', camera: 'CAM-137', location: 'Chiloda', confidence: 96 },
    ],
  },
  {
    id: 'w-005',
    plate: 'GJ01MN7732',
    makeModel: 'Tata Nexon',
    color: 'Blue',
    reason: 'Missing Vehicle Report',
    caseRef: 'CASE-2026-0133',
    addedDate: '25 Aug 2026',
    addedBy: 'Inspector R. Mehta',
    priority: 'medium',
    status: 'suspended',
    detections: [
      { id: 'd-5a', timestamp: '26 Aug, 08:45 AM', camera: 'CAM-106', location: 'Sec 10a', confidence: 91 },
    ],
  },
];

let _nextId = 6;

const delay = (ms = 250) => new Promise((res) => setTimeout(res, ms));

// ── Public API ───────────────────────────────────────────────

export async function getWatchlist(): Promise<WatchlistVehicle[]> {
  await delay();
  return [..._vehicles];
}

export async function searchWatchlist(query: string): Promise<WatchlistVehicle[]> {
  await delay(100);
  const q = query.toLowerCase().trim();
  if (!q) return [..._vehicles];
  return _vehicles.filter(
    (v) =>
      v.plate.toLowerCase().includes(q) ||
      v.caseRef.toLowerCase().includes(q) ||
      v.reason.toLowerCase().includes(q) ||
      v.makeModel.toLowerCase().includes(q),
  );
}

export async function getWatchlistVehicle(id: string): Promise<WatchlistVehicle | null> {
  await delay(100);
  return _vehicles.find((v) => v.id === id) ?? null;
}

export interface AddVehiclePayload {
  plate: string;
  makeModel?: string;
  color?: string;
  reason: string;
  caseRef?: string;
  priority: WatchlistPriority;
  notes?: string;
}

export async function addWatchlistVehicle(data: AddVehiclePayload): Promise<WatchlistVehicle> {
  await delay(300);
  const vehicle: WatchlistVehicle = {
    id: `w-${String(_nextId++).padStart(3, '0')}`,
    plate: data.plate.toUpperCase(),
    makeModel: data.makeModel || 'Unknown',
    color: data.color || 'Unknown',
    reason: data.reason,
    caseRef: data.caseRef || `CASE-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    addedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    addedBy: 'Admin',
    priority: data.priority,
    status: 'active',
    notes: data.notes,
    detections: [],
  };
  _vehicles = [vehicle, ..._vehicles];
  return vehicle;
}

export async function updateWatchlistVehicle(
  id: string,
  updates: Partial<Pick<WatchlistVehicle, 'priority' | 'status' | 'notes' | 'reason' | 'caseRef'>>,
): Promise<WatchlistVehicle | null> {
  await delay(200);
  const idx = _vehicles.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  _vehicles[idx] = { ..._vehicles[idx], ...updates };
  return _vehicles[idx];
}

export async function removeWatchlistVehicle(id: string): Promise<boolean> {
  await delay(200);
  const before = _vehicles.length;
  _vehicles = _vehicles.filter((v) => v.id !== id);
  return _vehicles.length < before;
}

// Internal: append a detection (called from Zustand store simulation)
export function _appendDetection(
  vehicleId: string,
  detection: WatchlistVehicle['detections'][number],
  lastSeen: WatchlistVehicle['lastSeen'],
) {
  const idx = _vehicles.findIndex((v) => v.id === vehicleId);
  if (idx !== -1) {
    _vehicles[idx] = {
      ..._vehicles[idx],
      lastSeen,
      detections: [detection, ..._vehicles[idx].detections],
    };
  }
}

export function getWatchlistSync(): WatchlistVehicle[] {
  return [..._vehicles];
}
