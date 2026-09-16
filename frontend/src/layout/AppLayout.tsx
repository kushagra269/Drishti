import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { AlertToastStack } from '../components/common/AlertToastStack';

export function AppLayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-app)' }}>
      <TopBar />
      <AlertToastStack />
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col relative z-0" style={{ backgroundColor: 'var(--bg-app)' }}>
        <Outlet />
      </main>
    </div>
  );
}
