import { useEffect, useLayoutEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

type RouteState = {
  background?: unknown;
  preserveScroll?: boolean;
} | null;

function scrollToHash(hash: string): boolean {
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    // Keep the raw hash if the URL contains an invalid escape sequence.
  }

  if (!id) return false;
  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({ block: 'start', inline: 'nearest' });
  return true;
}

function resetPageScroll(hash: string) {
  if (hash && scrollToHash(hash)) return;

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document
    .querySelectorAll<HTMLElement>('[data-route-scroll-root]')
    .forEach((node) => node.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
}

export function RouteScrollManager() {
  const location = useLocation();
  const routeView = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('view') ?? '';
  }, [location.search]);

  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return undefined;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    const state = location.state as RouteState;
    if (state?.background || state?.preserveScroll) return undefined;

    resetPageScroll(location.hash);
    const frame = window.requestAnimationFrame(() => resetPageScroll(location.hash));

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, routeView, location.hash, location.state]);

  return null;
}
