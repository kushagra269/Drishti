import type { Alert } from '../types/blacklist';
import type { WatchlistVehicle } from '../types/blacklist';
import {
  MOCK_TRAJECTORIES,
  ensureTrajectoryDatesForSearch,
  getDefaultTrajectoryDateStrings,
  sequenceFromCameras,
  type TrajectoryPoint,
} from '../data/trajectoryDatabase';

export interface PlateSuggestion {
  plate: string;
  label: string;
  source: 'watchlist' | 'alert' | 'network';
}

export function getTrajectoryPlateSuggestions(
  query: string,
  watchlist: WatchlistVehicle[],
  alerts: Alert[],
): PlateSuggestion[] {
  const q = query.trim().toUpperCase();
  const map = new Map<string, PlateSuggestion>();

  watchlist.forEach((v) => {
    map.set(v.plate.toUpperCase(), {
      plate: v.plate.toUpperCase(),
      label: `${v.color} ${v.makeModel} · Watchlist`,
      source: 'watchlist',
    });
  });

  alerts.forEach((a) => {
    if (!map.has(a.plate.toUpperCase())) {
      map.set(a.plate.toUpperCase(), {
        plate: a.plate.toUpperCase(),
        label: `Alert · ${a.summary.slice(0, 42)}${a.summary.length > 42 ? '…' : ''}`,
        source: 'alert',
      });
    }
  });

  Object.keys(MOCK_TRAJECTORIES).forEach((plate) => {
    if (!map.has(plate)) {
      map.set(plate, { plate, label: 'Corridor history available', source: 'network' });
    }
  });

  let list = [...map.values()];
  if (q) {
    list = list.filter((s) => s.plate.includes(q) || s.label.toUpperCase().includes(q));
  }
  return list.slice(0, 8);
}

export function resolveTrajectoryForPlate(
  plate: string,
  dateStr: string,
  watchlist: WatchlistVehicle[],
  alerts: Alert[],
): TrajectoryPoint[] | undefined {
  const upper = plate.toUpperCase();
  ensureTrajectoryDatesForSearch(dateStr, dateStr);
  const fromMock = MOCK_TRAJECTORIES[upper]?.[dateStr];
  if (fromMock?.length) return fromMock;

  const vehicle = watchlist.find((v) => v.plate.toUpperCase() === upper);
  if (vehicle?.detections?.length) {
    const seq = sequenceFromCameras(
      vehicle.detections.map((d) => ({ camera: d.camera, timestamp: d.timestamp })),
    );
    if (seq.length >= 2) return seq;
  }

  const alert = alerts.find((a) => a.plate.toUpperCase() === upper);
  if (alert?.observedSequence?.length) {
    const seq = sequenceFromCameras(alert.observedSequence);
    if (seq.length >= 2) return seq;
  }

  const { todayStr } = getDefaultTrajectoryDateStrings();
  if (dateStr !== todayStr) return undefined;
  return MOCK_TRAJECTORIES[upper]?.['2026-09-03'];
}

export function featuredTrajectoryPlates(): string[] {
  return ['GJ09KR2997', 'GJ01AB1234', 'GJ18XY4421', 'GJ05CD5678'];
}
