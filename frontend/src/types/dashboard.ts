// ============================================================
// NETRA Dashboard — TypeScript Interfaces
// ============================================================

export interface DashboardSummary {
  vehiclesToday: number;
  vehiclesTodayChange: number; // percentage vs yesterday
  activeAlerts: number;
  highPriorityAlerts: number;
  camerasOnline: number;
  totalCameras: number;
  averageCitySpeed: number;
  averageCitySpeedChange: number; // km/h change vs morning
  lastUpdated: Date;
}

export type Severity = 'normal' | 'moderate' | 'high' | 'severe';

export interface TrafficCorridor {
  id: string;
  name: string;
  severity: Severity;
  speed: number; // km/h
  vehiclesPerHour: number;
  // Coordinates for map overlay [lat, lng][]
  coordinates: [number, number][];
}

export interface TrafficFlowPoint {
  hour: string;       // e.g. "06", "08"
  label: string;      // e.g. "6 AM"
  vehicles: number;
  avgSpeed: number;   // km/h
}

export interface TrafficFlowData {
  today: TrafficFlowPoint[];
  sevenDays: TrafficFlowPoint[];
  thirtyDays: TrafficFlowPoint[];
}

export interface VehicleDetection {
  id: string;
  plate: string;
  makeModel: string;
  color: string;
  camera: string;
  location: string;
  timestamp: string; // HH:MM:SS
  confidence: number; // 0–100
  isBlacklisted?: boolean;
}

export type AlertSeverity = 'high' | 'medium' | 'low';

export interface PriorityAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  plate?: string;
  camera?: string;
  location?: string;
  timeAgo: string;
}

export interface CameraMarker {
  id: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'alert';
  name: string;
  location: string;
}
