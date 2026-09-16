import { useEffect, useRef, useState } from 'react';

interface LiveOcrScannerPanelProps {
  cameraId: number;
  locationName?: string;
}

interface OcrHit {
  id: string;
  plate: string;
  makeModel: string;
  color: string;
  speed: number;
  confidence: number;
  at: string;
}

const MAKES = [
  { make: 'Maruti Suzuki Swift', color: 'White' },
  { make: 'Hyundai Creta', color: 'Silver' },
  { make: 'Tata Nexon', color: 'Blue' },
  { make: 'Honda City', color: 'Grey' },
  { make: 'Toyota Innova', color: 'White' },
  { make: 'Mahindra XUV700', color: 'Black' },
  { make: 'Maruti Suzuki Baleno', color: 'Red' },
  { make: 'Kia Seltos', color: 'White' },
];

function formatTime24(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function genPlate(rand: () => number) {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const dig = () => String(Math.floor(rand() * 10));
  const let3 = () =>
    letters[Math.floor(rand() * letters.length)] +
    letters[Math.floor(rand() * letters.length)] +
    letters[Math.floor(rand() * letters.length)];
  return `GJ${dig()}${let3()}${dig()}${dig()}${dig()}${dig()}`;
}

function buildHit(cameraId: number, tick: number, atOffsetSec = 0): OcrHit {
  const rand = mulberry(cameraId * 9973 + tick * 131);
  const vehicle = MAKES[Math.floor(rand() * MAKES.length)];
  const now = new Date(Date.now() - atOffsetSec * 1000);
  return {
    id: `${cameraId}-${tick}-${now.getTime()}`,
    plate: genPlate(rand),
    makeModel: vehicle.make,
    color: vehicle.color,
    speed: Math.round(28 + rand() * 52),
    confidence: Math.round(82 + rand() * 17),
    at: formatTime24(now),
  };
}

function seedPasses(cameraId: number, count: number): OcrHit[] {
  const hits: OcrHit[] = [];
  for (let i = 0; i < count; i++) {
    hits.push(buildHit(cameraId, i + 1, i * 4));
  }
  return hits;
}

export function LiveOcrScannerPanel({ cameraId, locationName }: LiveOcrScannerPanelProps) {
  const [passes, setPasses] = useState<OcrHit[]>(() => seedPasses(cameraId, 6));
  const tickRef = useRef(6);

  useEffect(() => {
    tickRef.current = 6;
    setPasses(seedPasses(cameraId, 6));

    let timeoutId: ReturnType<typeof setTimeout>;
    const queueNextPass = (delayMs: number) => {
      timeoutId = setTimeout(() => {
        tickRef.current += 1;
        const hit = buildHit(cameraId, tickRef.current);
        setPasses((prev) => [hit, ...prev].slice(0, 24));
        queueNextPass(1600 + Math.random() * 1400);
      }, delayMs);
    };

    queueNextPass(900);
    return () => clearTimeout(timeoutId);
  }, [cameraId]);

  const camLabel = `CAM-${String(cameraId).padStart(3, '0')}`;

  return (
    <div
      className="flex flex-col h-full min-h-0"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-default)',
      }}
    >
      <div
        className="px-4 py-2 shrink-0"
        style={{ borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Live ANPR Engine</h3>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
          {locationName ?? 'Corridor'} · {camLabel}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {passes.map((hit) => (
          <div
            key={hit.id}
            className="flex items-center gap-2 px-3"
            style={{
              height: 26,
              fontSize: 11,
              color: 'var(--text-primary)',
              borderBottom: '1px solid var(--border-soft)',
            }}
          >
            <span
              className="font-mono shrink-0"
              style={{
                width: 96,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '0.02em',
              }}
            >
              {hit.plate}
            </span>
            <span className="truncate flex-1 min-w-0" style={{ color: 'var(--text-secondary)' }}>
              {hit.color} · {hit.makeModel}
            </span>
            <span className="shrink-0 tabular-nums whitespace-nowrap" style={{ width: 48, textAlign: 'right' }}>
              {hit.speed} km/h
            </span>
            <span
              className="shrink-0 tabular-nums whitespace-nowrap"
              style={{ width: 32, textAlign: 'right', color: 'var(--text-primary)' }}
            >
              {hit.confidence}%
            </span>
            <span
              className="shrink-0 tabular-nums whitespace-nowrap"
              style={{ width: 64, textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}
            >
              {hit.at}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
