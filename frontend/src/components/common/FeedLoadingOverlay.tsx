interface FeedLoadingOverlayProps {
  label?: string;
  sublabel?: string;
}

export function FeedLoadingOverlay({
  label = 'Connecting to camera feed',
  sublabel = 'Establishing secure stream…',
}: FeedLoadingOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
    >
      <div
        className="rounded-full mb-4"
        style={{
          width: 44,
          height: 44,
          border: '3px solid rgba(255,255,255,0.15)',
          borderTopColor: '#60A5FA',
          animation: 'spin 0.85s linear infinite',
        }}
      />
      <p style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 12, color: '#94A3B8', margin: '6px 0 0' }}>{sublabel}</p>
    </div>
  );
}
