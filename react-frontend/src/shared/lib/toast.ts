export type ToastKind = 'error' | 'success';

export const showToast = (message: string, type: ToastKind = 'error') => {
  if (!message) return;
  window.dispatchEvent(
    new CustomEvent('appToast', {
      detail: {
        message,
        type,
      },
    })
  );
};
