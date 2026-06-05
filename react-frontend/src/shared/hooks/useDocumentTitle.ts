import { useEffect } from 'react';

const APP = 'Starlex';

export function useDocumentTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (!title) return;
    document.title = `${title} — ${APP}`;
    return () => { document.title = APP; };
  }, [title]);
}
