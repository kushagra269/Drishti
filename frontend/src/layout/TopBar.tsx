import { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import {
  Bell, Search, Clock, Moon, Sun,
  LayoutDashboard, Video, Route, BarChart3, ShieldAlert,
} from 'lucide-react';
import { useNetraStore } from '../store/netraStore';
import { applyTheme, getStoredTheme, type ThemeMode } from '../utils/theme';

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      className="flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors"
      style={{
        backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
        color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
      }}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export function TopBar() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { alerts, selectedDateTime, setSelectedDateTime, clearNewAlertId, newAlertId } = useNetraStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());
  const [tempDate, setTempDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tempHour, setTempHour] = useState('12:00');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onTheme = (e: Event) => {
      const detail = (e as CustomEvent<ThemeMode>).detail;
      if (detail === 'light' || detail === 'dark') setTheme(detail);
    };
    window.addEventListener('drishti-theme-changed', onTheme);
    return () => window.removeEventListener('drishti-theme-changed', onTheme);
  }, []);

  useEffect(() => {
    if (newAlertId) {
      const t = setTimeout(() => clearNewAlertId(), 50);
      return () => clearTimeout(t);
    }
  }, [newAlertId, clearNewAlertId]);

  const dateStr = currentTime.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const updatedLabel = selectedDateTime
    ? selectedDateTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const applyTimeFilter = () => {
    const [h, m] = tempHour.split(':');
    const d = new Date(tempDate);
    d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    setSelectedDateTime(d);
    setShowTimePicker(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/trajectory?plate=${search.trim().toUpperCase()}`);
      setSearch('');
    }
  };

  const activeAlertsCount = alerts.filter((a) => a.status === 'new' || a.status === 'acknowledged').length;

  return (
    <header
      className="shrink-0 relative z-[9999]"
      style={{
        backgroundColor: 'var(--topbar-bg)',
        borderBottom: '1px solid var(--topbar-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="DRISHTI Logo" className="h-8 object-contain" />
            <div>
              <h1 style={{ color: 'var(--text-primary)' }} className="font-bold tracking-wide text-lg leading-tight">
                DRISHTI
              </h1>
              <p style={{ color: 'var(--text-muted)' }} className="text-[10px] uppercase font-semibold tracking-wider">
                City Surveillance
              </p>
            </div>
          </div>

          <nav
            className="hidden lg:flex items-center gap-2.5 ml-4 pl-6"
            style={{ borderLeft: '1px solid var(--border-default)' }}
          >
            <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
            <NavItem to="/cameras" icon={<Video size={18} />} label="Cameras" />
            <NavItem to="/trajectory" icon={<Route size={18} />} label="Trajectory" />
            <NavItem to="/analytics" icon={<BarChart3 size={18} />} label="Analytics" />
            <NavItem to="/blacklist" icon={<ShieldAlert size={18} />} label="Blacklist" />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-56 hidden md:block">
            <form onSubmit={handleSearch}>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search license plate..."
                className="w-full h-9 pl-9 pr-4 text-sm rounded-md focus:outline-none"
                style={{
                  backgroundColor: 'var(--topbar-search-bg)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
          </div>

          <div className="w-px h-5 hidden sm:block" style={{ backgroundColor: 'var(--border-default)' }} />

          <div className="hidden xl:flex items-center gap-1.5 text-sm">
            <span style={{ color: 'var(--text-muted)' }} className="whitespace-nowrap font-medium text-[13px]">
              {dateStr}
            </span>

            <div className="relative">
              <button
                onClick={() => setShowTimePicker(!showTimePicker)}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-[13px] font-medium"
                style={{
                  backgroundColor: selectedDateTime ? 'rgba(212,154,70,0.12)' : 'rgba(95,167,124,0.12)',
                  borderColor: selectedDateTime ? 'rgba(212,154,70,0.35)' : 'rgba(95,167,124,0.35)',
                  color: selectedDateTime ? 'var(--color-warning)' : 'var(--color-success)',
                }}
              >
                {!selectedDateTime && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-success)' }} />}
                {selectedDateTime && <Clock size={14} />}
                <span>{selectedDateTime ? 'Historical' : 'Live'}</span>
                <span style={{ color: 'var(--text-muted)' }} className="px-1">-</span>
                <span className="whitespace-nowrap">{updatedLabel}</span>
              </button>

              {showTimePicker && (
                <div
                  className="absolute top-11 right-0 w-64 rounded-lg p-4 z-[9999]"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                    Set Historical Time
                  </h4>
                  <div className="flex flex-col gap-3 mb-4">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Date</label>
                      <input
                        type="date"
                        value={tempDate}
                        onChange={(e) => setTempDate(e.target.value)}
                        className="w-full rounded-md px-3 py-2 text-sm"
                        style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Time</label>
                      <input
                        type="time"
                        value={tempHour}
                        onChange={(e) => setTempHour(e.target.value)}
                        className="w-full rounded-md px-3 py-2 text-sm"
                        style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={applyTimeFilter}
                      className="flex-1 rounded-md py-2 text-sm font-medium text-white"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      Apply
                    </button>
                    {selectedDateTime && (
                      <button
                        onClick={() => {
                          setSelectedDateTime(null);
                          setShowTimePicker(false);
                        }}
                        className="flex-1 rounded-md py-2 text-sm font-medium"
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                      >
                        Reset Live
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative flex items-center justify-center w-9 h-9 rounded-md"
              style={{
                backgroundColor: showDropdown || location.pathname === '/alerts' ? 'var(--accent-subtle)' : 'transparent',
                color: showDropdown || location.pathname === '/alerts' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              <Bell size={18} />
              {activeAlertsCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full"
                  style={{ backgroundColor: 'var(--color-danger)', border: '2px solid var(--topbar-bg)' }}
                >
                  {activeAlertsCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div
                className="absolute right-0 mt-2 w-80 rounded-lg overflow-hidden z-[9999]"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-secondary)' }}
                >
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Alerts</span>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/alerts');
                    }}
                    className="text-xs font-medium"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    View All
                  </button>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {alerts.slice(0, 4).map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        setShowDropdown(false);
                        navigate(`/alerts?alertId=${alert.id}`);
                      }}
                      className="p-4 cursor-pointer"
                      style={{ borderBottom: '1px solid var(--border-soft)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-row-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{alert.plate}</span>
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{alert.createdAtDisplay}</span>
                      </div>
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-danger)' }}>{alert.title}</div>
                      <div className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{alert.summary}</div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No alerts found.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              const next = getStoredTheme() === 'dark' ? 'light' : 'dark';
              applyTheme(next);
              setTheme(next);
            }}
            className="flex items-center justify-center w-9 h-9 rounded-md"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
            }}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <div className="w-px h-6" style={{ backgroundColor: 'var(--border-default)' }} />

          <button onClick={() => navigate('/settings')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              AD
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
