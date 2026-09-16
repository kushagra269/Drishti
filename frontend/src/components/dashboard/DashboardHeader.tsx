export function DashboardHeader() {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: '#111827', lineHeight: 1.2, margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 14, color: '#667085', marginTop: 3, margin: 0 }}>
          City-wide ANPR and traffic intelligence overview
        </p>
      </div>
    </div>
  );
}
