import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Play, CheckSquare, Archive, Trash2, Plus } from 'lucide-react';
import { sprintService, taskService, teamService } from '@/services/api/index.js';
import type { SprintDTO, TaskDTO, SprintStatus } from '@/types/dto.js';
import type { Task, User } from '@/entities/types.js';
import { SPRINT_STATUS_LABEL, SPRINT_STATUS_COLOR } from '@/shared/lib/sprint.js';

/** Map TaskDTO (API response) to the lightweight Task entity used by widgets. */
function toTask(dto: TaskDTO): Task {
  return {
    id: dto.id,
    task: dto.task,
    description: dto.description,
    priority: dto.priority,
    progress: dto.progress,
    // UserDTO is structurally compatible with TaskUser
    user_ids: dto.user_ids as Task['user_ids'],
  };
}
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

const SprintDetailPage: React.FC = () => {
  const { team_id, sprint_id } = useParams<{ team_id: string; sprint_id: string }>();
  const navigate = useNavigate();
  const [sprint, setSprint] = useState<SprintDTO | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskPanel, setShowTaskPanel] = useState(false);

  // Inline editing
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const isEditingRef = useRef(false);
  const debouncedName = useDebounce(name, 500);
  const debouncedStart = useDebounce(startDate, 600);
  const debouncedEnd = useDebounce(endDate, 600);
  const lastSavedRef = useRef({ name: '', start_date: '', end_date: '' });

  const fetchSprint = useCallback(async () => {
    if (!team_id || !sprint_id) return;
    try {
      const data = await sprintService.getSprintById(team_id, sprint_id);
      setSprint(data);
      setName(data.name);
      setStartDate(toInputDate(data.start_date));
      setEndDate(toInputDate(data.end_date));
      lastSavedRef.current = {
        name: data.name,
        start_date: toInputDate(data.start_date),
        end_date: toInputDate(data.end_date),
      };
      setTasks(Array.isArray(data.tasks) ? data.tasks.map(toTask) : []);
      setError(null);
    } catch {
      setError('Failed to load sprint');
    }
  }, [team_id, sprint_id]);

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

  // Auto-save sprint name/dates on debounce
  useEffect(() => {
    if (!sprint || !isEditingRef.current) return;
    const ref = lastSavedRef.current;
    if (
      debouncedName === ref.name &&
      debouncedStart === ref.start_date &&
      debouncedEnd === ref.end_date
    ) return;

    const save = async () => {
      try {
        const updated = await sprintService.updateSprint(team_id!, sprint.id, {
          name: debouncedName,
          start_date: debouncedStart ? new Date(debouncedStart).toISOString() : null,
          end_date: debouncedEnd ? new Date(debouncedEnd).toISOString() : null,
        });
        setSprint(updated);
        lastSavedRef.current = {
          name: debouncedName,
          start_date: debouncedStart,
          end_date: debouncedEnd,
        };
      } catch {
        showToast('Failed to save sprint changes');
      }
    };
    save();
  }, [debouncedName, debouncedStart, debouncedEnd, sprint, team_id]);

  const handleStatusAction = async (action: 'start' | 'complete' | 'archive' | 'delete') => {
    if (!sprint || !team_id) return;
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

  const handleTaskCreated = async () => {
    await fetchSprint();
  };

  const handleTaskUpdate = useCallback((updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (selectedTask?.id === updated.id) setSelectedTask(updated);
  }, [selectedTask]);

  const handleTaskDelete = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await taskService.deleteTeamTask(team_id!, taskId);
    } catch {
      await fetchSprint();
    }
  }, [team_id, fetchSprint]);

  const handleTaskTitleChange = useCallback((id: string, title: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, task: title } : t)));
  }, []);

  if (!team_id || !sprint_id) return null;

  if (loading) {
    return (
      <div className="min-h-full" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 rounded-xl w-64" style={{ background: 'var(--bg-secondary)' }} />
            <div className="h-6 rounded-xl w-40" style={{ background: 'var(--bg-secondary)' }} />
            <div className="space-y-3 mt-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 rounded-2xl" style={{ background: 'var(--bg-secondary)' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sprint) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>{error ?? 'Sprint not found'}</p>
          <button
            onClick={() => navigate(`/team/${team_id}/sprints`)}
            className="text-sm underline hover:no-underline"
            style={{ color: 'var(--text-secondary)' }}
          >
            Back to Sprints
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-full font-sans transition-colors"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-16">
        {/* Back */}
        <div className="mb-6">
          <BreadcrumbBack label="Sprints" to={`/team/${team_id}/sprints`} />
        </div>

        {/* Sprint name (editable) */}
        <div className="mb-2">
          <input
            value={name}
            onChange={(e) => {
              isEditingRef.current = true;
              setName(e.target.value);
            }}
            className="w-full text-3xl font-bold bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
            placeholder="Sprint name"
            maxLength={100}
          />
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-3 mb-6">
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            {SPRINT_STATUS_LABEL[sprint.status as SprintStatus] ?? sprint.status}
          </span>

          {/* Dates */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                isEditingRef.current = true;
                setStartDate(e.target.value);
              }}
              className="text-xs px-2.5 py-1 rounded-lg outline-none transition-colors"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                colorScheme: 'dark',
              }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>→</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                isEditingRef.current = true;
                setEndDate(e.target.value);
              }}
              className="text-xs px-2.5 py-1 rounded-lg outline-none transition-colors"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                colorScheme: 'dark',
              }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {sprint.goal && (
            <button
              onClick={() => setShowDescription(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 hover:opacity-70"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              <FileText size={14} />
              Description
            </button>
          )}
          {sprint.status === 'planning' && (
            <button
              onClick={() => handleStatusAction('start')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 hover:opacity-70"
              style={{ background: 'var(--bg-secondary)', color: SPRINT_STATUS_COLOR.active }}
            >
              <Play size={14} />
              Start Sprint
            </button>
          )}
          {sprint.status === 'active' && (
            <button
              onClick={() => handleStatusAction('complete')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 hover:opacity-70"
              style={{ background: 'var(--bg-secondary)', color: SPRINT_STATUS_COLOR.completed }}
            >
              <CheckSquare size={14} />
              Complete
            </button>
          )}
          {sprint.status !== 'archived' && (
            <button
              onClick={() => handleStatusAction('archive')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 hover:opacity-70"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              <Archive size={14} />
              Archive
            </button>
          )}
          {tasks.length === 0 && (
            <button
              onClick={() => handleStatusAction('delete')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 hover:opacity-70 ml-auto"
              style={{ background: 'var(--bg-secondary)', color: '#ef4444' }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>

        {/* Tasks section */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Tasks
            {tasks.length > 0 && (
              <span className="ml-2 text-xs">{tasks.length}</span>
            )}
          </span>
          <button
            onClick={() => setShowCreateTask(true)}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-150 hover:opacity-75"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            <Plus size={15} />
            New task
          </button>
        </div>

        {tasks.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No tasks in this sprint yet
            </p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="space-y-2">
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.18, delay: i * 0.03, ease: 'easeOut' }}
                >
                  <TaskCard
                    task={task}
                    users={users}
                    onUpdate={handleTaskUpdate}
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskPanel(true);
                    }}
                    onDelete={() => handleTaskDelete(task.id)}
                    teamId={team_id}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
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
        onSuccess={handleTaskCreated}
        teamId={team_id}
      />

      {selectedTask && (
        <TeamTaskPanel
          key={selectedTask.id}
          isOpen={showTaskPanel}
          onClose={() => {
            setShowTaskPanel(false);
            setSelectedTask(null);
          }}
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
