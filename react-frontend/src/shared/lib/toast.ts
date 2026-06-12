import { toast } from 'sonner';

export type ToastKind = 'error' | 'success';

/**
 * App toast API — thin wrapper over sonner's imperative `toast`.
 * Mounting lives in `ToastHost` (sonner `<Toaster>`). Callers keep
 * using `showToast(message, type)`; sonner handles the rest.
 */
export const showToast = (message: string, type: ToastKind = 'error') => {
  if (!message) return;
  if (type === 'success') {
    toast.success(message);
  } else {
    toast.error(message);
  }
};
