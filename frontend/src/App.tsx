import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CameraProvider } from './context/CameraContext';
import { AppLayout } from './layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LiveCamerasPage } from './pages/LiveCamerasPage';
import { VehicleTrajectoryPage } from './pages/VehicleTrajectoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { RouteAnalyticsPage } from './pages/RouteAnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { BlacklistPage } from './pages/BlacklistPage';

export default function App() {
  return (
    <BrowserRouter>
      <CameraProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="cameras" element={<LiveCamerasPage />} />
            <Route path="trajectory" element={<VehicleTrajectoryPage />} />
            <Route path="analytics" element={<RouteAnalyticsPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="blacklist" element={<BlacklistPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </CameraProvider>
    </BrowserRouter>
  );
}

