import type { Alert } from '../types/blacklist';

export const MAX_ALERT_TOASTS = 3;
export const TOAST_DURATION_MS = 6000;

export interface AlertToastItem {
  toastId: string;
  alert: Alert;
  createdAt: number;
  durationMs: number;
}
