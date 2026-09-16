import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMapEvents } from 'react-leaflet';
import { Search } from 'lucide-react';
import type { CameraMarker } from '../../types/dashboard';
import { useCameras } from '../../context/CameraContext';
import { MapToolbar } from './MapToolbar';
import { HeatmapLayer } from './HeatmapLayer';
import { useNetraStore } from '../../store/netraStore';

interface LiveCityMapProps {
  loading?: boolean;
}

function MapClickHandler({ active, onMapClick }: { active: boolean; onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (active) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function getCameraTrafficData(idStr: string, hour: number | null) {
  const idNum = parseInt(idStr.replace('CAM-', ''), 10);

  const severe = [91, 92, 93, 94, 167, 168, 169, 170, 43, 44, 45, 46, 47, 133, 136, 137, 138, 139];
  const heavy = [128, 130, 131, 132, 119, 120, 104, 24, 25];
  const medium = [55, 56, 57, 58, 69, 70, 28, 29, 61, 62, 65, 64, 63, 66, 68, 67, 11, 77, 35, 34, 3, 4, 5, 6];

  let hourMultiplier = 1.0;
  if (hour !== null) {
    if (hour >= 2 && hour < 6) hourMultiplier = 0.1;
    else if (hour >= 6 && hour < 9) hourMultiplier = 0.5;
    else if (hour >= 9 && hour < 12) hourMultiplier = 1.2;
    else if (hour >= 12 && hour < 16) hourMultiplier = 0.7;
    else if (hour >= 16 && hour < 20) hourMultiplier = 1.3;
    else if (hour >= 20 && hour <= 23) hourMultiplier = 0.4;
    else hourMultiplier = 0.2;
  }

  if (severe.includes(idNum)) {
    return {
      intensity: Math.min(1.0, 1.0 * hourMultiplier),
      speed: 18 + (idNum % 7),
      scanned: Math.floor((12400 + ((idNum * 113) % 4000)) * hourMultiplier),
    };
  }
  if (heavy.includes(idNum)) {
    return {
      intensity: Math.min(1.0, 0.65 * hourMultiplier),
      speed: 28 + (idNum % 8),
      scanned: Math.floor((8500 + ((idNum * 97) % 3000)) * hourMultiplier),
    };
  }
  if (medium.includes(idNum)) {
    return {
      intensity: Math.min(1.0, 0.4 * hourMultiplier),
      speed: 40 + (idNum % 12),
      scanned: Math.floor((4500 + ((idNum * 61) % 2000)) * hourMultiplier),
    };
  }
  return {
    intensity: Math.min(1.0, 0.15 * hourMultiplier),
    speed: 55 + (idNum % 15),
    scanned: Math.floor((1500 + ((idNum * 43) % 1500)) * hourMultiplier),
  };
}

/** Google tiles: y = hybrid satellite, m = roadmap */
const TILE_SATELLITE = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
const TILE_ROADMAP = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

export function LiveCityMap({ loading = false }: LiveCityMapProps) {
  const { cameras, camerasReady, placementMode, setPlacementMode, addCamera } = useCameras();
  const { selectedDateTime } = useNetraStore();
  const currentHour =
    selectedDateTime && !isNaN(selectedDateTime.getTime()) ? selectedDateTime.getHours() : null;
  const [showCameras, setShowCameras] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [satelliteOn, setSatelliteOn] = useState(true);
  const [activeCamera, setActiveCamera] = useState<string | null>(null);

  const heatmapPoints = cameras.map((cam) => {
    const { intensity } = getCameraTrafficData(cam.id, currentHour);
    return [cam.lat, cam.lng, intensity] as [number, number, number];
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (cameras.length > 0) {
        const randomCam = cameras[Math.floor(Math.random() * cameras.length)];
        setActiveCamera(randomCam.id);
        setTimeout(() => setActiveCamera(null), 3200);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [cameras]);

  const cameraColor = (cam: CameraMarker) => {
    if (cam.status === 'offline') return '#98A2B3';
    if (cam.id === activeCamera) return '#2457D6';
    return '#3B6FE8';
  };

  const cameraRadius = (cam: CameraMarker) => (cam.id === activeCamera ? 8 : 5);

  if (loading || !camerasReady) {
    return (
      <div className="flex items-center justify-center w-full h-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="text-center">
          <div
            className="rounded-full mx-auto mb-3"
            style={{
              width: 40,
              height: 40,
              border: '3px solid var(--border-default)',
              borderTopColor: 'var(--accent-primary)',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {!camerasReady ? 'Syncing camera network…' : 'Loading city intelligence…'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Gandhinagar corridor map</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <MapContainer
        center={[23.175, 72.645]}
        zoom={13}
        style={{ height: '100%', width: '100%', cursor: placementMode ? 'crosshair' : 'grab' }}
        zoomControl={false}
        className="drishti-map"
      >
        <MapClickHandler active={placementMode} onMapClick={addCamera} />

        <TileLayer
          key={satelliteOn ? 'sat' : 'road'}
          url={satelliteOn ? TILE_SATELLITE : TILE_ROADMAP}
          attribution="&copy; Google Maps"
          maxZoom={19}
        />

        {showHeatmap && heatmapPoints.length > 0 && <HeatmapLayer points={heatmapPoints} />}

        {showCameras &&
          cameras.map((cam) => {
            const { speed, scanned } = getCameraTrafficData(cam.id, currentHour);

            return (
              <CircleMarker
                key={cam.id}
                center={[cam.lat, cam.lng]}
                radius={cameraRadius(cam)}
                pathOptions={{
                  fillColor: cameraColor(cam),
                  fillOpacity: cam.id === activeCamera ? 1 : 0.85,
                  color: '#FFFFFF',
                  weight: cam.id === activeCamera ? 2.5 : 1.5,
                }}
              >
                <Tooltip>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, padding: '4px 6px', minWidth: 160 }}>
                    <div style={{ borderBottom: '1px solid #E6EAF0', paddingBottom: 6, marginBottom: 6 }}>
                      <strong style={{ fontSize: 13, color: '#111827' }}>{cam.id}</strong>
                      <br />
                      <span style={{ color: '#667085', fontSize: 11 }}>{cam.location}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 9.5, color: '#98A2B3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Avg Speed
                        </span>
                        <br />
                        <span style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>
                          {speed} <span style={{ fontSize: 10, color: '#667085' }}>km/h</span>
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: 9.5, color: '#98A2B3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Scanned
                        </span>
                        <br />
                        <span style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>
                          {scanned.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        color: cam.status === 'offline' ? '#DC2626' : '#16A34A',
                        textTransform: 'capitalize',
                        fontWeight: 600,
                        fontSize: 11.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 16, lineHeight: 0.5 }}>•</span> {cam.status}
                    </span>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
      </MapContainer>

      {/* Search + Map Layers stacked on the left */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1000,
          width: 280,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-md)',
            padding: '8px 14px',
            border: '1px solid var(--border-default)',
          }}
        >
          <Search size={17} color="var(--text-muted)" style={{ marginRight: 10 }} />
          <input
            type="text"
            placeholder="Search places..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 13.5,
              color: 'var(--text-primary)',
              background: 'transparent',
            }}
          />
        </div>

        <MapToolbar
          embedded
          showCameras={showCameras}
          onToggleCameras={() => setShowCameras((v) => !v)}
          showHeatmap={showHeatmap}
          onToggleHeatmap={() => setShowHeatmap((v) => !v)}
          satelliteOn={satelliteOn}
          onToggleSatellite={() => setSatelliteOn((v) => !v)}
        />
      </div>

      {placementMode && (
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1100,
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            padding: '12px 24px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            Placement Mode Active: Click anywhere on the map to drop a camera.
          </div>
          <button
            onClick={() => setPlacementMode(false)}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#DC2626',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Finish Drawing
          </button>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 14,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(14,22,32,0.92)',
            border: '1px solid var(--border-default)',
            borderRadius: 5,
            padding: '3px 9px',
            fontSize: 11,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span style={{ color: cameras.length > 0 ? 'var(--color-success)' : 'var(--text-muted)' }}>●</span>
          {cameras.length} cameras connected · Gandhinagar South
          {' · '}
          {satelliteOn ? 'Satellite' : 'Roadmap'}
        </div>
      </div>
    </div>
  );
}
