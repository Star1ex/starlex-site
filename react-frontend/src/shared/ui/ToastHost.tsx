import React, { useEffect, useMemo, useState } from 'react';
import type { ToastKind } from '@/shared/lib/toast.js';

type ToastItem = {
  id: string;
  message: string;
  type: ToastKind;
};

const MAX_TOASTS = 3;
const TOAST_DURATION_MS = 3200;

export const ToastHost: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const ev = event as CustomEvent;
      const detail = ev.detail || {};
      if (!detail?.message) return;
      const toast: ToastItem = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message: detail.message,
        type: detail.type === 'success' ? 'success' : 'error',
      };
      setToasts((prev) => {
        const next = [...prev, toast];
        if (next.length > MAX_TOASTS) {
          return next.slice(next.length - MAX_TOASTS);
        }
        return next;
      });
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, TOAST_DURATION_MS);
    };

    window.addEventListener('appToast', handler as EventListener);
    return () => window.removeEventListener('appToast', handler as EventListener);
  }, []);

  const hasToasts = toasts.length > 0;
  const containerClass = useMemo(
    () => `app-toast-container ${hasToasts ? 'app-toast-container--active' : ''}`,
    [hasToasts]
  );

  if (!hasToasts) return null;

  return (
    <div className={containerClass} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`app-toast app-toast--${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default ToastHost;
