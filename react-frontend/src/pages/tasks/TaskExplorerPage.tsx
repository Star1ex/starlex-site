import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { taskService, userService } from '@/services/api/index.js';
import { can } from '@/shared/lib/permissions.js';
import { showToast } from '@/shared/lib/toast.js';
import { useWorkspace } from '@/contexts/useWorkspace.js';
import { PageLoadError } from '@/shared/ui/PageLoadState.js';
import { TaskExplorerContent } from './explorer/TaskExplorerContent.js';
import { TaskExplorerHeader } from './explorer/TaskExplorerHeader.js';
import {
  TaskExplorerToolbar,
  type TaskExplorerViewMode,
} from './explorer/TaskExplorerToolbar.js';
import { useTaskExplorerQuery } from './explorer/useTaskExplorerQuery.js';
import { useTaskExplorerUrlState } from './explorer/useTaskExplorerUrlState.js';
import {
  countActiveTaskFilters,
  memberToTaskAssignee,
} from './explorer/taskExplorerUtils.js';
import type { TaskLabelDTO, TaskPriority, TaskStatus } from '@/types/dto.js';

export function TaskExplorerPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace, setActiveWorkspace } = useWorkspace();
  const { searchParams, params, updateParams, clearParams } = useTaskExplorerUrlState();
  const role =
    activeWorkspace && activeWorkspace.id === workspaceId
      ? activeWorkspace.role
      : undefined;
  const canEdit = can.editTask(role);

  const {
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
  } = useTaskExplorerQuery(workspaceId, params);
  const [showRail, setShowRail] = useState(true);
  const [viewMode, setViewMode] = useState<TaskExplorerViewMode>('list');

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localQ, setLocalQ] = useState(searchParams.get('q') ?? '');

  useEffect(() => {
    if (!workspaceId) return;

    if (activeWorkspace?.id === workspaceId && activeWorkspace.role) {
      return;
    }

    let ignore = false;
    userService.getWorkspaces()
      .then((list) => {
        if (ignore) return;
        const next = list.find((w) => w.id === workspaceId) ?? null;
        if (next) setActiveWorkspace(next);
      })
      .catch(() => {});

    return () => { ignore = true; };
  }, [workspaceId, activeWorkspace, setActiveWorkspace]);

  const handleStatusChange = useCallback((id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    refreshCategories();
  }, [refreshCategories, setTasks]);

  const handleTitleChange = useCallback(async (id: string, title: string) => {
    const prevTask = tasks.find((task) => task.id === id);
    if (!prevTask || prevTask.task === title) return;
    setTasks((prev) => prev.map((task) => task.id === id ? { ...task, task: title } : task));
    try {
      await taskService.updateTaskTitle(id, title);
    } catch {
      setTasks((prev) => prev.map((task) => task.id === id ? prevTask : task));
      showToast('Failed to save title');
    }
  }, [tasks, setTasks]);

  const handlePriorityChange = useCallback(async (id: string, priority: TaskPriority) => {
    const prevTask = tasks.find((task) => task.id === id);
    if (!prevTask || prevTask.priority === priority) return;
    setTasks((prev) => prev.map((task) => task.id === id ? { ...task, priority } : task));
    try {
      await taskService.updateTaskPriority(id, priority);
      refreshCategories();
    } catch {
      setTasks((prev) => prev.map((task) => task.id === id ? prevTask : task));
      showToast('Failed to update priority');
    }
  }, [tasks, refreshCategories, setTasks]);

  const handleLabelsChange = useCallback(async (id: string, labels: TaskLabelDTO[]) => {
    const prevTask = tasks.find((task) => task.id === id);
    if (!prevTask) return;
    setTasks((prev) => prev.map((task) => task.id === id ? { ...task, labels } : task));
    try {
      await taskService.setTaskLabels(id, labels.map((label) => label.id));
    } catch {
      setTasks((prev) => prev.map((task) => task.id === id ? prevTask : task));
      showToast('Failed to update labels');
    }
  }, [tasks, setTasks]);

  const handleAssigneeToggle = useCallback(async (id: string, userId: string) => {
    const prevTask = tasks.find((task) => task.id === id);
    if (!prevTask) return;
    const currentIds = (prevTask.assignees ?? []).map((assignee) => assignee.id);
    const nextIds = currentIds.includes(userId)
      ? currentIds.filter((currentId) => currentId !== userId)
      : [...currentIds, userId];
    const nextAssignees = members
      .filter((member) => nextIds.includes(member.user.id))
      .map(memberToTaskAssignee);

    setTasks((prev) => prev.map((task) => task.id === id ? { ...task, assignees: nextAssignees, user_ids: nextIds } : task));
    try {
      await taskService.setTaskAssignees(id, nextIds);
      refreshCategories();
    } catch {
      setTasks((prev) => prev.map((task) => task.id === id ? prevTask : task));
      showToast('Failed to update assignees');
    }
  }, [tasks, members, refreshCategories, setTasks]);

  const handleDueDateChange = useCallback(async (id: string, dueDate: string | null) => {
    const prevTask = tasks.find((task) => task.id === id);
    if (!prevTask || prevTask.due_date === dueDate) return;
    setTasks((prev) => prev.map((task) => task.id === id ? { ...task, due_date: dueDate } : task));
    try {
      await taskService.setTaskDueDate(id, dueDate);
    } catch {
      setTasks((prev) => prev.map((task) => task.id === id ? prevTask : task));
      showToast('Failed to update due date');
    }
  }, [tasks, setTasks]);

  const handleSearch = useCallback((q: string) => {
    setLocalQ(q);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => updateParams({ q: q || undefined, cursor: undefined }), 350);
  }, [updateParams]);

  useEffect(() => () => {
    if (searchRef.current) clearTimeout(searchRef.current);
  }, []);

  const activeFilterCount = countActiveTaskFilters(params);
  const clearAllFilters = useCallback(() => {
    setLocalQ('');
    clearParams();
  }, [clearParams]);

  if (loadError && tasks.length === 0) {
    return (
      <PageLoadError
        message={loadError}
        onRetry={() => reload({ showLoading: true, surfaceError: true })}
      />
    );
  }

  return (
    <div className="tasks-page">
      <TaskExplorerHeader
        taskCount={tasks.length}
        activeFilterCount={activeFilterCount}
        canCreate={can.createTask(role)}
        onCreateTask={() => navigate(`/task/new?workspaceId=${workspaceId}`)}
      />

      <TaskExplorerToolbar
        localQ={localQ}
        activeFilterCount={activeFilterCount}
        showRail={showRail}
        viewMode={viewMode}
        onSearch={handleSearch}
        onToggleRail={() => setShowRail((v) => !v)}
        onViewModeChange={setViewMode}
        onClearAll={clearAllFilters}
      />

      <TaskExplorerContent
        showRail={showRail}
        categories={categories}
        params={params}
        onFilterChange={updateParams}
        loading={loading}
        tasks={tasks}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearAllFilters}
        viewMode={viewMode}
        onTasksChange={setTasks}
        canEdit={canEdit}
        workspaceId={workspaceId ?? ''}
        members={members}
        onStatusChange={handleStatusChange}
        onTitleChange={handleTitleChange}
        onPriorityChange={handlePriorityChange}
        onLabelsChange={handleLabelsChange}
        onAssigneeToggle={handleAssigneeToggle}
        onDueDateChange={handleDueDateChange}
        onOpenTask={(id) => navigate(`/task/${id}`)}
        nextCursor={nextCursor}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}
