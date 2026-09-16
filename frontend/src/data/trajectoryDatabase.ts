export type TrajectoryPoint = { id: number; time: string };

const DEMO_ROUTE: TrajectoryPoint[] = [
  { id: 9, time: '09:00' },
  { id: 2, time: '09:10' },
  { id: 35, time: '09:12' },
  { id: 5, time: '09:13' },
  { id: 8, time: '09:16' },
  { id: 33, time: '09:20' },
  { id: 16, time: '09:22' },
  { id: 91, time: '09:28' },
  { id: 95, time: '09:32' },
  { id: 96, time: '09:35' },
  { id: 105, time: '09:40' },
  { id: 107, time: '09:47' },
  { id: 218, time: '09:55' },
  { id: 119, time: '10:05' },
];

const DEMO_ROUTE_2: TrajectoryPoint[] = [
  { id: 53, time: '08:15' },
  { id: 5, time: '08:16' },
  { id: 34, time: '08:17' },
  { id: 1, time: '08:18' },
  { id: 36, time: '08:20' },
  { id: 144, time: '08:22' },
  { id: 155, time: '08:24' },
  { id: 147, time: '08:25' },
  { id: 167, time: '08:28' },
  { id: 171, time: '08:31' },
  { id: 172, time: '08:33' },
  { id: 58, time: '08:35' },
  { id: 62, time: '08:37' },
  { id: 65, time: '17:30' },
  { id: 91, time: '17:35' },
  { id: 95, time: '17:42' },
  { id: 109, time: '17:50' },
  { id: 111, time: '17:56' },
  { id: 133, time: '18:05' },
  { id: 136, time: '18:12' },
  { id: 141, time: '18:19' },
  { id: 37, time: '18:28' },
  { id: 35, time: '18:34' },
  { id: 53, time: '18:40' },
];

const DEMO_ROUTE_3: TrajectoryPoint[] = [
  { id: 10, time: '08:35' },
  { id: 11, time: '08:39' },
  { id: 12, time: '08:43' },
  { id: 13, time: '08:47' },
  { id: 54, time: '08:52' },
  { id: 79, time: '08:56' },
  { id: 80, time: '09:00' },
  { id: 173, time: '16:20' },
  { id: 58, time: '16:26' },
  { id: 59, time: '16:32' },
  { id: 93, time: '16:38' },
  { id: 109, time: '16:45' },
  { id: 95, time: '16:51' },
  { id: 17, time: '16:57' },
  { id: 33, time: '17:03' },
  { id: 31, time: '17:09' },
  { id: 7, time: '17:15' },
  { id: 3, time: '17:21' },
  { id: 34, time: '17:28' },
  { id: 9, time: '17:35' },
];

export const TRAJECTORY_COLORS = ['#2457D6', '#16A34A', '#EA580C', '#9333EA', '#E11D48', '#0891B2'];

export const MOCK_TRAJECTORIES: Record<string, Record<string, TrajectoryPoint[]>> = {
  GJ09KR2997: {
    '2026-09-03': DEMO_ROUTE,
    '2026-09-02': DEMO_ROUTE_3,
  },
  GJ09KR1234: {
    '2026-09-03': DEMO_ROUTE_2,
    '2026-09-02': DEMO_ROUTE_2,
  },
  GJ01AB1234: {
    '2026-09-03': [
      { id: 161, time: '20:10' },
      { id: 144, time: '20:25' },
      { id: 173, time: '21:43' },
    ],
  },
  GJ18XY4421: {
    '2026-09-03': [
      { id: 24, time: '19:50' },
      { id: 65, time: '20:10' },
      { id: 173, time: '20:30' },
      { id: 24, time: '20:45' },
    ],
  },
  GJ05CD5678: {
    '2026-09-03': [
      { id: 24, time: '20:43' },
      { id: 65, time: '20:52' },
      { id: 201, time: '21:01' },
      { id: 24, time: '21:12' },
      { id: 65, time: '21:18' },
      { id: 201, time: '21:24' },
    ],
  },
  GJ09AB9921: {
    '2026-09-03': [
      { id: 173, time: '21:31' },
      { id: 194, time: '21:32' },
    ],
  },
  GJ01MN7732: {
    '2026-09-03': [
      { id: 106, time: '18:48' },
      { id: 173, time: '18:55' },
      { id: 106, time: '19:10' },
    ],
  },
};

export function getLocalDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultTrajectoryDateStrings() {
  const today = new Date();
  const todayStr = getLocalDateString(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);
  return { todayStr, yesterdayStr, maxDate: todayStr };
}

/** Register dynamic dates for demo plates when user searches "today". */
export function ensureTrajectoryDatesForSearch(startStr: string, endStr: string) {
  const { todayStr, yesterdayStr } = getDefaultTrajectoryDateStrings();
  const dates = new Set<string>();
  let cur = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  while (cur <= end) {
    dates.add(getLocalDateString(cur));
    cur.setDate(cur.getDate() + 1);
  }
  Object.keys(MOCK_TRAJECTORIES).forEach((plate) => {
    const entry = MOCK_TRAJECTORIES[plate];
    const template =
      entry[todayStr] ?? entry['2026-09-03'] ?? entry[yesterdayStr] ?? entry['2026-09-02'] ?? Object.values(entry)[0];
    if (!template) return;
    dates.forEach((d) => {
      if (!entry[d]) entry[d] = template;
    });
  });
}

export function parseCameraIdToNumeric(camera: string): number | null {
  const m = camera.match(/CAM-0*(\d+)/i);
  if (!m) return null;
  return parseInt(m[1], 10);
}

function parseTimeTo24h(raw: string): string {
  const t = raw.trim();
  const ampm = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = ampm[2];
    const ap = ampm[3].toUpperCase();
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  const hm = t.match(/(\d{1,2}):(\d{2})/);
  if (hm) return `${String(parseInt(hm[1], 10)).padStart(2, '0')}:${hm[2]}`;
  return '12:00';
}

export function sequenceFromCameras(
  steps: { camera: string; timestamp: string }[],
): TrajectoryPoint[] {
  return steps
    .map((s) => {
      const id = parseCameraIdToNumeric(s.camera);
      if (id == null) return null;
      return { id, time: parseTimeTo24h(s.timestamp) };
    })
    .filter((x): x is TrajectoryPoint => x !== null);
}
