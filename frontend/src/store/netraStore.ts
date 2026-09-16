import { create } from 'zustand';
import type { WatchlistVehicle } from '../types/blacklist';
import type { Alert } from '../types/blacklist';
import type { AlertToastItem } from '../types/toast';
import { MAX_ALERT_TOASTS, TOAST_DURATION_MS } from '../types/toast';
import {
  getWatchlistSync,
  _appendDetection,
} from '../services/blacklistService';
import { getAlertsSync, _injectAlert } from '../services/alertService';

interface NetraState {
  watchlist: WatchlistVehicle[];
  setWatchlist: (vehicles: WatchlistVehicle[]) => void;
  addToWatchlist: (v: WatchlistVehicle) => void;
  updateVehicle: (id: string, updates: Partial<WatchlistVehicle>) => void;
  removeFromWatchlist: (id: string) => void;

  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
  updateAlertStatusLocal: (id: string, status: Alert['status']) => void;
  injectNewAlert: (alert: Omit<Alert, 'id'>) => Alert | null;

  simulateWatchlistHit: (vehicleId: string) => void;

  selectedDateTime: Date | null;
  setSelectedDateTime: (date: Date | null) => void;

  newAlertId: string | null;
  clearNewAlertId: () => void;

  alertToasts: AlertToastItem[];
  pushAlertToast: (alert: Alert) => boolean;
  dismissAlertToast: (toastId: string) => void;
  canPushToast: () => boolean;
}

export const useNetraStore = create<NetraState>((set, get) => ({
  watchlist: getWatchlistSync(),
  setWatchlist: (vehicles) => set({ watchlist: vehicles }),
  addToWatchlist: (v) => set((s) => ({ watchlist: [v, ...s.watchlist] })),
  updateVehicle: (id, updates) =>
    set((s) => ({
      watchlist: s.watchlist.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    })),
  removeFromWatchlist: (id) =>
    set((s) => ({ watchlist: s.watchlist.filter((v) => v.id !== id) })),

  alerts: getAlertsSync(),
  setAlerts: (alerts) => set({ alerts }),
  updateAlertStatusLocal: (id, status) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, status } : a)),
    })),
  injectNewAlert: (alertData) => {
    if (get().alertToasts.length >= MAX_ALERT_TOASTS) {
      return null;
    }
    const injected = _injectAlert(alertData);
    set((s) => ({ alerts: [injected, ...s.alerts], newAlertId: injected.id }));
    get().pushAlertToast(injected);
    return injected;
  },

  newAlertId: null,
  clearNewAlertId: () => set({ newAlertId: null }),

  alertToasts: [],
  canPushToast: () => get().alertToasts.length < MAX_ALERT_TOASTS,
  pushAlertToast: (alert) => {
    if (get().alertToasts.length >= MAX_ALERT_TOASTS) return false;
    const item: AlertToastItem = {
      toastId: `toast-${alert.id}-${Date.now()}`,
      alert,
      createdAt: Date.now(),
      durationMs: TOAST_DURATION_MS,
    };
    set((s) => ({ alertToasts: [...s.alertToasts, item].slice(-MAX_ALERT_TOASTS) }));
    return true;
  },
  dismissAlertToast: (toastId) =>
    set((s) => ({ alertToasts: s.alertToasts.filter((t) => t.toastId !== toastId) })),

  selectedDateTime: null,
  setSelectedDateTime: (date) => set({ selectedDateTime: date }),

  simulateWatchlistHit: (vehicleId: string) => {
    if (!get().canPushToast()) return;

    const vehicle = get().watchlist.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const randomCam = `CAM-${String(Math.floor(Math.random() * 18) + 1).padStart(2, '0')}`;
    const locations = ['SG Highway', '132 Feet Ring Road', 'Gandhinagar Road', 'Pragati Maidan Rd', 'Sargasan Cross Road'];
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const conf = Math.floor(Math.random() * 10) + 88;

    const detection = {
      id: `d-sim-${Date.now()}`,
      timestamp: timeStr,
      camera: randomCam,
      location: loc,
      confidence: conf,
    };

    const lastSeen = {
      camera: randomCam,
      location: loc,
      timestamp: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + timeStr,
      timeAgo: 'just now',
      confidence: conf,
    };

    _appendDetection(vehicleId, detection, lastSeen);

    set((s) => ({
      watchlist: s.watchlist.map((v) =>
        v.id === vehicleId
          ? { ...v, lastSeen, detections: [detection, ...v.detections] }
          : v,
      ),
    }));

    get().injectNewAlert({
      type: 'watchlist_hit',
      priority: vehicle.priority === 'low' ? 'medium' : vehicle.priority,
      status: 'new',
      plate: vehicle.plate,
      title: 'Watchlist vehicle detected',
      summary: `${randomCam} · ${loc} · ${timeStr}`,
      whyFlagged: `${vehicle.plate} is on the active watchlist under ${vehicle.caseRef} (${vehicle.reason}). The vehicle was captured by ${randomCam} at ${timeStr} with ${conf}% OCR confidence.`,
      createdAt: now.toISOString(),
      createdAtDisplay: timeStr,
      camera: randomCam,
      location: loc,
      confidence: conf,
      watchlistVehicleId: vehicleId,
      watchlistReason: vehicle.reason,
      caseRef: vehicle.caseRef,
      makeModel: vehicle.makeModel,
      color: vehicle.color,
    });
  },
}));
