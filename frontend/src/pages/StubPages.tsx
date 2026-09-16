// Stub pages for unused routes

import type { ReactNode } from 'react';

function StubPage({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ minHeight: 'calc(100vh - 64px - 40px)', color: 'var(--text-muted)' }}
    >
      <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.4 }}>{icon}</div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>{title}</h2>
      <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 6 }}>
        This page will be implemented in a subsequent task.
      </p>
    </div>
  );
}

export function VehicleSearchPage() {
  return <StubPage title="Vehicle Search" icon="??" />;
}

export function TrajectoryMapPage() {
  return <StubPage title="Trajectory Map" icon="???" />;
}
