import { useEffect } from 'react';

export default function useOutsideClick<T extends HTMLElement = HTMLElement>(ref: React.RefObject<T | null>, handler: (event: MouseEvent | TouchEvent) => void, when = true) {
  useEffect(() => {
    if (!when) return;
    const onClick = (e: MouseEvent | TouchEvent) => {
      handler(e as MouseEvent);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick);

    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('touchstart', onClick);
    };
  }, [ref, handler, when]);
}
