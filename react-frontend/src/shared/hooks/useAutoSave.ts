import { useEffect, useRef, useState } from 'react';
import { useDebounce } from './useDebounce.js';

export interface UseAutoSaveOptions<T> {
  debounceMs?: number;
  immediate?: boolean;
  initialValue?: T;
}

export function useAutoSave<T = unknown>(
  taskId: string | undefined | null,
  value: T,
  updateFn: (val: T, signal?: AbortSignal) => Promise<unknown>,
  options: UseAutoSaveOptions<T> = {}
) {
  const { debounceMs = 500, immediate = false, initialValue } = options;
  const debouncedCandidate = useDebounce(value, debounceMs);
  const debouncedValue = immediate ? value : debouncedCandidate;
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const lastSavedRef = useRef<T | undefined>(initialValue);
  const controllerRef = useRef<AbortController | null>(null);

  // Update lastSavedRef when initialValue changes (e.g., after load)
  useEffect(() => {
    if (initialValue !== undefined) {
      lastSavedRef.current = initialValue;
    }
  }, [initialValue]);

  useEffect(() => {
    // Validation guard
    if (!taskId || taskId === '' || taskId === 'new') {
      // skip saving for invalid ids
      return;
    }

    const toSave = debouncedValue as T;

    // Skip when value did not change from last saved value
    if (lastSavedRef.current !== undefined && lastSavedRef.current === toSave) {
      return;
    }

    // Abort previous request if any
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
      } catch {
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
        if (err instanceof DOMException && err.name === 'AbortError') {
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
  }, [taskId, debouncedValue, immediate, updateFn]);

  return { isSaving, error, lastSavedAt };
}
