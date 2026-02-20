import React, { useState, useEffect, useCallback } from 'react';
import TaskCard from '@/widgets/TaskCard/TaskCard.js';
import MembersPanel from '@/widgets/MembersPanel/MembersPanel.js';
import CreateTaskModal from '@/widgets/CreateTaskModal/CreateTaskModal.js';
import TeamTaskPanel from '@/widgets/TeamTaskPanel/TeamTaskPanel.js';
import AddUserModal from '@/widgets/AddUserModal/AddUserModal.js';
import type { Task, User } from '@/entities/types.js';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService, teamService } from '@/services/api/index.js';
import BreadcrumbBack from '@/shared/ui/BreadcrumbBack.js';

const TaskBoard: React.FC = () => {
  const { team_id } = useParams<{ team_id: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  useEffect(() => {
    // Auth gate handled by routing; no redirect here
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      if (!team_id) return;
      const data = await taskService.getTeamTasks(team_id);
      setTasks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: unknown) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setError('Team not found');
      } else {
        setError('Failed to load tasks. Please try again.');
      }
    }
  }, [team_id]);

  const fetchUsers = useCallback(async () => {
    try {
      if (!team_id) return;
      const data = await teamService.getTeamUsers(team_id);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    }
  }, [team_id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchTasks(), fetchUsers()]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [fetchTasks, fetchUsers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUserRemoved = useCallback((userId: string) => {
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
  }, []);

  const handleViewProfile = useCallback((userId: string, userData?: User) => {
    // Use passed user data or find in team members
    const userFromTeam = userData || users.find(u => u.id === userId);
    navigate(`/profile/${userId}`, { 
      state: userFromTeam ? { user: userFromTeam } : undefined 
    });
  }, [navigate, users]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowTaskPanel(true);
  }, []);

  const handleTaskDelete = useCallback(async (taskId: string) => {
    // Optimistic update - remove from UI immediately
    setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));

    try {
      if (!team_id) {
        await loadData();
        return;
      }
      await taskService.deleteTeamTask(team_id, taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      // Rollback on error
      await loadData();
    }
  }, [team_id, loadData]);

  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    // Optimistic update - update task in list immediately
    setTasks(prevTasks => 
      prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    );
  }, []);

  const handleTaskTitleChange = useCallback((id: string, title: string) => {
    setTasks(prevTasks =>
      prevTasks.map(t => t.id === id ? { ...t, task: title } : t)
    );
  }, []);

  if (!team_id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-white dark:bg-dark-bg transition-colors">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-dark-text">Team Not Found</h1>
          <p className="text-gray-600 dark:text-dark-text-muted mb-6">The team you're looking for doesn't exist or you don't have access to it.</p>
          <a href="/dashboard" className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-900 dark:hover:bg-gray-200 transition-all duration-200 inline-block">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white dark:bg-dark-bg text-black dark:text-dark-text font-sans transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="mb-3">
          <BreadcrumbBack
            label={sessionStorage.getItem('prevRouteLabel') || 'Dashboard'}
            to={sessionStorage.getItem('prevRoutePath') || '/dashboard'}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-dark-text truncate">Team Tasks</h1>
            {loading && (
              <span className="text-xs text-gray-400 dark:text-dark-text-muted animate-pulse">Syncing…</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddUserModal(true)}
              className="text-sm text-gray-600 dark:text-dark-text-muted hover:text-gray-900 dark:hover:text-dark-text transition-colors"
            >
              Invite
            </button>
            <button
              onClick={() => setShowMembersPanel(true)}
              className="text-sm text-gray-600 dark:text-dark-text-muted hover:text-gray-900 dark:hover:text-dark-text transition-colors"
            >
              Members
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={() => {
                setError(null);
                loadData();
              }}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 gap-4 sm:gap-6">
        {/* Tasks - Full width */}
        {/* Tasks - Right */}
        <main className="flex-1 min-w-0 order-1 mt-2 sm:mt-4">
          <div className="flex items-center justify-between px-2 sm:px-4 mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-dark-text-muted">
              Tasks
            </span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-sm font-medium text-gray-700 dark:text-dark-text hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              + Add Task
            </button>
          </div>
          {tasks.length === 0 ? (
            <div className="text-center py-12 sm:py-24">
              {loading ? (
                <div className="max-w-2xl mx-auto px-4 space-y-4 animate-pulse">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-12 rounded-lg bg-gray-100 dark:bg-dark-surface" />
                  ))}
                </div>
              ) : (
                <div className="max-w-md mx-auto px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-dark-surface rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-dark-text">No tasks yet</h3>
                  <p className="text-gray-600 dark:text-dark-text-muted mb-4 sm:mb-6 text-sm sm:text-base">Get started by creating your first task for the team.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm sm:text-base hover:bg-gray-900 dark:hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Create Your First Task
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-px">
              <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-500 dark:text-dark-text-muted border-b border-gray-200 dark:border-dark-border mb-1 sticky top-[73px] bg-white dark:bg-dark-bg z-10">
                <div className="flex-1 min-w-[120px] sm:min-w-[180px]">Task</div>
                <div className="flex-shrink-0 min-w-[60px] sm:min-w-[72px] text-center">Assignee</div>
                <div className="flex-shrink-0 min-w-[80px] sm:min-w-[90px] text-center">Status</div>
                <div className="flex-shrink-0 min-w-[64px] sm:min-w-[72px] text-center">Priority</div>
                <div className="flex-shrink-0 min-w-[28px] sm:min-w-[30px]"></div>
              </div>
              <div className="overflow-x-auto -mx-2 sm:mx-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <div className="inline-block min-w-full align-middle">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      users={users}
                      onUpdate={handleTaskUpdate}
                      onClick={() => handleTaskClick(task)}
                      onDelete={() => handleTaskDelete(task.id)}
                      teamId={team_id}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {showMembersPanel && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 animate-fadeIn"
              onClick={() => setShowMembersPanel(false)}
            />
            <MembersPanel
              isOpen={showMembersPanel}
              users={users}
              onClose={() => setShowMembersPanel(false)}
              teamId={team_id}
              onUserRemoved={handleUserRemoved}
              onViewProfile={(userId: string, user?: User) => handleViewProfile(userId, user)}
            />
          </>
        )}
      </div>

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        users={users}
        onSuccess={loadData}
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
      
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSuccess={loadData}
        teamId={team_id}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TaskBoard;
