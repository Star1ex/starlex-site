import { useEffect, useRef, useState } from 'react';
import { useDebounce } from './useDebounce.js';

export interface UseAutoSaveOptions<T> {
  debounceMs?: number;
  immediate?: boolean;
  initialValue?: T;
}

export function useAutoSave<T = any>(
  taskId: string | undefined | null,
  value: T,
  updateFn: (val: T, signal?: AbortSignal) => Promise<any>,
  options: UseAutoSaveOptions<T> = {}
) {
  const { debounceMs = 500, immediate = false, initialValue } = options;
  const debouncedValue = debounceMs && !immediate ? useDebounce(value, debounceMs) : value;
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<any>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const lastSavedRef = useRef<T | undefined>(initialValue as any);
  const controllerRef = useRef<AbortController | null>(null);

  // Update lastSavedRef when initialValue changes (e.g., after load)
  useEffect(() => {
    if (initialValue !== undefined) {
      lastSavedRef.current = initialValue as any;
    }
  }, [initialValue]);

  useEffect(() => {
    // Validation guard
    if (!taskId || taskId === '' || taskId === 'new' || taskId === 'without-folder') {
      // skip saving for invalid ids
      return;
    }

    const toSave = debouncedValue as T;

    // Skip when value did not change from last saved value
    if (lastSavedRef.current !== undefined && lastSavedRef.current === toSave) {
      return;
    }

    // If updateFn is not a function, skip
    if (typeof updateFn !== 'function') return;

    // Abort previous request if any
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
      } catch (e) {
        // ignore
      }
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    let cancelled = false;

    const run = async () => {
      setIsSaving(true);
      setError(null);
      try {
        await updateFn(toSave, controller.signal);
        if (controller.signal.aborted) return;
        lastSavedRef.current = toSave;
        setLastSavedAt(new Date());
      } catch (err) {
        if ((err as any)?.name === 'AbortError') {
          // aborted, ignore
          cancelled = true;
          return;
        }
        console.error('useAutoSave error', err);
        setError(err);
      } finally {
        if (!cancelled) setIsSaving(false);
      }
    };

    run();

    return () => {
      controller.abort();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, debouncedValue, immediate, updateFn]);

  return { isSaving, error, lastSavedAt };
}
