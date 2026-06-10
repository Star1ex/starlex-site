import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { TaskQueryParams } from '@/types/dto.js';

export function useTaskExplorerUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo<TaskQueryParams>(() => ({
    status:      searchParams.get('status')      ?? undefined,
    priority:    searchParams.get('priority')    ?? undefined,
    project_id:  searchParams.get('project_id')  ?? undefined,
    assignee_id: searchParams.get('assignee_id') ?? undefined,
    label_id:    searchParams.get('label_id')    ?? undefined,
    q:           searchParams.get('q')           ?? undefined,
    sort_by:     (searchParams.get('sort_by') as TaskQueryParams['sort_by']) ?? 'updated_at',
    direction:   (searchParams.get('direction') as TaskQueryParams['direction']) ?? 'desc',
    cursor:      searchParams.get('cursor')      ?? undefined,
  }), [searchParams]);

  const updateParams = useCallback((update: Partial<TaskQueryParams>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(update).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') next.delete(k);
        else next.set(k, String(v));
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const clearParams = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return {
    searchParams,
    params,
    updateParams,
    clearParams,
  };
}
