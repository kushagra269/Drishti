import {
  ANALYTICS_ROUTE_PAIRS,
  HOURLY_TRAFFIC_WEIGHT,
  OCR_REVIEW_THRESHOLD,
  VEHICLE_COLORS,
  VEHICLE_TYPES,
  type VehicleType,
} from '../data/analyticsRoutes';

export interface AnalyticsFilters {
  startDate: Date;
  endDate: Date;
  hourStart: number;
  hourEnd: number;
  cameraId: string;
  vehicleTypes: VehicleType[];
}

export interface AnalyticsKpis {
  totalVehicles: number;
  totalAlerts: number;
  avgLatencySec: number;
  activeCameras: number;
}

export interface HeatmapCell {
  dayIndex: number;
  dayLabel: string;
  hour: number;
  count: number;
}

export interface TimeSeriesPoint {
  label: string;
  iso: string;
  vehicles?: number;
  alerts?: number;
  congestionIndex?: number;
}

export interface CameraMetric {
  cameraId: string;
  label: string;
  alerts: number;
  avgSpeed: number;
}

export interface RouteFrequency {
  id: string;
  origin: string;
  destination: string;
  label: string;
  count: number;
}

export interface OcrHistogramBin {
  binStart: number;
  binEnd: number;
  label: string;
  count: number;
}

