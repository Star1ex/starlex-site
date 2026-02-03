import React, { useEffect, useState, useRef } from 'react';

type VirtualListProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  threshold?: number; // only virtualize when items.length >= threshold
  estimatedItemHeight?: number;
  className?: string;
};

export default function VirtualList<T>({
  items,
  renderItem,
  threshold = 100,
  estimatedItemHeight = 56,
  className,
}: VirtualListProps<T>) {
  const [Virtuoso, setVirtuoso] = useState<any>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    // Try to dynamically import react-virtuoso. If it's not installed, we'll simply fall back.
    if (items.length < threshold) return;

    let cancelled = false;
    (async () => {
      try {
        const mod = await import('react-virtuoso');
        if (cancelled) return;
        // Virtuoso is exported as a named export
        setVirtuoso(() => mod.Virtuoso || mod);
      } catch (err) {
        // Dependency isn't available or failed to load - keep fallback rendering
        // Swallow error to avoid breaking the app
        // eslint-disable-next-line no-console
        console.debug('react-virtuoso not available, falling back to regular list (virtualization skipped)');
      }
    })();

    return () => {
      cancelled = true;
      isMounted.current = false;
    };
    // We intentionally only want to try once when items exceed threshold
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, threshold]);

  if (Virtuoso && items.length >= threshold) {
    const V = Virtuoso;
    return (
      // @ts-ignore - runtime imported component
      <V
        style={{ height: Math.min(items.length * estimatedItemHeight, 600), width: '100%' }}
        totalCount={items.length}
        itemContent={(index: number) => <div key={index}>{renderItem(items[index], index)}</div>}
        className={className}
      />
    );
  }

  // Fallback to classic rendering to preserve exact markup and styles
  return <div className={className}>{items.map((it, i) => <div key={(it as any).id ?? i}>{renderItem(it, i)}</div>)}</div>;
}
