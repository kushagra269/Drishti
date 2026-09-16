import { ChevronDown, Filter, X } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { VEHICLE_TYPES, type VehicleType } from '../../data/analyticsRoutes';
import type { AnalyticsFilters } from '../../services/analyticsMockService';

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilters;
  cameraOptions: { id: string; label: string }[];
  onChange: (next: AnalyticsFilters) => void;
}

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseInputDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
}

const HOUR_PRESETS = [
  { id: 'all', label: 'All day', start: 0, end: 23 },
  { id: 'morning', label: 'Morning', start: 6, end: 11 },
  { id: 'afternoon', label: 'Afternoon', start: 12, end: 16 },
  { id: 'evening', label: 'Evening', start: 17, end: 21 },
  { id: 'night', label: 'Night', start: 22, end: 5 },
] as const;

function chipStyle(active: boolean): CSSProperties {
  return {
    height: 32,
    padding: '0 12px',
    borderRadius: 8,
    border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
    backgroundColor: active ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

export function AnalyticsFilterBar({ filters, cameraOptions, onChange }: AnalyticsFilterBarProps) {
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const vehicleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (vehicleRef.current && !vehicleRef.current.contains(e.target as Node)) {
        setVehicleOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toggleVehicle = (type: VehicleType) => {
    const has = filters.vehicleTypes.includes(type);
    let next: VehicleType[];
    if (has) {
      next = filters.vehicleTypes.filter((t) => t !== type);
      if (next.length === 0) next = [type];
    } else {
      next = [...filters.vehicleTypes, type];
    }
    onChange({ ...filters, vehicleTypes: next });
  };

  const vehicleLabel =
    filters.vehicleTypes.length === VEHICLE_TYPES.length
      ? 'All vehicle types'
      : filters.vehicleTypes.join(', ');

  const activeHourPreset =
    HOUR_PRESETS.find((p) => p.start === filters.hourStart && p.end === filters.hourEnd)?.id ?? null;

  return (
    <div
      className="rounded-xl px-4 py-3 flex flex-wrap items-center gap-3"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center gap-2 pr-2" style={{ borderRight: '1px solid var(--border-soft)' }}>
        <Filter size={16} color="var(--accent-primary)" />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Filters</span>
      </div>

      <label className="flex flex-col gap-1">
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>From</span>
        <input
          type="date"
          value={toInputDate(filters.startDate)}
          max={toInputDate(filters.endDate)}
          onChange={(e) => onChange({ ...filters, startDate: parseInputDate(e.target.value) })}
          className="rounded-lg px-2 py-1.5 text-sm"
          style={{ border: '1px solid var(--border-default)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', height: 32 }}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>To</span>
        <input
          type="date"
          value={toInputDate(filters.endDate)}
          min={toInputDate(filters.startDate)}
          onChange={(e) => onChange({ ...filters, endDate: parseInputDate(e.target.value) })}
          className="rounded-lg px-2 py-1.5 text-sm"
          style={{ border: '1px solid var(--border-default)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', height: 32 }}
        />
      </label>

      <div className="flex flex-col gap-1">
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Hour range</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {HOUR_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              style={chipStyle(activeHourPreset === p.id)}
              onClick={() => onChange({ ...filters, hourStart: p.start, hourEnd: p.end })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Camera / zone</span>
        <select
          value={filters.cameraId}
          onChange={(e) => onChange({ ...filters, cameraId: e.target.value })}
          className="rounded-lg px-3 text-sm min-w-[160px]"
          style={{
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-secondary)',
            height: 32,
          }}
        >
          <option value="all">All Cameras</option>
          {cameraOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <div className="relative" ref={vehicleRef}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>
          Vehicle type
        </span>
        <button
          type="button"
          onClick={() => setVehicleOpen((o) => !o)}
          className="rounded-lg px-3 text-sm flex items-center gap-2 min-w-[180px] justify-between"
          style={{
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-secondary)',
            height: 32,
          }}
        >
          <span className="truncate text-left">{vehicleLabel}</span>
          <ChevronDown size={14} color="var(--text-muted)" />
        </button>
        {vehicleOpen && (
          <div
            className="absolute top-full mt-1 right-0 z-50 rounded-lg py-2 min-w-[180px]"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {VEHICLE_TYPES.map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                <input
                  type="checkbox"
                  checked={filters.vehicleTypes.includes(type)}
                  onChange={() => toggleVehicle(type)}
                  className="accent-[#5C83DA]"
                />
                {type}
              </label>
            ))}
            <button
              type="button"
              className="w-full text-left px-3 pt-2 mt-1 text-xs"
              style={{ color: 'var(--accent-primary)', borderTop: '1px solid var(--border-soft)' }}
              onClick={() => onChange({ ...filters, vehicleTypes: [...VEHICLE_TYPES] })}
            >
              Select all
            </button>
          </div>
        )}
      </div>

      {(filters.cameraId !== 'all' ||
        filters.vehicleTypes.length !== VEHICLE_TYPES.length ||
        filters.hourStart !== 0 ||
        filters.hourEnd !== 23) && (
        <button
          type="button"
          onClick={() =>
            onChange({
              ...filters,
              cameraId: 'all',
              hourStart: 0,
              hourEnd: 23,
              vehicleTypes: [...VEHICLE_TYPES],
            })
          }
          className="flex items-center gap-1 text-xs font-medium ml-auto"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={14} />
          Reset filters
        </button>
      )}
    </div>
  );
}
