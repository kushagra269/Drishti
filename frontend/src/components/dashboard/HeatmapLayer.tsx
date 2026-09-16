import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapLayerProps {
  points: [number, number, number][]; // [lat, lng, intensity]
}

export function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();
  const heatLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    const heatPoints = points.map(([lat, lng, intensity]) => {
      const i = Math.min(1, Math.max(0, intensity));
      // Lift mid/high intensities so orange/red visible at city zoom (~13)
      const scaled = Math.min(1, 0.22 + i * 1.05);
      return [lat, lng, scaled] as [number, number, number];
    });

    const options = {
      radius: 48,
      blur: 30,
      minOpacity: 0.18,
      maxZoom: 18,
      max: 0.88,
      gradient: {
        0.15: '#38bdf8',
        0.35: '#22c55e',
        0.55: '#eab308',
        0.72: '#f97316',
        0.88: '#ef4444',
        1.0: '#dc2626',
      },
    };

    if (!heatLayerRef.current) {
      heatLayerRef.current = (L as any).heatLayer(heatPoints, options).addTo(map);
    } else {
      (heatLayerRef.current as any).setLatLngs(heatPoints);
    }

    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, points]);

  return null;
}
