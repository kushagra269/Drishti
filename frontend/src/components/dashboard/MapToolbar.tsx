import { Video, Flame, Satellite } from 'lucide-react';

interface MapToolbarProps {
  showCameras: boolean;
  onToggleCameras: () => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  satelliteOn: boolean;
  onToggleSatellite: () => void;
  /** When true, toolbar is in-flow under search (no absolute positioning) */
  embedded?: boolean;
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      style={{
        width: 40,
        height: 22,
        backgroundColor: checked ? 'var(--accent-primary)' : 'var(--border-default)',
        borderRadius: 20,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.25s ease',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 16,
          height: 16,
          backgroundColor: '#FFFFFF',
          borderRadius: '50%',
          transition: 'left 0.25s cubic-bezier(0.4, 0.0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  );
}

function LayerRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--text-primary)',
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        {icon}
        <span>{label}</span>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

export function MapToolbar({
  showCameras,
  onToggleCameras,
  showHeatmap,
  onToggleHeatmap,
  satelliteOn,
  onToggleSatellite,
  embedded = false,
}: MapToolbarProps) {
  return (
    <div
      style={{
        ...(embedded
          ? { position: 'relative', width: '100%' }
          : { position: 'absolute', top: 24, right: 24, zIndex: 1000, minWidth: 200 }),
        backgroundColor: 'var(--bg-elevated)',
        padding: '14px 16px',
        borderRadius: 10,
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Map Layers
      </div>

      <LayerRow
        icon={<Video size={16} color="var(--text-muted)" />}
        label="Cameras"
        checked={showCameras}
        onChange={onToggleCameras}
      />
      <LayerRow
        icon={<Flame size={16} color="var(--text-muted)" />}
        label="Heatmaps"
        checked={showHeatmap}
        onChange={onToggleHeatmap}
      />
      <LayerRow
        icon={<Satellite size={16} color="var(--text-muted)" />}
        label="Satellite"
        checked={satelliteOn}
        onChange={onToggleSatellite}
      />
    </div>
  );
}
