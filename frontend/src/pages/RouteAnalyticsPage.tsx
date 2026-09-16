import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Camera,
  Car,
  Clock,
  Gauge,
  Route,
  ScanLine,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AnalyticsFilterBar } from '../components/analytics/AnalyticsFilterBar';
import { AnalyticsSection, axisTick, chartTooltipStyle } from '../components/analytics/AnalyticsSection';
import { TrafficHeatmapGrid } from '../components/analytics/TrafficHeatmapGrid';
import { MetricCard } from '../components/dashboard/MetricCard';
import { useCameras } from '../context/CameraContext';
import { OCR_REVIEW_THRESHOLD } from '../data/analyticsRoutes';
import {
  buildAnalyticsDataset,
  defaultAnalyticsFilters,
  type AnalyticsFilters,
} from '../services/analyticsMockService';

const PIE_COLORS = ['#5C83DA', '#5FA77C', '#D49A46', '#A78BFA'];
const ROUTE_LABEL_WIDTH = 200;

function RouteYAxisTick(props: { x?: string | number; y?: string | number; payload?: { value?: string } }) {
  const x = typeof props.x === 'number' ? props.x : Number(props.x ?? 0);
  const y = typeof props.y === 'number' ? props.y : Number(props.y ?? 0);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={4} textAnchor="end" fill="var(--text-muted)" fontSize={10} style={{ whiteSpace: 'nowrap' }}>
        {props.payload?.value ?? ''}
      </text>
    </g>
  );
}

export function RouteAnalyticsPage() {
  const { cameras } = useCameras();
  const [filters, setFilters] = useState<AnalyticsFilters>(() => defaultAnalyticsFilters());

  const cameraIds = useMemo(() => cameras.map((c) => c.id), [cameras]);

  const cameraOptions = useMemo(() => {
    if (cameras.length) return cameras.map((c) => ({ id: c.id, label: c.name || c.id }));
    return [
      { id: 'CAM-065', label: 'CAM-065' },
      { id: 'CAM-024', label: 'CAM-024' },
      { id: 'CAM-173', label: 'CAM-173' },
      { id: 'CAM-043', label: 'CAM-043' },
      { id: 'CAM-201', label: 'CAM-201' },
    ];
  }, [cameras]);

  const data = useMemo(
    () => buildAnalyticsDataset(filters, cameraIds.length ? cameraIds : cameraOptions.map((c) => c.id)),
    [filters, cameraIds, cameraOptions],
  );

  const rangeLabel = `${filters.startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${filters.endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div
      className="page-scroll flex flex-col gap-4 p-4 pb-7"
      style={{ animation: 'fadeIn 0.35s ease-out', maxWidth: 1400, margin: '0 auto', width: '100%' }}
    >
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          <Activity size={22} color="var(--accent-primary)" />
          Analytics
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          City-wide traffic, alerts, and ANPR insights for {rangeLabel}
        </p>
      </div>

      <AnalyticsFilterBar filters={filters} cameraOptions={cameraOptions} onChange={setFilters} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={<Car size={18} />}
          label="Total Vehicles Tracked"
          value={data.kpis.totalVehicles.toLocaleString('en-IN')}
          subtext="Unique detections in range"
          accentColor="#5C83DA"
          trend="up"
          trendLabel="+8.2%"
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label="Total Alerts"
          value={data.kpis.totalAlerts.toLocaleString('en-IN')}
          subtext="Rule & blacklist triggers"
          accentColor="#D36868"
          trend="down"
          trendLabel="-3.1%"
        />
        <MetricCard
          icon={<Clock size={18} />}
          label="Avg Detection-to-Alert Latency"
          value={`${data.kpis.avgLatencySec}s`}
          subtext="End-to-end pipeline"
          accentColor="#D49A46"
          trend="neutral"
          trendLabel="Stable"
        />
        <MetricCard
          icon={<Camera size={18} />}
          label="Active Cameras"
          value={String(data.kpis.activeCameras)}
          subtext={`Of ${cameraOptions.length} in network`}
          accentColor="#5FA77C"
        />
      </div>

      <AnalyticsSection title="Traffic Volume" subtitle="Hourly patterns across the selected days and hour window">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Volume heatmap</p>
            <TrafficHeatmapGrid cells={data.heatmap} hourStart={filters.hourStart} hourEnd={filters.hourEnd} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Daily vehicle count</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.volumeSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5C83DA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#5C83DA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                  <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
                  <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="vehicles" stroke="#5C83DA" strokeWidth={2} fill="url(#volGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </AnalyticsSection>

      <AnalyticsSection title="Alerts Overview" subtitle="Distribution by camera and trend over time">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.alertsByCamera} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={52} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="alerts" fill="#D36868" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.alertsSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="alerts" stroke="#D36868" strokeWidth={2} dot={{ r: 3, fill: '#D36868' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </AnalyticsSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AnalyticsSection title="Vehicle Composition" subtitle="Type mix and detected colors">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.vehicleTypeSplit} dataKey="count" nameKey="type" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
                    {data.vehicleTypeSplit.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.vehicleColorSplit} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="color" width={56} tick={axisTick} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" fill="#5C83DA" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </AnalyticsSection>

        <AnalyticsSection title="Congestion & Speed" subtitle="Average speed by camera and congestion index">
          <div className="grid grid-cols-1 gap-4">
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.speedByCamera} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                  <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
                  <YAxis tick={axisTick} tickLine={false} axisLine={false} unit=" km/h" />
                  <RechartsTooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="avgSpeed" fill="#5FA77C" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.congestionSeries} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                  <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={axisTick} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={chartTooltipStyle} />
                  <Line type="monotone" dataKey="congestionIndex" stroke="#D49A46" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </AnalyticsSection>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AnalyticsSection title="OCR Confidence Distribution" subtitle={`Plate read scores · review threshold ${OCR_REVIEW_THRESHOLD}%`}>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ocrHistogram} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {data.ocrHistogram.map((bin) => (
                    <Cell key={bin.label} fill={bin.binEnd <= OCR_REVIEW_THRESHOLD ? '#D49A46' : '#5C83DA'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(212,154,70,0.12)', border: '1px solid rgba(212,154,70,0.35)' }}>
            <ScanLine size={18} color="#D49A46" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#D49A46' }}>
                {data.ocrFlaggedForReview.toLocaleString('en-IN')} reads flagged for review
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Detections with confidence below {OCR_REVIEW_THRESHOLD}% are queued for operator verification.
              </p>
            </div>
          </div>
        </AnalyticsSection>

        <AnalyticsSection title="Top Routes" subtitle="Most frequent camera-to-camera movements">
          <div style={{ height: 280, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topRoutes} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={ROUTE_LABEL_WIDTH} tick={RouteYAxisTick} axisLine={false} tickLine={false} interval={0} />
                <RechartsTooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" fill="#5C83DA" radius={[0, 4, 4, 0]} barSize={14}>
                  {data.topRoutes.map((_, i) => (
                    <Cell key={i} fill={i < 3 ? '#527BDD' : '#5C83DA'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-2 mt-2" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <Route size={14} />
            Origin → destination pairs ranked by trip count in the filtered window
          </div>
        </AnalyticsSection>
      </div>

      <div className="rounded-lg px-4 py-3 flex items-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-soft)', fontSize: 12, color: 'var(--text-secondary)' }}>
        <Gauge size={14} color="var(--accent-primary)" />
        Metrics refresh when filters change · Timestamps align to IST reporting window
      </div>
    </div>
  );
}
