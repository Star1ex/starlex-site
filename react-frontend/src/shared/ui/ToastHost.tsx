import React from 'react';
import { Toaster } from 'sonner';

/**
 * Glass toast host — sonner `<Toaster>` styled to the material system.
 * Bottom-right, no colored backgrounds: tint comes only from the status
 * icon hue + a 3px left accent bar (see `.sx-toast` in components.css).
 */
export const ToastHost: React.FC = () => (
  <Toaster
    position="bottom-right"
    gap={10}
    offset={20}
    duration={3600}
    toastOptions={{
      unstyled: true,
      classNames: {
        toast: 'sx-toast',
        title: 'sx-toast__title',
        description: 'sx-toast__desc',
        icon: 'sx-toast__icon',
        closeButton: 'sx-toast__close',
      },
    }}
  />
);

export default ToastHost;
