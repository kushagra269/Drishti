import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, Video, Camera, Activity, AlertCircle } from 'lucide-react';
import { FeedLoadingOverlay } from '../components/common/FeedLoadingOverlay';
import { AnprLiveFeed } from '../components/live/AnprLiveFeed';
import { LiveOcrScannerPanel } from '../components/live/LiveOcrScannerPanel';
import { useCameras } from '../context/CameraContext';
import { CAMERA_LOCATIONS } from '../data/defaultCameras';
import { resolveAnprCameraId } from '../services/anprFeed';

const LOCATIONS = CAMERA_LOCATIONS;

export function LiveCamerasPage() {
  const { camerasReady } = useCameras();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [activeCameraId, setActiveCameraId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [videoReady, setVideoReady] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [backendAlive, setBackendAlive] = useState(false);

  // Intercept camera ID from URL
  useEffect(() => {
    const camParam = searchParams.get('cam');
    if (camParam) {
      const camIdNum = parseInt(camParam.replace('CAM-', ''), 10);
      if (!isNaN(camIdNum)) {
        // Find which location has this camera
        const locationWithCam = LOCATIONS.find(loc => loc.cameras.includes(camIdNum));
        if (locationWithCam) {
          setActiveLocationId(locationWithCam.id);
          setActiveCameraId(camIdNum);
        }
      }
    }
  }, [searchParams]);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredLocations = LOCATIONS.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeLocation = LOCATIONS.find(loc => loc.id === activeLocationId);
  const anprCameraId = activeCameraId != null ? resolveAnprCameraId(activeCameraId) : null;

  useEffect(() => {
    if (activeCameraId) {
      setVideoReady(false);
      setVideoLoading(true);
    } else {
      setVideoReady(false);
      setVideoLoading(false);
    }
  }, [activeCameraId]);

  return (
    <div
      className="page-fill rounded-xl shadow-sm"
      style={{ animation: 'fadeIn 0.3s ease-out', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      {/* Top Header */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-secondary)' }}>
        <h1 className="text-[20px] font-semibold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <Camera style={{ color: 'var(--accent-primary)' }} size={22} />
          Check Live Feeds
        </h1>
      </div>

      {/* 3-Section Split */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* Section 1: Locations List */}
        <div className="w-[300px] min-h-0 flex flex-col shrink-0" style={{ borderRight: '1px solid var(--border-default)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search locations..."
                className="w-full rounded-lg pl-9 pr-3 py-2 text-[13.5px] focus:outline-none"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filteredLocations.map(loc => {
              const isActive = activeLocationId === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => {
                    setActiveLocationId(loc.id);
                    setActiveCameraId(null); // Reset camera when changing location
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg mb-1 flex items-center justify-between transition-all ${
                    isActive ? 'shadow-md' : ''
                  }`}
                  style={{
                    backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                  }}
                >
                  <div>
                    <div className="font-semibold text-[14px]">{loc.name}</div>
                    <div className="text-[11.5px]" style={{ color: isActive ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}>
                      {loc.cameras.length} Nodes
                    </div>
                  </div>
                  {isActive && <ChevronRight size={18} className="text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Cameras List */}
        <div className="w-[280px] min-h-0 flex flex-col shrink-0" style={{ borderRight: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-secondary)' }}>
            <h2 className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>
              {activeLocation ? activeLocation.name : 'Select a location'}
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Available camera feeds
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 relative">
            {/* Visual connector arrows for active location */}
            {activeLocation ? (
              <div className="space-y-1">
                {activeLocation.cameras.map((camId) => {
                  const isActive = activeCameraId === camId;
                  return (
                    <button
                      key={camId}
                      onClick={() => setActiveCameraId(camId)}
                      className="relative w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all"
                      style={{
                        backgroundColor: isActive ? 'var(--bg-selected)' : 'transparent',
                        border: isActive ? '1px solid var(--accent-primary)' : '1px solid transparent',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div className="absolute -left-2 w-2" style={{ borderTop: '1px solid var(--border-default)' }} />
                      
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                          color: isActive ? '#fff' : 'var(--text-muted)',
                        }}
                      >
                        <Video size={14} />
                      </div>
                      <div>
                        <div className="font-medium text-[13.5px]">CAM-{String(camId).padStart(3, '0')}</div>
                        <div className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} /> Live feed active
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center" style={{ color: 'var(--text-muted)' }}>
                <Search size={32} className="mb-3 opacity-50" />
                <p className="text-[13.5px]">Select a location from the left to view its cameras.</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Live feed + ANPR */}
        <div className="flex-1 flex flex-col relative min-h-0 overflow-hidden" style={{ backgroundColor: 'var(--feed-stage-bg)' }}>
          {!camerasReady && (
            <FeedLoadingOverlay label="Loading camera network" sublabel="Preparing live feed endpoints…" />
          )}
          {activeCameraId ? (
            <>
              <div className="relative basis-1/2 shrink-0 min-h-0 flex flex-col">
                {(videoLoading || !videoReady) && (
                  <FeedLoadingOverlay
                    label={`Opening CAM-${String(activeCameraId).padStart(3, '0')}`}
                    sublabel={
                      backendAlive
                        ? 'Syncing ANPR live stream…'
                        : 'Waiting for ANPR backend on :8080…'
                    }
                  />
                )}
                <div className="absolute top-0 left-0 right-0 p-3 z-10 flex justify-between items-start pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white font-mono text-[12px] tracking-wide">
                      LIVE · CAM-{String(activeCameraId).padStart(3, '0')}
                    </span>
                  </div>
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5">
                    <span className="text-white/80 font-mono text-[11px]">
                      {currentTime.toLocaleTimeString('en-IN')}
                      {anprCameraId ? ` · ${anprCameraId}` : ''}
                    </span>
                  </div>
                </div>

                <AnprLiveFeed
                  uiCameraId={activeCameraId}
                  className="w-full h-full object-cover flex-1 min-h-[180px] bg-black"
                  onReadyChange={(ready) => {
                    setVideoReady(ready);
                    setVideoLoading(!ready);
                  }}
                  onBackendChange={setBackendAlive}
                />

                <div className="absolute bottom-0 left-0 right-0 p-3 z-10 bg-gradient-to-t from-black/75 to-transparent pointer-events-none">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2 text-white/90">
                      <Activity size={14} className={backendAlive ? 'text-green-400' : 'text-amber-400'} />
                      <span className="text-[12px] font-medium">
                        {backendAlive ? 'Link stable' : 'Backend reconnecting'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <AlertCircle size={14} className="text-sky-400" />
                      <span className="text-[12px] font-medium">ANPR active</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="basis-1/2 shrink-0 min-h-0 flex flex-col">
                <LiveOcrScannerPanel
                  cameraId={activeCameraId}
                  locationName={activeLocation?.name}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
              <Video size={48} className="mb-4 opacity-30" />
              <p className="text-[15px] font-medium" style={{ color: 'var(--text-secondary)' }}>No Camera Selected</p>
              <p className="text-[13px] mt-1">Select a camera feed from the middle panel</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
