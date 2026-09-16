/** ANPR backend camera feed helpers for the Live Cameras page. */

export const ANPR_CAMERAS = [
  { id: 'cam-gate-a', name: 'Gate A — Entry' },
  { id: 'cam-parking-b', name: 'Parking B — Aisle' },
] as const;

export type AnprCameraId = (typeof ANPR_CAMERAS)[number]['id'];

/** Map any UI camera number onto a live ANPR pipeline camera. */
export function resolveAnprCameraId(uiCameraId: number): AnprCameraId {
  const idx = Math.abs(uiCameraId) % ANPR_CAMERAS.length;
  return ANPR_CAMERAS[idx].id;
}

export function anprStreamUrl(cameraId: string, bust = Date.now()): string {
  return `/api/stream/${cameraId}.jpg?t=${bust}`;
}

export async function fetchAnprHealth(): Promise<{ ok: boolean; stats?: Record<string, number> }> {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: data.status === 'ok', stats: data.stats };
  } catch {
    return { ok: false };
  }
}
