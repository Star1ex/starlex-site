import { useCallback, useEffect, useState } from 'react';
import { taskService, workspaceService } from '@/services/api/index.js';
import { useTaskRealtime } from '@/shared/hooks/useRealtimeSync.js';
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

  useEffect(() => {
    if (!workspaceId) return;
    let ignore = false;
    workspaceService.listMembers(workspaceId)
      .then((list) => { if (!ignore) setMembers(list); })
      .catch(() => {});
    return () => { ignore = true; };
  }, [workspaceId]);

  const refreshCategories = useCallback(() => {
    if (!workspaceId) return;
    taskService.getTaskCategories(workspaceId)
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
      taskService.queryTasks(workspaceId, params)
        .then((res) => {
          if (ac.signal.aborted) return;
          setTasks(res.tasks);
          setNextCursor(res.next_cursor);
        })
        .catch(() => {})
        .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    });
    return () => ac.abort();
  }, [workspaceId, params]);

  // Live sync: refetch the current page (+ category counts) when any task in
  // this workspace changes. Bursts are debounced inside useTaskRealtime.
  const reload = useCallback(() => {
    if (!workspaceId) return;
    taskService.queryTasks(workspaceId, params)
      .then((res) => { setTasks(res.tasks); setNextCursor(res.next_cursor); })
      .catch(() => {});
    refreshCategories();
  }, [workspaceId, params, refreshCategories]);
  useTaskRealtime(reload);

  const loadMore = useCallback(async () => {
    if (!workspaceId || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await taskService.queryTasks(workspaceId, {
        ...params,
        cursor: nextCursor,
      });
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
    loadMore,
    refreshCategories,
  };
}
