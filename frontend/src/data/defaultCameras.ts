import type { CameraMarker } from '../types/dashboard';

export type CameraLocation = {
  id: string;
  name: string;
  center: [number, number];
  cameras: number[];
  spread?: number;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Location hubs + camera IDs from netra-main.
 * Only area locations are included (no corridor extras).
 */
const AREA_SEEDS: Array<{
  name: string;
  center: [number, number];
  cameraIds: number[];
  spread?: number;
}> = [
  { name: 'Rysan', center: [23.1748, 72.6548], cameraIds: [1, 2, 9, 35, 34, 5, 6, 13, 12, 11, 10], spread: 0.0045 },
  { name: 'Kudasan', center: [23.1937, 72.6321], cameraIds: [28, 29, 23, 26, 24, 25, 21, 22, 41, 42, 55], spread: 0.005 },
  { name: 'Sargasan', center: [23.1904, 72.6147], cameraIds: [69, 70, 65, 66, 63, 64, 67, 68, 61, 182], spread: 0.005 },
  { name: 'Randesan', center: [23.1895, 72.6384], cameraIds: [172, 173, 80, 79, 54, 15, 14, 33], spread: 0.004 },
  { name: 'Info city', center: [23.1979, 72.6392], cameraIds: [93, 94, 91, 92, 109], spread: 0.0035 },
  { name: 'Bhaijipura', center: [23.2099, 72.6451], cameraIds: [7, 8, 201, 48, 49, 30], spread: 0.0045 },
  { name: 'Koba circle', center: [23.1615, 72.629], cameraIds: [43, 44, 45, 46, 47, 50, 51, 165, 163], spread: 0.004 },
  { name: 'Gift City', center: [23.1608, 72.6835], cameraIds: [161, 36, 37, 152, 38, 39, 145, 146, 153, 151, 148, 147, 150, 149, 144, 143, 155, 154], spread: 0.006 },
  { name: 'Chiloda', center: [23.2349, 72.6811], cameraIds: [137, 138, 139, 136, 140, 135, 134], spread: 0.0045 },
  { name: 'Adalaj', center: [23.1685, 72.7055], cameraIds: [194, 192, 193, 190, 189], spread: 0.004 },
  { name: 'Sec 28', center: [23.2145, 72.655], cameraIds: [128, 133, 113, 112], spread: 0.0035 },
  { name: 'Sec 27', center: [23.2195, 72.6495], cameraIds: [131, 130, 125, 126], spread: 0.0035 },
  { name: 'Sec 10a', center: [23.2248, 72.6405], cameraIds: [106, 108, 115], spread: 0.003 },
  { name: 'Sec 5c', center: [23.2295, 72.6355], cameraIds: [102, 103, 100, 99], spread: 0.003 },
];

/** Live Cameras sidebar — locations only. */
export const CAMERA_LOCATIONS: CameraLocation[] = AREA_SEEDS.map((area) => ({
  id: slugify(area.name),
  name: area.name,
  center: area.center,
  cameras: [...area.cameraIds],
  spread: area.spread,
}));

function hashOffset(id: number, salt: number) {
  const x = Math.sin(id * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function buildDefaultCameras(): CameraMarker[] {
  const byId = new Map<string, CameraMarker>();

  for (const area of AREA_SEEDS) {
    const spread = area.spread ?? 0.004;
    area.cameraIds.forEach((num, index) => {
      const id = `CAM-${String(num).padStart(3, '0')}`;
      const ring = Math.floor(index / 4);
      const angle = (index / Math.max(area.cameraIds.length, 1)) * Math.PI * 2 + hashOffset(num, 1);
      const radius = spread * (0.25 + ring * 0.35 + hashOffset(num, 2) * 0.4);
      const lat = area.center[0] + Math.sin(angle) * radius;
      const lng = area.center[1] + Math.cos(angle) * (radius / 0.92);
      byId.set(id, {
        id,
        lat,
        lng,
        status: hashOffset(num, 3) > 0.96 ? 'offline' : 'online',
        name: id,
        location: area.name,
      });
    });
  }

  return [...byId.values()].sort(
    (a, b) => Number(a.id.replace(/\D/g, '')) - Number(b.id.replace(/\D/g, '')),
  );
}

/** Map markers derived only from location hubs (no corridor fillers). */
export const DEFAULT_CAMERAS: CameraMarker[] = buildDefaultCameras();
