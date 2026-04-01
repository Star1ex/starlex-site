import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Plus, MoreHorizontal, ChevronDown, CheckCircle2 } from 'lucide-react';
import { sprintService, taskService, teamService } from '@/services/api/index.js';
import type { SprintDTO, TaskDTO, SprintStatus } from '@/types/dto.js';
import type { Task, User } from '@/entities/types.js';
import { SPRINT_STATUS_COLOR } from '@/shared/lib/sprint.js';
import { SprintDescriptionModal } from '@/widgets/SprintDescriptionModal/SprintDescriptionModal.js';
import CreateTaskModal from '@/widgets/CreateTaskModal/CreateTaskModal.js';
import TaskCard from '@/widgets/TaskCard/TaskCard.js';
import TeamTaskPanel from '@/widgets/TeamTaskPanel/TeamTaskPanel.js';
import BreadcrumbBack from '@/shared/ui/BreadcrumbBack.js';
import { showToast } from '@/shared/lib/toast.js';
import { useDebounce } from '@/shared/hooks/useDebounce.js';

function toInputDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toTask(dto: TaskDTO): Task {
  return {
    id: dto.id,
    task: dto.task,
    description: dto.description,
    priority: dto.priority,
    progress: dto.progress,
    user_ids: dto.user_ids as Task['user_ids'],
  };
}

