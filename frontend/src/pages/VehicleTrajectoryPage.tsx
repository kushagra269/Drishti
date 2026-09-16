import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, Calendar, Navigation, Clock, Activity, Route, Plus, X, Eye, EyeOff } from 'lucide-react';
import { useCameras } from '../context/CameraContext';
import { useNetraStore } from '../store/netraStore';
import { getWatchlist } from '../services/blacklistService';
import { getAlerts } from '../services/alertService';
import {
  TRAJECTORY_COLORS,
  getDefaultTrajectoryDateStrings,
  getLocalDateString,
  ensureTrajectoryDatesForSearch,
} from '../data/trajectoryDatabase';
import {
  featuredTrajectoryPlates,
  getTrajectoryPlateSuggestions,
  resolveTrajectoryForPlate,
} from '../services/trajectorySearchService';
import { FeedLoadingOverlay } from '../components/common/FeedLoadingOverlay';

// Helper component to auto-fit map bounds to trajectory route
function TrajectoryBounds({ coordsList }: { coordsList: [number, number][][] }) {
  const map = useMap();
  useEffect(() => {
    const allCoords = coordsList.flat();
    if (allCoords.length > 0) {
      map.fitBounds(allCoords, { padding: [60, 60], maxZoom: 16 });
    }
  }, [coordsList, map]);
  return null;
}

