import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Route, X } from 'lucide-react';
import { useNetraStore } from '../../store/netraStore';
import type { AlertToastItem } from '../../types/toast';

function ToastCard({ item }: { item: AlertToastItem }) {
  const navigate = useNavigate();
  const dismissAlertToast = useNetraStore((s) => s.dismissAlertToast);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const started = item.createdAt;
    const duration = item.durationMs;
    let raf = 0;
    let dismissed = false;

    const tick = () => {
      const elapsed = Date.now() - started;
      const left = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(left);
      if (elapsed >= duration) {
        if (!dismissed) {
          dismissed = true;
          dismissAlertToast(item.toastId);
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [item.createdAt, item.durationMs, item.toastId, dismissAlertToast]);

  const alert = item.alert;
  const accent = alert.priority === 'high' ? '#D36868' : alert.priority === 'medium' ? '#D49A46' : '#5C83DA';
  const onDismiss = () => dismissAlertToast(item.toastId);

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{
        width: 360,
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-md)',
        animation: 'slideInRight 0.28s ease-out',
      }}
    >
      <div className="flex items-start gap-3 p-3.5">
        <div
          className="shrink-0 mt-0.5 flex items-center justify-center rounded-md"
          style={{ width: 32, height: 32, backgroundColor: `${accent}22` }}
        >
          <AlertTriangle size={16} color={accent} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 650, color: 'var(--text-primary)' }} className="truncate">
              {alert.title}
            </h4>
            <button
              type="button"
              onClick={onDismiss}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
            >
              <X size={14} />
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }} className="line-clamp-2">
            <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
              {alert.plate}
            </span>
            {' · '}
            {alert.summary}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => {
                onDismiss();
                navigate(`/alerts?alertId=${alert.id}`);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 650, color: 'var(--accent-primary)', padding: 0 }}
            >
              Review Details →
            </button>
            <button
              type="button"
              onClick={() => {
                onDismiss();
                navigate(`/trajectory?plate=${encodeURIComponent(alert.plate)}`);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Route size={12} />
              Trajectory
            </button>
          </div>
        </div>
      </div>
      {/* Countdown border line */}
      <div style={{ height: 3, backgroundColor: 'var(--border-soft)', width: '100%' }}>
        <div
          className="toast-progress"
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: accent,
            transition: 'none',
          }}
        />
      </div>
    </div>
  );
}

export function AlertToastStack() {
  const alertToasts = useNetraStore((s) => s.alertToasts);

  if (!alertToasts.length) return null;

  return (
    <div
      className="fixed z-[10000] flex flex-col gap-2.5"
      style={{ top: 76, right: 20, pointerEvents: 'none' }}
    >
      {alertToasts.map((item) => (
        <div key={item.toastId} style={{ pointerEvents: 'auto' }}>
          <ToastCard item={item} />
        </div>
      ))}
    </div>
  );
}