const SprintDetailPage: React.FC = () => {
  const { team_id, sprint_id } = useParams<{ team_id: string; sprint_id: string }>();
  const navigate = useNavigate();

  const [sprint, setSprint] = useState<SprintDTO | null>(null);
  // active = not_started | in_progress
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  // done tasks shown in collapsed section
  const [doneTasks, setDoneTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDescription, setShowDescription] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showDone, setShowDone] = useState(false);

  // Inline sprint editing
  const [name, setName] = useState('');
  const isEditingRef = useRef(false);
  const debouncedName = useDebounce(name, 500);
  const lastSavedNameRef = useRef('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const debouncedStart = useDebounce(startDate, 600);
  const debouncedEnd = useDebounce(endDate, 600);
  const lastSavedDatesRef = useRef({ start: '', end: '' });

  const splitTasks = useCallback((all: Task[]) => {
    setActiveTasks(all.filter(t => t.progress !== 'done'));
    setDoneTasks(all.filter(t => t.progress === 'done'));
  }, []);

  const fetchSprint = useCallback(async () => {
    if (!team_id || !sprint_id) return;
    try {
      const data = await sprintService.getSprintById(team_id, sprint_id);
      setSprint(data);
      setName(data.name);
      lastSavedNameRef.current = data.name;
      setStartDate(toInputDate(data.start_date));
      setEndDate(toInputDate(data.end_date));
      lastSavedDatesRef.current = {
        start: toInputDate(data.start_date),
        end: toInputDate(data.end_date),
      };
      const all = Array.isArray(data.tasks) ? data.tasks.map(toTask) : [];
      splitTasks(all);
      setError(null);
    } catch {
      setError('Failed to load sprint');
    }
  }, [team_id, sprint_id, splitTasks]);

  const fetchUsers = useCallback(async () => {
    if (!team_id) return;
    try {
      const data = await teamService.getTeamUsers(team_id);
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    }
  }, [team_id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([fetchSprint(), fetchUsers()]).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [fetchSprint, fetchUsers]);

  // Auto-save name
  useEffect(() => {
    if (!sprint || !isEditingRef.current) return;
    if (debouncedName === lastSavedNameRef.current) return;
    sprintService.updateSprint(team_id!, sprint.id, { name: debouncedName })
      .then(() => { lastSavedNameRef.current = debouncedName; })
      .catch(() => showToast('Failed to save sprint name'));
  }, [debouncedName, sprint, team_id]);

  // Auto-save dates
  useEffect(() => {
    if (!sprint || !isEditingRef.current) return;
    const ref = lastSavedDatesRef.current;
    if (debouncedStart === ref.start && debouncedEnd === ref.end) return;
    sprintService.updateSprint(team_id!, sprint.id, {
      start_date: debouncedStart ? new Date(debouncedStart).toISOString() : null,
      end_date: debouncedEnd ? new Date(debouncedEnd).toISOString() : null,
    })
      .then(() => { lastSavedDatesRef.current = { start: debouncedStart, end: debouncedEnd }; })
      .catch(() => showToast('Failed to save dates'));
  }, [debouncedStart, debouncedEnd, sprint, team_id]);

  // Task created in sprint → link it immediately
  const handleTaskCreated = useCallback(async (created: TaskDTO) => {
    if (!sprint_id) return;
    try {
      await sprintService.moveTaskToSprint(created.id, sprint_id);
    } catch {
      showToast('Task created but could not be linked to sprint');
    }
  }, [sprint_id]);

  // Task updated — when it becomes done, animate it out of active list
  const handleTaskUpdate = useCallback((updated: Task) => {
    if (updated.progress === 'done') {
      // Remove from active with exit animation, add to done
      setActiveTasks(prev => prev.filter(t => t.id !== updated.id));
      setDoneTasks(prev => {
        if (prev.some(t => t.id === updated.id)) return prev.map(t => t.id === updated.id ? updated : t);
        return [...prev, updated];
      });
    } else {
      // Task un-done → move back to active
      setDoneTasks(prev => prev.filter(t => t.id !== updated.id));
      setActiveTasks(prev => {
        if (prev.some(t => t.id === updated.id)) return prev.map(t => t.id === updated.id ? updated : t);
        return [...prev, updated];
      });
    }
    if (selectedTask?.id === updated.id) setSelectedTask(updated);
  }, [selectedTask]);

  const handleTaskDelete = useCallback(async (taskId: string) => {
    setActiveTasks(prev => prev.filter(t => t.id !== taskId));
    setDoneTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await taskService.deleteTeamTask(team_id!, taskId);
    } catch {
      await fetchSprint();
    }
  }, [team_id, fetchSprint]);

  const handleTaskTitleChange = useCallback((id: string, title: string) => {
    setActiveTasks(prev => prev.map(t => t.id === id ? { ...t, task: title } : t));
    setDoneTasks(prev => prev.map(t => t.id === id ? { ...t, task: title } : t));
  }, []);

  const handleStatusAction = async (action: 'start' | 'complete' | 'archive' | 'delete') => {
    if (!sprint || !team_id) return;
    setShowActions(false);
    try {
      if (action === 'delete') {
        await sprintService.deleteSprint(team_id, sprint.id);
        navigate(`/team/${team_id}/sprints`);
        return;
      }
      let updated: SprintDTO;
      if (action === 'start') updated = await sprintService.startSprint(team_id, sprint.id);
      else if (action === 'complete') updated = await sprintService.completeSprint(team_id, sprint.id);
      else updated = await sprintService.archiveSprint(team_id, sprint.id);
      setSprint(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      showToast(msg ?? `Failed to ${action} sprint`);
    }
  };

  if (!team_id || !sprint_id) return null;

  if (loading) {
    return (
      <div className="min-h-full" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-[700px] mx-auto px-6 pt-8 animate-pulse space-y-4">
          <div className="h-3 w-20 rounded" style={{ background: 'var(--bg-secondary)' }} />
          <div className="h-8 w-64 rounded-xl" style={{ background: 'var(--bg-secondary)' }} />
          <div className="h-3 w-40 rounded" style={{ background: 'var(--bg-secondary)' }} />
          <div className="space-y-2 pt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-2xl" style={{ background: 'var(--bg-secondary)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !sprint) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {error ?? 'Sprint not found'}
          </p>
          <button
            onClick={() => navigate(`/team/${team_id}/sprints`)}
            className="text-sm underline"
            style={{ color: 'var(--text-secondary)' }}
          >
            Back to Sprints
          </button>
        </div>
      </div>
    );
  }

  const statusColor = SPRINT_STATUS_COLOR[sprint.status as SprintStatus] ?? '#6b7280';

  return (
    <div
      className="min-h-full font-sans transition-colors"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-[700px] mx-auto px-6 pt-8 pb-20">

        {/* Breadcrumb */}
        <div className="mb-6">
          <BreadcrumbBack label="Sprints" to={`/team/${team_id}/sprints`} />
        </div>

        {/* Sprint header */}
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-3">
            <span
              className="mt-2.5 flex-shrink-0 w-2 h-2 rounded-full"
              style={{ background: statusColor }}
            />
            <input
              value={name}
              onChange={e => { isEditingRef.current = true; setName(e.target.value); }}
              className="flex-1 text-2xl font-bold bg-transparent outline-none leading-tight"
              style={{ color: 'var(--text-primary)' }}
              placeholder="Sprint name"
              maxLength={100}
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap ml-[22px]">
            {/* Dates */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => { isEditingRef.current = true; setStartDate(e.target.value); }}
                className="text-xs px-2 py-1 rounded-lg outline-none"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', colorScheme: 'dark' }}
              />
              {(startDate || endDate) && (
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>→</span>
              )}
              <input
                type="date"
                value={endDate}
                onChange={e => { isEditingRef.current = true; setEndDate(e.target.value); }}
                className="text-xs px-2 py-1 rounded-lg outline-none"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', colorScheme: 'dark' }}
              />
            </div>

            {sprint.goal && (
              <button
                onClick={() => setShowDescription(true)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all duration-150 hover:opacity-70"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                <FileText size={12} />
                Description
              </button>
            )}

            {/* Actions ··· */}
            <div className="relative ml-auto">
              <button
                onClick={() => setShowActions(v => !v)}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-opacity hover:opacity-60"
                style={{ color: 'var(--text-secondary)' }}
              >
                <MoreHorizontal size={16} />
              </button>
              <AnimatePresence>
                {showActions && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 top-9 z-20 min-w-[160px] rounded-2xl overflow-hidden shadow-xl py-1"
                      style={{ background: 'var(--bg-secondary)' }}
                    >
                      {sprint.status === 'planning' && (
                        <button
                          onClick={() => handleStatusAction('start')}
                          className="w-full text-left px-4 py-2.5 text-sm hover:opacity-60"
                          style={{ color: SPRINT_STATUS_COLOR.active }}
                        >
                          Start sprint
                        </button>
                      )}
                      {sprint.status === 'active' && (
                        <button
                          onClick={() => handleStatusAction('complete')}
                          className="w-full text-left px-4 py-2.5 text-sm hover:opacity-60"
                          style={{ color: SPRINT_STATUS_COLOR.completed }}
                        >
                          Complete
                        </button>
                      )}
                      {sprint.status !== 'archived' && (
                        <button
                          onClick={() => handleStatusAction('archive')}
                          className="w-full text-left px-4 py-2.5 text-sm hover:opacity-60"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Archive
                        </button>
                      )}
                      {activeTasks.length + doneTasks.length === 0 && (
                        <>
                          <div className="mx-4 my-1 h-px" style={{ background: 'var(--bg-primary)' }} />
                          <button
                            onClick={() => handleStatusAction('delete')}
                            className="w-full text-left px-4 py-2.5 text-sm hover:opacity-60"
                            style={{ color: '#ef4444' }}
                          >
                            Delete sprint
                          </button>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Active Tasks */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}
            >
              Tasks
              {activeTasks.length > 0 && (
                <span className="ml-1.5 normal-case font-normal">{activeTasks.length}</span>
              )}
            </span>
            <button
              onClick={() => setShowCreateTask(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-150 hover:opacity-70"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              <Plus size={14} />
              New task
            </button>
          </div>

          {activeTasks.length === 0 && doneTasks.length === 0 ? (
            <motion.div
              className="py-14 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-sm" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
                No tasks yet
              </p>
            </motion.div>
          ) : activeTasks.length === 0 ? (
            <motion.div
              className="py-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <CheckCircle2 size={28} className="mx-auto mb-2" style={{ color: SPRINT_STATUS_COLOR.active, opacity: 0.6 }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)', opacity: 0.7 }}>
                All tasks done
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {activeTasks.map((task, i) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      x: 40,
                      scale: 0.96,
                      transition: { duration: 0.28, ease: [0.4, 0, 1, 1] },
                    }}
                    transition={{ duration: 0.18, delay: i * 0.025, ease: 'easeOut' }}
                  >
                    <TaskCard
                      task={task}
                      users={users}
                      onUpdate={handleTaskUpdate}
                      onClick={() => { setSelectedTask(task); setShowTaskPanel(true); }}
                      onDelete={() => handleTaskDelete(task.id)}
                      teamId={team_id}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* Done section */}
        {doneTasks.length > 0 && (
          <div>
            <button
              onClick={() => setShowDone(v => !v)}
              className="flex items-center gap-2 mb-3 transition-opacity hover:opacity-60"
            >
              <CheckCircle2 size={13} style={{ color: SPRINT_STATUS_COLOR.active }} />
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}
              >
                Done
              </span>
              <span className="text-xs ml-0.5" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                {doneTasks.length}
              </span>
              <motion.span
                animate={{ rotate: showDone ? 180 : 0 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex', color: 'var(--text-secondary)' }}
              >
                <ChevronDown size={13} />
              </motion.span>
            </button>

            <AnimatePresence>
              {showDone && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="space-y-2 opacity-60">
                    {doneTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        users={users}
                        onUpdate={handleTaskUpdate}
                        onClick={() => { setSelectedTask(task); setShowTaskPanel(true); }}
                        onDelete={() => handleTaskDelete(task.id)}
                        teamId={team_id}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals */}
      <SprintDescriptionModal
        isOpen={showDescription}
        sprintName={sprint.name}
        description={sprint.goal}
        onClose={() => setShowDescription(false)}
      />

      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        users={users}
        onSuccess={fetchSprint}
        onCreated={handleTaskCreated}
        teamId={team_id}
      />

      {selectedTask && (
        <TeamTaskPanel
          key={selectedTask.id}
          isOpen={showTaskPanel}
          onClose={() => { setShowTaskPanel(false); setSelectedTask(null); }}
          task={selectedTask}
          teamId={team_id}
          onUpdated={handleTaskUpdate}
          onTitleChange={handleTaskTitleChange}
        />
      )}
    </div>
  );
};

export default SprintDetailPage;
