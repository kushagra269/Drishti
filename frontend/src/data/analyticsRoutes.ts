/** Known corridor pairs for route-frequency analytics (no geometry). */
export const ANALYTICS_ROUTE_PAIRS = [
  { from: 'CAM-065', to: 'CAM-024', label: 'Sargasan → Kudasan' },
  { from: 'CAM-024', to: 'CAM-173', label: 'Kudasan → Randesan' },
  { from: 'CAM-173', to: 'CAM-091', label: 'Randesan → Info City' },
  { from: 'CAM-043', to: 'CAM-201', label: 'Koba → Bhaijipura' },
  { from: 'CAM-201', to: 'CAM-143', label: 'Bhaijipura → Gift City' },
  { from: 'CAM-143', to: 'CAM-137', label: 'Gift City → Chiloda' },
  { from: 'CAM-024', to: 'CAM-201', label: 'Kudasan → Bhaijipura' },
  { from: 'CAM-091', to: 'CAM-065', label: 'Info City → Sargasan' },
  { from: 'CAM-065', to: 'CAM-043', label: 'Sargasan → Koba' },
  { from: 'CAM-137', to: 'CAM-024', label: 'Chiloda → Kudasan' },
  { from: 'CAM-201', to: 'CAM-173', label: 'Bhaijipura → Randesan' },
  { from: 'CAM-043', to: 'CAM-065', label: 'Koba → Sargasan' },
] as const;

export const VEHICLE_TYPES = ['Car', 'Bike', 'Bus', 'Truck'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_COLORS = [
  'White',
  'Black',
  'Silver',
  'Grey',
  'Blue',
  'Red',
  'Maroon',
  'Green',
] as const;

/** Hour-of-day traffic weight curve (0–23). */
export const HOURLY_TRAFFIC_WEIGHT = [
  10, 8, 5, 5, 12, 35, 75, 90, 85, 70, 65, 70, 75, 80, 85, 95, 100, 110, 95, 75, 50, 35, 25, 15,
];

export const OCR_REVIEW_THRESHOLD = 85;
