import { useCallback, useEffect, useState } from 'react';
import { taskService, workspaceService } from '@/services/api/index.js';
import { useTaskRealtime } from '@/shared/hooks/useRealtimeSync.js';
import { getApiErrorMessage } from '@/shared/lib/apiError.js';
import { isRetryableRequestError, loadWithRetry } from '@/shared/lib/loadWithRetry.js';
import type {
  TaskCategoriesResponse,
  TaskDTO,
  TaskQueryParams,
  WorkspaceMemberDTO,
} from '@/types/dto.js';

export function useTaskExplorerQuery(workspaceId: string | undefined, params: TaskQueryParams) {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [categories, setCategories] = useState<TaskCategoriesResponse | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setTasks([]);
    setNextCursor(null);
    setCategories(null);
    setMembers([]);
    setLoadError(null);
    setLoading(Boolean(workspaceId));
    setLoadingMore(false);
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    let ignore = false;
    loadWithRetry(
      () => workspaceService.listMembers(workspaceId),
      { shouldRetry: isRetryableRequestError },
    )
      .then((list) => { if (!ignore) setMembers(list); })
      .catch(() => {});
    return () => { ignore = true; };
  }, [workspaceId]);

  const refreshCategories = useCallback(() => {
    if (!workspaceId) return;
    loadWithRetry(
      () => taskService.getTaskCategories(workspaceId),
      { shouldRetry: isRetryableRequestError },
    )
      .then(setCategories)
      .catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  useEffect(() => {
    if (!workspaceId) return;
    const ac = new AbortController();
    void Promise.resolve().then(() => {
      if (ac.signal.aborted) return;
      setLoading(true);
      setLoadError(null);
      loadWithRetry(
        () => taskService.queryTasks(workspaceId, params),
        { shouldRetry: isRetryableRequestError },
      )
        .then((res) => {
          if (ac.signal.aborted) return;
          setTasks(res.tasks);
          setNextCursor(res.next_cursor);
        })
        .catch((error: unknown) => {
          if (ac.signal.aborted) return;
          setLoadError(getApiErrorMessage(error, 'Failed to load tasks. Please retry.'));
        })
        .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    });
    return () => ac.abort();
  }, [workspaceId, params]);

  // Live sync: refetch the current page (+ category counts) when any task in
  // this workspace changes. Bursts are debounced inside useTaskRealtime.
  const reload = useCallback((options: { showLoading?: boolean; surfaceError?: boolean } = {}) => {
    if (!workspaceId) return;
    if (options.showLoading) setLoading(true);
    setLoadError(null);
    loadWithRetry(
      () => taskService.queryTasks(workspaceId, params),
      { shouldRetry: isRetryableRequestError },
    )
      .then((res) => { setTasks(res.tasks); setNextCursor(res.next_cursor); })
      .catch((error: unknown) => {
        if (options.surfaceError) {
          setLoadError(getApiErrorMessage(error, 'Failed to load tasks. Please retry.'));
        }
      })
      .finally(() => {
        if (options.showLoading) setLoading(false);
      });
    refreshCategories();
  }, [workspaceId, params, refreshCategories]);
  useTaskRealtime(reload);

  const loadMore = useCallback(async () => {
    if (!workspaceId || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await loadWithRetry(
        () => taskService.queryTasks(workspaceId, {
          ...params,
          cursor: nextCursor,
        }),
        { shouldRetry: isRetryableRequestError },
      );
      setTasks((prev) => {
        const seen = new Set(prev.map((task) => task.id));
        const next = [...prev];
        for (const task of res.tasks) {
          if (!seen.has(task.id)) next.push(task);
        }
        return next;
      });
      setNextCursor(res.next_cursor);
    } catch {
      // Keep the already loaded page visible; callers can retry with the same cursor.
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, params, workspaceId]);

  return {
    tasks,
    setTasks,
    nextCursor,
    categories,
    members,
    loading,
    loadingMore,
    loadError,
    reload,
    loadMore,
    refreshCategories,
  };
}
