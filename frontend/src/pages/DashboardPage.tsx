import { useEffect, useState } from 'react';
import { LiveCityMap } from '../components/dashboard/LiveCityMap';
import { useNetraStore } from '../store/netraStore';

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const { watchlist, simulateWatchlistHit, injectNewAlert, canPushToast } = useNetraStore();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  // Right-side toast alerts only (no left map popup cards)
  useEffect(() => {
    let cancelled = false;
    let secondTimer: ReturnType<typeof setTimeout> | undefined;
    let thirdTimer: ReturnType<typeof setTimeout> | undefined;

    const firstDelay = 4000 + Math.floor(Math.random() * 2000);
    const firstTimer = setTimeout(() => {
      if (cancelled || !canPushToast()) return;
      const vehicle = watchlist.find((v) => v.status === 'active') ?? watchlist[0];
      if (vehicle) simulateWatchlistHit(vehicle.id);

      const secondDelay = 3000 + Math.floor(Math.random() * 5000);
      secondTimer = setTimeout(() => {
        if (cancelled || !useNetraStore.getState().canPushToast()) return;
        const plates = ['GJ18XY4421', 'GJ05CD5678', 'GJ01AB1234', 'GJ09AB9921'];
        const plate = plates[Math.floor(Math.random() * plates.length)];
        const cam = `CAM-${String([24, 65, 173, 201][Math.floor(Math.random() * 4)]).padStart(3, '0')}`;
        const loc =
          cam === 'CAM-024' ? 'Kudasan' : cam === 'CAM-065' ? 'Sargasan' : cam === 'CAM-201' ? 'Bhaijipura' : 'Randesan';
        const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        injectNewAlert({
          type: 'route_anomaly',
          priority: 'medium',
          status: 'new',
          plate,
          title: 'Route anomaly detected',
          summary: `${cam} · ${loc} · ${timeStr}`,
          whyFlagged: `${plate} followed an unusual corridor sequence near ${loc}.`,
          createdAt: new Date().toISOString(),
          createdAtDisplay: timeStr,
          camera: cam,
          location: loc,
          confidence: 91,
          observedSequence: [
            { camera: 'CAM-024', location: 'Kudasan', timestamp: timeStr, confidence: 90 },
            { camera: cam, location: loc, timestamp: timeStr, confidence: 91 },
          ],
          durationMinutes: 22,
          observationCount: 2,
        });

        thirdTimer = setTimeout(() => {
          if (cancelled || !useNetraStore.getState().canPushToast()) return;
          const v2 = watchlist.find((v) => v.id !== vehicle?.id) ?? watchlist[0];
          if (v2) simulateWatchlistHit(v2.id);
        }, 3500 + Math.floor(Math.random() * 2500));
      }, secondDelay);
    }, firstDelay);

    return () => {
      cancelled = true;
      clearTimeout(firstTimer);
      if (secondTimer) clearTimeout(secondTimer);
      if (thirdTimer) clearTimeout(thirdTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="page-fill"
      style={{
        animation: 'fadeIn 0.4s ease-out',
        padding: '10px 12px 12px',
      }}
    >
      <div
        className="rounded-xl overflow-hidden flex flex-col flex-1 relative"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
          minHeight: 0,
        }}
      >
        <LiveCityMap loading={loading} />
      </div>
    </div>
  );
}
