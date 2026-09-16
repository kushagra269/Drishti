// ============================================================
// NETRA Dashboard Service Layer
// ============================================================

import type {
  DashboardSummary,
  TrafficCorridor,
  TrafficFlowData,
  VehicleDetection,
  PriorityAlert,
  CameraMarker,
} from '../types/dashboard';

const delay = (ms = 300) => new Promise((res) => setTimeout(res, ms));

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await delay(400);
  return {
    vehiclesToday: 18442,
    vehiclesTodayChange: 12.5,
    activeAlerts: 7,
    highPriorityAlerts: 2,
    camerasOnline: 126,
    totalCameras: 132,
    averageCitySpeed: 42,
    averageCitySpeedChange: 3,
    lastUpdated: new Date(),
  };
}

export async function getTrafficSnapshot(): Promise<TrafficCorridor[]> {
  // Traffic removed for now as per instructions
  return [];
}

export async function getTrafficFlow(): Promise<TrafficFlowData> {
  return { today: [], sevenDays: [], thirtyDays: [] };
}

export async function getRecentDetections(): Promise<VehicleDetection[]> {
  return [];
}

export async function getPriorityAlerts(): Promise<PriorityAlert[]> {
  return [];
}

// ─── Camera Generation for Raysan Area ───────────────────────

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

function generateLineCameras(
  startLat: number, startLng: number, 
  endLat: number, endLng: number, 
  count: number, 
  startIndex: number,
  roadName: string
): CameraMarker[] {
  const cams: CameraMarker[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    cams.push({
      id: `CAM-${String(startIndex + i).padStart(3, '0')}`,
      lat: lerp(startLat, endLat, t),
      lng: lerp(startLng, endLng, t),
      status: Math.random() > 0.95 ? 'offline' : 'online',
      name: `CAM-${String(startIndex + i).padStart(3, '0')}`,
      location: roadName
    });
  }
  return cams;
}

function generateRoundaboutCameras(
  centerLat: number, centerLng: number, 
  count: number, 
  startIndex: number,
  circleName: string
): CameraMarker[] {
  const cams: CameraMarker[] = [];
  const radius = 0.00015; // roughly 15 meters
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    cams.push({
      id: `CAM-${String(startIndex + i).padStart(3, '0')}`,
      lat: centerLat + Math.sin(angle) * radius,
      lng: centerLng + Math.cos(angle) * (radius / 0.92), // lat/lng aspect ratio adjustment
      status: 'online',
      name: `CAM-${String(startIndex + i).padStart(3, '0')} (Circle)`,
      location: circleName
    });
  }
  return cams;
}

export async function getCameraMarkers(): Promise<CameraMarker[]> {
  await delay(200);
  
  // Cameras removed for now. 
  // Awaiting real camera details to be provided later.
  return [];
}

export function getNextLiveDetection(): VehicleDetection {
  // Not used right now
  return {} as VehicleDetection;
}
