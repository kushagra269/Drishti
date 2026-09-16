import { useMemo, useState } from 'react';
import type { HeatmapCell } from '../../services/analyticsMockService';

interface TrafficHeatmapGridProps {
  cells: HeatmapCell[];
  hourStart: number;
  hourEnd: number;
}

function colorForRatio(t: number): string {
  if (t <= 0) return 'var(--bg-secondary)';
  if (t < 0.15) return '#ECFDF5';
  if (t < 0.3) return '#BBF7D0';
  if (t < 0.45) return '#FDE047';
  if (t < 0.6) return '#FDBA74';
  if (t < 0.75) return '#FB923C';
  if (t < 0.88) return '#F87171';
  return '#DC2626';
}

export function TrafficHeatmapGrid({ cells, hourStart, hourEnd }: TrafficHeatmapGridProps) {
  const [hover, setHover] = useState<{ day: string; hour: number; count: number } | null>(null);

  const dayIndices = [...new Set(cells.map((c) => c.dayIndex))].sort((a, b) => a - b);
  const dayRows = dayIndices.map((dayIndex) => ({
    dayIndex,
    dayLabel: cells.find((c) => c.dayIndex === dayIndex)?.dayLabel ?? '',
  }));
  const hours: number[] = [];
  if (hourStart <= hourEnd) {
    for (let h = hourStart; h <= hourEnd; h++) hours.push(h);
  } else {
    for (let h = hourStart; h <= 23; h++) hours.push(h);
    for (let h = 0; h <= hourEnd; h++) hours.push(h);
  }

  const maxCount = Math.max(1, ...cells.map((c) => c.count));

  const matrix = useMemo(() => {
    const map = new Map<string, number>();
    cells.forEach((c) => map.set(`${c.dayIndex}-${c.hour}`, c.count));
    return map;
  }, [cells]);

  const getCell = (dayIndex: number, hour: number) => matrix.get(`${dayIndex}-${hour}`) ?? 0;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: hours.length * 22 + 88 }}>
        <div className="flex items-end" style={{ paddingLeft: 88, marginBottom: 4, gap: 2 }}>
          {hours.map((h) => (
            <div
              key={h}
              style={{
                width: 20,
                fontSize: 9,
                color: 'var(--text-muted)',
                textAlign: 'center',
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              {h % 2 === 0 ? h : ''}
            </div>
          ))}
        </div>
        {dayRows.map(({ dayIndex, dayLabel }) => (
          <div key={dayIndex} className="flex items-center mb-0.5">
            <div
              style={{
                width: 88,
                fontSize: 10,
                color: 'var(--text-secondary)',
                flexShrink: 0,
                paddingRight: 6,
                lineHeight: 1.15,
              }}
            >
              {dayLabel}
            </div>
            <div className="flex" style={{ gap: 2 }}>
              {hours.map((hour) => {
                const count = getCell(dayIndex, hour);
                const t = count / maxCount;
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    onMouseEnter={() => setHover({ day: dayLabel, hour, count })}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      width: 20,
                      height: 18,
                      borderRadius: 3,
                      backgroundColor: colorForRatio(t),
                      flexShrink: 0,
                      border: '1px solid rgba(15, 23, 42, 0.08)',
                      boxShadow: t > 0.7 ? 'inset 0 0 0 1px rgba(153, 27, 27, 0.15)' : undefined,
                      cursor: 'default',
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2 mt-3" style={{ paddingLeft: 88 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Low</span>
          <div className="flex gap-0.5">
            {['#ECFDF5', '#BBF7D0', '#FDE047', '#FB923C', '#F87171', '#DC2626'].map((c) => (
              <div key={c} style={{ width: 18, height: 8, borderRadius: 2, backgroundColor: c }} />
            ))}
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>High</span>
        </div>

        {/* Fixed-height readout below heatmap — no layout shift */}
        <div
          style={{
            marginTop: 10,
            marginLeft: 88,
            minHeight: 18,
            fontSize: 11,
            color: 'var(--text-secondary)',
            lineHeight: '18px',
          }}
        >
          {hover ? (
            <>
              {hover.day} · {String(hover.hour).padStart(2, '0')}:00 —{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{hover.count.toLocaleString('en-IN')}</strong> vehicles
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Hover a cell to see vehicle count</span>
          )}
        </div>
      </div>
    </div>
  );
}
