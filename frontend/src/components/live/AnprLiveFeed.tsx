import { useEffect, useRef, useState } from 'react';
import { anprStreamUrl, fetchAnprHealth, resolveAnprCameraId } from '../../services/anprFeed';

interface AnprLiveFeedProps {
  uiCameraId: number;
  pollMs?: number;
  onReadyChange?: (ready: boolean) => void;
  onBackendChange?: (alive: boolean) => void;
  className?: string;
}

/**
 * MJPEG-style live view: polls the ANPR backend JPEG endpoint so overlays
 * (boxes, plates, speed) stay in sync with the always-on pipeline.
 */
export function AnprLiveFeed({
  uiCameraId,
  pollMs = 350,
  onReadyChange,
  onBackendChange,
  className,
}: AnprLiveFeedProps) {
  const anprId = resolveAnprCameraId(uiCameraId);
  const [src, setSrc] = useState(() => anprStreamUrl(anprId));
  const [frameOk, setFrameOk] = useState(false);
  const aliveRef = useRef(false);
  const onReadyRef = useRef(onReadyChange);
  const onBackendRef = useRef(onBackendChange);
  onReadyRef.current = onReadyChange;
  onBackendRef.current = onBackendChange;

  useEffect(() => {
    setFrameOk(false);
    onReadyRef.current?.(false);
    setSrc(anprStreamUrl(anprId));
  }, [anprId]);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setSrc(anprStreamUrl(anprId));
    };
    const id = window.setInterval(tick, pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [anprId, pollMs]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const health = await fetchAnprHealth();
      if (cancelled) return;
      if (health.ok !== aliveRef.current) {
        aliveRef.current = health.ok;
        onBackendRef.current?.(health.ok);
      }
    };
    check();
    const id = window.setInterval(check, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [anprId]);

  return (
    <img
      key={anprId}
      src={src}
      alt={`ANPR live ${anprId}`}
      className={className}
      draggable={false}
      onLoad={() => {
        if (!frameOk) {
          setFrameOk(true);
          onReadyRef.current?.(true);
        }
      }}
      onError={() => {
        if (frameOk) {
          setFrameOk(false);
          onReadyRef.current?.(false);
        }
      }}
    />
  );
}
