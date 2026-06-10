import { useCallback, useEffect, useState } from 'react';
import { taskService, workspaceService } from '@/services/api/index.js';
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

  return {
    tasks,
    setTasks,
    nextCursor,
    categories,
    members,
    loading,
    refreshCategories,
  };
}
