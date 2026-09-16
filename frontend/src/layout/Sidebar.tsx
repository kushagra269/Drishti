import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Video, 
  Route, 
  BarChart3, 
  Bell, 
  ShieldAlert, 
  Settings 
} from 'lucide-react';

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        isActive ? 'bg-[#1E293B] text-white' : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/50'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-[235px] bg-[#0B1120] flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.05)] border-r border-[#1E293B]">
      
      {/* ── Logo ──────────────────────────────────────────────── */}
      <div className="h-[64px] flex items-center px-6 gap-3 shrink-0 border-b border-[#1E293B]">
        <div className="w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-md flex items-center justify-center shadow-md">
          <div className="w-3.5 h-3.5 border-[2px] border-white rounded-full"></div>
        </div>
        <div>
          <h1 className="text-white font-bold tracking-wide text-[16px] leading-tight">DRISHTI</h1>
          <p className="text-[#94A3B8] text-[10px] uppercase font-semibold tracking-wider">City Surveillance</p>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col py-4 justify-between">
        <nav className="px-3 space-y-1">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem to="/cameras" icon={<Video size={20} />} label="Live Cameras" />
          <NavItem to="/trajectory" icon={<Route size={20} />} label="Vehicle Trajectory" />
          <NavItem to="/analytics" icon={<BarChart3 size={20} />} label="Traffic Analytics" />
          <NavItem to="/alerts" icon={<Bell size={20} />} label="Priority Alerts" />
          <NavItem to="/blacklist" icon={<ShieldAlert size={20} />} label="Blacklist" />
        </nav>

        {/* ── Bottom Section ─────────────────────────────────────── */}
        <div className="p-4 mt-auto border-t border-[#1E293B]">
          <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" />
          
          <div className="mt-4 flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1E293B] border border-[#334155]">
            <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center text-white font-bold text-sm shrink-0">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[13px] font-medium text-white truncate">Admin User</p>
              <p className="text-[11px] text-[#94A3B8] truncate">System Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