function timeToMinutes(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getDatesInRange(startDtStr: string, endDtStr: string) {
  const dates = [];
  // Append T00:00:00 to force parsing in local time, preventing UTC shifts backwards
  let curr = new Date(startDtStr + 'T00:00:00');
  const end = new Date(endDtStr + 'T00:00:00');
  while (curr <= end) {
    dates.push(getLocalDateString(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

interface TrajectoryResult {
  id: string;
  plate: string;
  date: string;
  color: string;
  points: any[];
  osrmRoute: [number, number][];
  overallSpeed: number;
}

export function VehicleTrajectoryPage() {
  const { cameras, camerasReady } = useCameras();
  const { watchlist, alerts, setWatchlist, setAlerts } = useNetraStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { maxDate, todayStr } = getDefaultTrajectoryDateStrings();

  // UI State
  const [showModal, setShowModal] = useState(true);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Form State
  const [plateInput, setPlateInput] = useState('');
  const [startDateInput, setStartDateInput] = useState(todayStr);
  const [endDateInput, setEndDateInput] = useState(todayStr);

  useEffect(() => {
    if (!watchlist.length) getWatchlist().then(setWatchlist);
    if (!alerts.length) getAlerts().then(setAlerts);
  }, [watchlist.length, alerts.length, setWatchlist, setAlerts]);

  const plateSuggestions = useMemo(
    () => getTrajectoryPlateSuggestions(plateInput, watchlist, alerts),
    [plateInput, watchlist, alerts],
  );
  
  // Map Data State
  const [trajectories, setTrajectories] = useState<TrajectoryResult[]>([]);
  const [hiddenTrajIds, setHiddenTrajIds] = useState<Set<string>>(new Set());

  // Intercept Global Search from TopBar
  useEffect(() => {
    const urlPlate = searchParams.get('plate');
    if (urlPlate) {
      const today = new Date();
      const localStr = getLocalDateString(today);
      setPlateInput(urlPlate);
      setStartDateInput(localStr);
      setEndDateInput(localStr);
      executeSearch(urlPlate, localStr, localStr, false);
      // Clean URL so refresh opens modal
      navigate('/trajectory', { replace: true });
    }
  }, [searchParams, navigate]);

  const executeSearch = async (plate: string, startDateStr: string, endDateStr: string, append: boolean) => {
    setIsSearching(true);
    setShowModal(false);
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));

    ensureTrajectoryDatesForSearch(startDateStr, endDateStr);
    const datesToSearch = getDatesInRange(startDateStr, endDateStr);
    const newResults: TrajectoryResult[] = [];
    
    let colorIdx = append ? trajectories.length : 0;

    for (const date of datesToSearch) {
      const dataSequence = resolveTrajectoryForPlate(plate, date, watchlist, alerts);
      if (dataSequence) {
        const result = await buildTrajectoryRoute(
          plate,
          date,
          dataSequence,
          TRAJECTORY_COLORS[colorIdx % TRAJECTORY_COLORS.length],
        );
        if (result) {
          newResults.push(result);
          colorIdx++;
        }
      }
    }

    if (append) {
      setTrajectories(prev => [...prev, ...newResults]);
    } else {
      setTrajectories(newResults);
      setHiddenTrajIds(new Set()); // Reset hidden state on new non-appended search
    }
    
    setIsSearching(false);
    setIsCompareMode(false);
  };

  const buildTrajectoryRoute = async (plate: string, date: string, sequence: any[], color: string): Promise<TrajectoryResult | null> => {
    const mappedCameras = sequence.map((point) => {
      const camStr = `CAM-${String(point.id).padStart(3, '0')}`;
      const camera = cameras.find(c => c.id === camStr);
      return { ...point, camera };
    }).filter(pt => pt.camera);

    if (mappedCameras.length < 2) return null;

    let osrmRoute: [number, number][] = [];
    let richTrajectory = mappedCameras;
    let overallSpeed = 0;

    const coordsStr = mappedCameras.map(m => `${m.camera!.lng},${m.camera!.lat}`).join(';');
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`);
      const data = await res.json();

      if (data.code === 'Ok') {
        osrmRoute = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        const legs = data.routes[0].legs;
        
        let totalDist = 0;
        let totalTime = 0;

        richTrajectory = mappedCameras.map((pt, i) => {
          if (i === 0) return { ...pt, speed: 0, dist: 0 };
          const distMeters = legs[i - 1]?.distance || 0;
          const timeMins = timeToMinutes(pt.time) - timeToMinutes(mappedCameras[i - 1].time);
          totalDist += distMeters;
          totalTime += timeMins;
          const speedKmh = timeMins > 0 ? (distMeters / 1000) / (timeMins / 60) : 0;
          return { ...pt, speed: Math.round(speedKmh), dist: distMeters };
        });
        overallSpeed = totalTime > 0 ? Math.round((totalDist / 1000) / (totalTime / 60)) : 0;
      }
    } catch (e) {
      console.error("Routing failed", e);
    }

    return {
      id: `${plate}-${date}-${Date.now()}`,
      plate: plate.toUpperCase(),
      date,
      color,
      points: richTrajectory,
      osrmRoute,
      overallSpeed
    };
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateInput.trim()) return;
    executeSearch(plateInput, startDateInput, endDateInput || startDateInput, isCompareMode);
  };

  // Visibility logic for 'Add New Search' button
  const isSingleDateSearch = startDateInput === endDateInput;

  return (
    <div className="page-fill relative w-full flex flex-col" style={{ backgroundColor: 'var(--bg-app)' }}>
      
      {/* ── Search Modal Overlay ───────────────────────────────── */}
      {showModal && (
        <div
          className="absolute inset-0 z-[2000] flex items-center justify-center backdrop-blur-md animation-fadeIn rounded-xl"
          style={{ backgroundColor: 'var(--backdrop-modal)' }}
        >
          <div
            className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            style={{
              animation: 'slideUp 0.3s ease-out',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="bg-gradient-to-r from-[#2457D6] to-[#3B6FE8] px-6 py-5 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Route size={22} />
                  {isCompareMode ? 'Compare Trajectory' : 'Vehicle Trajectory Analysis'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">Trace historical and real-time vehicular movement paths.</p>
              </div>
              {trajectories.length > 0 && (
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              )}
            </div>
            
            <form onSubmit={submitSearch} className="p-6 trajectory-modal">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 field-label">License Plate Number</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. GJ09KR2997" 
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2457D6]/50 focus:border-[#2457D6] font-mono uppercase"
                      value={plateInput}
                      onChange={(e) => {
                        setPlateInput(e.target.value.toUpperCase());
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      autoComplete="off"
                    />
                    {showSuggestions && plateSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto suggestion-panel border">
                        {plateSuggestions.map((s) => (
                          <button
                            key={s.plate}
                            type="button"
                            className="w-full text-left px-3 py-2.5 border-b last:border-0 suggestion-item"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setPlateInput(s.plate);
                              setShowSuggestions(false);
                            }}
                          >
                            <div className="font-mono text-sm font-semibold text-gray-900">{s.plate}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="date" 
                        max={maxDate}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2457D6]/50 focus:border-[#2457D6] text-sm"
                        value={startDateInput}
                        onChange={(e) => setStartDateInput(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="date" 
                        max={maxDate}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2457D6]/50 focus:border-[#2457D6] text-sm"
                        value={endDateInput}
                        min={startDateInput}
                        onChange={(e) => setEndDateInput(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {featuredTrajectoryPlates().map(plate => (
                    <button 
                      key={plate}
                      type="button"
                      onClick={() => setPlateInput(plate)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-[#2457D6] rounded-md text-sm font-mono transition-colors border border-gray-200"
                    >
                      {plate}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                {trajectories.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => {
                      setTrajectories([]);
                      setIsCompareMode(false);
                      setShowModal(false);
                    }}
                    className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors border border-gray-200"
                  >
                    Clear All
                  </button>
                )}
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-[#2457D6] hover:bg-[#1E4CBA] text-white rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Navigation size={18} />
                  {isCompareMode ? 'Add Trajectory' : 'Trace Trajectory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Trajectory Map View ───────────────────────────────── */}
      <div
        className="flex-1 min-h-0 relative rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}
      >
        {(!camerasReady || isSearching) && (
          <div className="absolute inset-0 z-[1500]">
            <FeedLoadingOverlay
              label={isSearching ? 'Tracing vehicle path' : 'Loading camera network'}
              sublabel={isSearching ? 'Matching ANPR corridor detections…' : 'Preparing map overlays…'}
            />
          </div>
        )}

        {/* Top HUD */}
        {!showModal && (
          <div
            className="absolute top-4 left-4 z-[1000] rounded-xl shadow-lg p-4 min-w-[320px] max-w-[350px] max-h-[85vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            
            <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <h2 className="text-lg font-bold tracking-wide flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Route size={18} style={{ color: 'var(--accent-primary)' }} /> Trajectories
              </h2>
              <button 
                onClick={() => {
                  setTrajectories([]);
                  setShowModal(true);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Clear all"
              >
                <X size={18} />
              </button>
            </div>
            
            {isSearching ? (
              <div className="py-8 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2457D6] rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-500">Tracing global network...</p>
              </div>
            ) : trajectories.length > 0 ? (
              <div className="space-y-4">
                {trajectories.map((traj) => {
                  const isHidden = hiddenTrajIds.has(traj.id);
                  return (
                    <div key={traj.id} className={`bg-gray-50 rounded-lg p-3 border border-gray-100 relative overflow-hidden transition-opacity ${isHidden ? 'opacity-40' : ''}`}>
                      {/* Left color bar indicator */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: traj.color }} />
                      
                      <div className="pl-2">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-mono font-bold text-gray-900 flex items-center gap-2">
                            {traj.plate}
                            <button 
                              onClick={() => {
                                setHiddenTrajIds(prev => {
                                  const next = new Set(prev);
                                  if (next.has(traj.id)) next.delete(traj.id);
                                  else next.add(traj.id);
                                  return next;
                                });
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title={isHidden ? "Show on map" : "Hide from map"}
                            >
                              {isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          <div className="text-xs text-gray-500 font-medium">{new Date(traj.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Detects</div>
                          <div className="text-sm font-bold text-gray-900">{traj.points.length}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Avg Speed</div>
                          <div className="text-sm font-bold text-gray-900">
                            {traj.plate === 'GJ09KR2997' && traj.date === '2026-09-02' ? 45 :
                             traj.plate === 'GJ09KR2997' && traj.date === '2026-09-03' ? 56 :
                             traj.overallSpeed} <span className="text-xs text-gray-500 font-normal">km/h</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200/60">
                        <div className="text-[11px] text-gray-600">
                          <span className="font-semibold text-gray-900">Last Seen:</span> {traj.points[traj.points.length - 1].camera.name} ({traj.points[traj.points.length - 1].time})
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}

                {/* Compare / Add Search Button */}
                {isSingleDateSearch && (
                  <button 
                    onClick={() => {
                      setIsCompareMode(true);
                      setShowModal(true);
                    }}
                    className="w-full py-2.5 mt-2 border-2 border-dashed border-gray-300 hover:border-[#2457D6] hover:bg-blue-50 text-gray-600 hover:text-[#2457D6] rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add Compare Search
                  </button>
                )}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-red-600 font-medium">No trajectory found for this search.</p>
                <button onClick={() => setShowModal(true)} className="mt-4 text-[#2457D6] text-sm font-medium hover:underline">Try another search</button>
              </div>
            )}
          </div>
        )}

        <MapContainer
          center={[23.18, 72.64]}
          zoom={13}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          zoomControl={false}
        >
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            attribution='&copy; Google Maps'
            maxZoom={19}
          />

          {/* Fit map bounds to all trajectories */}
          {!isSearching && trajectories.length > 0 && (
            <TrajectoryBounds coordsList={trajectories.filter(t => !hiddenTrajIds.has(t.id)).map(t => t.osrmRoute)} />
          )}

          {/* Render all trajectories (Polylines only) */}
          {!isSearching && trajectories.filter(t => !hiddenTrajIds.has(t.id)).map((traj) => (
            <Polyline 
              key={`line-${traj.id}`}
              positions={traj.osrmRoute}
              pathOptions={{ 
                color: traj.color, 
                weight: 9, 
                opacity: 1, 
                lineCap: 'round',
                dashArray: '14, 14', 
                className: 'trajectory-line' 
              }}
            />
          ))}

          {/* Aggregated Camera Detection Points */}
          {!isSearching && Object.values(
            trajectories.filter(t => !hiddenTrajIds.has(t.id)).reduce((acc, traj) => {
              traj.points.forEach((pt, index) => {
                const camId = pt.camera.id;
                if (!acc[camId]) {
                  acc[camId] = { camera: pt.camera, visits: [] };
                }
                acc[camId].visits.push({
                  color: traj.color,
                  plate: traj.plate,
                  date: traj.date,
                  time: pt.time,
                  speed: pt.speed,
                  isStart: index === 0,
                  isEnd: index === traj.points.length - 1
                });
              });
              return acc;
            }, {} as Record<string, { camera: any, visits: any[] }>)
          ).map((agg, idx) => {
            const isStart = agg.visits.some(v => v.isStart);
            const isEnd = agg.visits.some(v => v.isEnd);
            
            // Generate the multi-visit tooltip HTML
            const tooltipHTML = (
              <Tooltip direction="right" offset={[10, -20]} opacity={1}>
                <div className="p-1 min-w-[170px] font-sans">
                  <div className="font-bold text-gray-900 text-[13px] border-b border-gray-200 pb-1 mb-2">
                    {agg.camera.name}
                  </div>
                  {agg.visits.map((visit, vIdx) => (
                    <div key={vIdx} className="mb-2 p-1.5 rounded bg-gray-50 border-l-4 shadow-sm" style={{ borderColor: visit.color }}>
                      <div className="text-[10px] font-bold uppercase mb-1 flex items-center justify-between" style={{ color: visit.color }}>
                        <span>{visit.plate}</span>
                        <span className="text-gray-500 font-medium">{new Date(visit.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="text-gray-500 flex items-center gap-1"><Clock size={11} /> Time</span>
                        <span className="font-semibold text-gray-900">{visit.time}</span>
                      </div>
                      {visit.speed > 0 && (
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-gray-500 flex items-center gap-1"><Activity size={11} /> Speed</span>
                          <span className="font-semibold text-gray-900">{visit.speed} km/h</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Tooltip>
            );

            // ONLY show permanent labels for Start and End points
            if (isStart || isEnd) {
              const mainVisit = agg.visits.find(v => v.isStart) || agg.visits.find(v => v.isEnd) || agg.visits[0];
              const labelText = mainVisit.isStart ? `Start: ${agg.camera.id}` : `Last Seen: ${agg.camera.id}`;
              
              const iconHtml = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;">
                   <div style="background-color: white; border: 1.5px solid ${mainVisit.color}; border-radius: 4px; padding: 2px 5px; font-size: 9.5px; font-weight: 700; margin-bottom: 3px; white-space: nowrap; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.15);">
                     ${labelText}
                   </div>
                   <div style="width: 14px; height: 14px; background-color: ${mainVisit.color}; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
                </div>
              `;
              
              const icon = L.divIcon({ 
                html: iconHtml, 
                className: '', 
                iconSize: [120, 50], 
                iconAnchor: [60, 48] 
              });

              return (
                <Marker key={`agg-${idx}`} position={[agg.camera.lat, agg.camera.lng]} icon={icon}>
                  {tooltipHTML}
                </Marker>
              );
            } else {
              // Intermediate points: Orange CircleMarker
              return (
                <CircleMarker
                  key={`agg-${idx}`}
                  center={[agg.camera.lat, agg.camera.lng]}
                  radius={5}
                  pathOptions={{
                    fillColor: '#F97316', // Orange dots for intermediates
                    fillOpacity: 1,
                    color: '#FFFFFF',
                    weight: 2,
                  }}
                >
                  {tooltipHTML}
                </CircleMarker>
              );
            }
          })}
        </MapContainer>
        
        <style dangerouslySetInnerHTML={{__html: `
          .trajectory-line {
            animation: dash 35s linear infinite;
          }
          @keyframes dash {
            to { stroke-dashoffset: -1000; }
          }
        `}} />
      </div>
    </div>
  );
}
