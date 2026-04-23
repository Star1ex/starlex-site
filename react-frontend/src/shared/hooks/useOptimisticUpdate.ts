import { useState, useCallback } from 'react';

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  rollbackOnError?: boolean;
}

export function useOptimisticUpdate<T>(
  updateFn: () => Promise<T>,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setIsUpdating(true);
    setError(null);

    try {
      const result = await updateFn();
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Update failed');
      setError(error);
      options.onError?.(error);
      
      if (options.rollbackOnError) {
        // Trigger a re-render to rollback optimistic update
        throw error;
      }
      
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [updateFn, options]);

  return { execute, isUpdating, error };
}

