import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CameraMarker } from '../types/dashboard';
import { DEFAULT_CAMERAS } from '../data/defaultCameras';

const STORAGE_KEY = 'drishti_custom_cameras';
const LEGACY_STORAGE_KEY = 'netra_custom_cameras';

interface CameraContextType {
  cameras: CameraMarker[];
  camerasReady: boolean;
  placementMode: boolean;
  setPlacementMode: (val: boolean) => void;
  addCamera: (lat: number, lng: number) => void;
  clearCameras: () => void;
  resetCameras: () => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

function normalizeCameras(cameras: CameraMarker[]): CameraMarker[] {
  return cameras.map((cam, index) => {
    const cleanId = cam.id?.startsWith('CAM-')
      ? cam.id
      : `CAM-${String(index + 1).padStart(3, '0')}`;
    return {
      ...cam,
      id: cleanId,
      name: cleanId,
      location: cam.location || `${cam.lat.toFixed(5)}° N, ${cam.lng.toFixed(5)}° E`,
      status: cam.status === 'offline' ? 'offline' : 'online',
    };
  });
}

function readStoredCameras(): CameraMarker[] | null {
  try {
    let saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      saved = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) localStorage.setItem(STORAGE_KEY, saved);
    }
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return normalizeCameras(parsed);
  } catch {
    return null;
  }
}

export function CameraProvider({ children }: { children: ReactNode }) {
  const [cameras, setCameras] = useState<CameraMarker[]>([]);
  const [placementMode, setPlacementMode] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = readStoredCameras();
    setCameras(stored ?? normalizeCameras(DEFAULT_CAMERAS));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cameras));
    }
  }, [cameras, loaded]);

  const addCamera = (lat: number, lng: number) => {
    const cleanId = `CAM-${String(cameras.length + 1).padStart(3, '0')}`;
    const newCam: CameraMarker = {
      id: cleanId,
      lat,
      lng,
      status: 'online',
      name: cleanId,
      location: `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`,
    };
    setCameras((prev) => [...prev, newCam]);
  };

  const clearCameras = () => {
    setCameras([]);
  };

  const resetCameras = () => {
    setCameras(normalizeCameras(DEFAULT_CAMERAS));
  };

  return (
    <CameraContext.Provider
      value={{
        cameras,
        camerasReady: loaded,
        placementMode,
        setPlacementMode,
        addCamera,
        clearCameras,
        resetCameras,
      }}
    >
      {children}
    </CameraContext.Provider>
  );
}

export function useCameras() {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error('useCameras must be used within CameraProvider');
  return ctx;
}