export interface AnalyticsDataset {
  kpis: AnalyticsKpis;
  heatmap: HeatmapCell[];
  volumeSeries: TimeSeriesPoint[];
  alertsByCamera: CameraMetric[];
  alertsSeries: TimeSeriesPoint[];
  vehicleTypeSplit: { type: VehicleType; count: number; pct: number }[];
  vehicleColorSplit: { color: string; count: number }[];
  speedByCamera: CameraMetric[];
  congestionSeries: TimeSeriesPoint[];
  ocrHistogram: OcrHistogramBin[];
  ocrFlaggedForReview: number;
  topRoutes: RouteFrequency[];
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(parts: (string | number)[]): number {
  const s = parts.join('|');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function eachDayInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = startOfDay(start);
  const last = startOfDay(end);
  while (cur <= last) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function dayName(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function hoursInFilter(hStart: number, hEnd: number): number[] {
  const hours: number[] = [];
  if (hStart <= hEnd) {
    for (let h = hStart; h <= hEnd; h++) hours.push(h);
  } else {
    for (let h = hStart; h <= 23; h++) hours.push(h);
    for (let h = 0; h <= hEnd; h++) hours.push(h);
  }
  return hours;
}

function vehicleTypeWeights(types: VehicleType[]): Record<VehicleType, number> {
  const base: Record<VehicleType, number> = { Car: 0.42, Bike: 0.35, Bus: 0.12, Truck: 0.11 };
  const selected = types.length ? types : [...VEHICLE_TYPES];
  const sum = selected.reduce((acc, t) => acc + base[t], 0);
  const out = { Car: 0, Bike: 0, Bus: 0, Truck: 0 };
  selected.forEach((t) => {
    out[t] = base[t] / sum;
  });
  return out;
}

export function defaultAnalyticsFilters(): AnalyticsFilters {
  const end = startOfDay(new Date());
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return {
    startDate: start,
    endDate: end,
    hourStart: 0,
    hourEnd: 23,
    cameraId: 'all',
    vehicleTypes: [...VEHICLE_TYPES],
  };
}

export function buildAnalyticsDataset(
  filters: AnalyticsFilters,
  cameraIds: string[],
): AnalyticsDataset {
  const seed = hashSeed([
    filters.startDate.toISOString().slice(0, 10),
    filters.endDate.toISOString().slice(0, 10),
    filters.hourStart,
    filters.hourEnd,
    filters.cameraId,
    filters.vehicleTypes.join(','),
    cameraIds.join(','),
  ]);
  const rand = mulberry32(seed);

  const allCameras =
    cameraIds.length > 0
      ? cameraIds
      : [...new Set(ANALYTICS_ROUTE_PAIRS.flatMap((r) => [r.from, r.to]))];

  const scopedCameras =
    filters.cameraId === 'all' ? allCameras : allCameras.filter((c) => c === filters.cameraId);

  const activeCameras = Math.max(
    1,
    filters.cameraId === 'all'
      ? Math.floor(allCameras.length * (0.88 + rand() * 0.1))
      : scopedCameras.length,
  );

  const days = eachDayInRange(filters.startDate, filters.endDate);
  const allowedHours = hoursInFilter(filters.hourStart, filters.hourEnd);
  const hourFactor = allowedHours.length / 24;
  const dayFactor = days.length / 7;
  const cameraFactor = filters.cameraId === 'all' ? 1 : 0.22 + rand() * 0.18;
  const typeWeights = vehicleTypeWeights(filters.vehicleTypes);
  const typeFactor = filters.vehicleTypes.length / VEHICLE_TYPES.length;

  let totalVehicles = 0;
  const heatmap: HeatmapCell[] = [];

  days.forEach((day, dayIndex) => {
    const dow = day.getDay();
    const weekendScale = dow === 0 || dow === 6 ? 0.78 : 1;
    allowedHours.forEach((hour) => {
      const w = HOURLY_TRAFFIC_WEIGHT[hour] / 100;
      const noise = 0.85 + rand() * 0.3;
      const count = Math.round(180 * w * weekendScale * cameraFactor * typeFactor * noise);
      totalVehicles += count;
      heatmap.push({
        dayIndex,
        dayLabel: `${dayName(day)} ${formatShortDate(day)}`,
        hour,
        count,
      });
    });
  });

  totalVehicles = Math.round(totalVehicles * (0.95 + dayFactor * 0.05));

  const alertRate = 0.018 + rand() * 0.012;
  const totalAlerts = Math.max(1, Math.round(totalVehicles * alertRate * (1.1 - hourFactor * 0.15)));
  const avgLatencySec = Math.round(4.2 + rand() * 3.8 + (1 - hourFactor) * 2);

  const volumeSeries: TimeSeriesPoint[] = days.map((day) => {
    const iso = startOfDay(day).toISOString();
    const dayCells = heatmap.filter((c) => c.dayIndex === days.indexOf(day));
    const vehicles = dayCells.reduce((s, c) => s + c.count, 0);
    return { label: formatShortDate(day), iso, vehicles };
  });

  const alertsByCamera: CameraMetric[] = (filters.cameraId === 'all' ? allCameras : scopedCameras)
    .slice(0, 12)
    .map((cameraId, i) => {
      const share = (0.6 + rand()) / allCameras.length;
      const alerts = Math.max(1, Math.round(totalAlerts * share * (1.2 - i * 0.04)));
      const avgSpeed = Math.round(28 + rand() * 38 - (alerts / totalAlerts) * 12);
      return {
        cameraId,
        label: cameraId,
        alerts,
        avgSpeed,
      };
    })
    .sort((a, b) => b.alerts - a.alerts);

  const alertsSeries: TimeSeriesPoint[] = days.map((day, i) => {
    const iso = startOfDay(day).toISOString();
    const base = totalAlerts / days.length;
    const alerts = Math.max(0, Math.round(base * (0.75 + rand() * 0.5) + (i % 3 === 0 ? 3 : 0)));
    return { label: formatShortDate(day), iso, alerts };
  });

  const typeTotal = totalVehicles;
  const vehicleTypeSplit = VEHICLE_TYPES.map((type) => {
    const count =
      filters.vehicleTypes.includes(type) ?
        Math.round(typeTotal * typeWeights[type] * (0.92 + rand() * 0.16))
      : 0;
    return { type, count, pct: 0 };
  }).filter((x) => x.count > 0);
  const typeSum = vehicleTypeSplit.reduce((s, x) => s + x.count, 0) || 1;
  vehicleTypeSplit.forEach((x) => {
    x.pct = Math.round((x.count / typeSum) * 100);
  });

  const vehicleColorSplit = VEHICLE_COLORS.map((color) => ({
    color,
    count: Math.round(typeTotal * (0.08 + rand() * 0.14) * typeFactor * cameraFactor),
  }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const speedByCamera = (filters.cameraId === 'all' ? allCameras : scopedCameras)
    .slice(0, 10)
    .map((cameraId) => ({
      cameraId,
      label: cameraId,
      alerts: 0,
      avgSpeed: Math.round(32 + rand() * 33),
    }))
    .sort((a, b) => b.avgSpeed - a.avgSpeed);

  const congestionSeries: TimeSeriesPoint[] = days.map((day) => {
    const iso = startOfDay(day).toISOString();
    const peak = allowedHours.some((h) => h >= 8 && h <= 10) || allowedHours.some((h) => h >= 17 && h <= 20);
    const congestionIndex = Math.round(
      (peak ? 58 : 42) + rand() * 28 + (1 - cameraFactor) * 10,
    );
    return { label: formatShortDate(day), iso, congestionIndex: Math.min(100, congestionIndex) };
  });

  const ocrHistogram: OcrHistogramBin[] = [];
  let flagged = 0;
  const binSize = 5;
  for (let start = 50; start < 100; start += binSize) {
    const end = start + binSize;
    const mid = (start + end) / 2;
    const bell = Math.exp(-Math.pow((mid - 91) / 12, 2));
    const count = Math.round(totalVehicles * 0.08 * bell * (0.7 + rand() * 0.6));
    if (end <= OCR_REVIEW_THRESHOLD) flagged += count;
    ocrHistogram.push({
      binStart: start,
      binEnd: end,
      label: `${start}–${end}%`,
      count,
    });
  }
  flagged = Math.round(flagged * (0.9 + rand() * 0.2));

  const routeBase = [3200, 2800, 1500, 4100, 3800, 1200, 2100, 4500, 2600, 1900, 2400, 1700];
  const topRoutes: RouteFrequency[] = ANALYTICS_ROUTE_PAIRS.map((route, i) => {
    const relevant =
      filters.cameraId === 'all' ||
      route.from === filters.cameraId ||
      route.to === filters.cameraId;
    const base = routeBase[i % routeBase.length];
    const count = relevant
      ? Math.round(base * cameraFactor * typeFactor * (0.55 + rand() * 0.45))
      : Math.round(80 + rand() * 120);
    return {
      id: `${route.from}-${route.to}`,
      origin: route.from,
      destination: route.to,
      label: route.label,
      count,
    };
  })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    kpis: {
      totalVehicles,
      totalAlerts,
      avgLatencySec,
      activeCameras,
    },
    heatmap,
    volumeSeries,
    alertsByCamera,
    alertsSeries,
    vehicleTypeSplit,
    vehicleColorSplit,
    speedByCamera,
    congestionSeries,
    ocrHistogram,
    ocrFlaggedForReview: flagged,
    topRoutes,
  };
}
