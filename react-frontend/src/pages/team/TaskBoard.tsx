import React, { useState, useEffect, useCallback } from 'react';
import TaskCard from '@/widgets/TaskCard/TaskCard.js';
import UserSidebar from '@/widgets/UserSideBar/UserSideBar.js';
import CreateTaskModal from '@/widgets/CreateTaskModal/CreateTaskModal.js';
import EditTaskModal from '@/widgets/EditTaskModal/EditTaskModal.js';
import TaskDetailModal from '@/widgets/TaskDetailModal/TaskDetailModal.js';
import AddUserModal from '@/widgets/AddUserModal/AddUserModal.js';
import type { Task, User } from '@/entities/types.js';
import { useParams, useNavigate } from 'react-router-dom';
import { Token } from '@/app/api/token.js';

const getToken = () => Token.get();

const TaskBoard: React.FC = () => {
  const { team_id } = useParams<{ team_id: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/sign-in');
      return;
    }
  }, [navigate]);

  const fetchTasks = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const res = await fetch(`/api/team/${team_id}/tasks`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (res.ok) {
        const data: Task[] = await res.json();
        setTasks(Array.isArray(data) ? data : []);
        setError(null);
      } else {
        setTasks([]);
        setError(res.status === 404 ? 'Team not found' : 'Failed to load tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
      setError('Failed to load tasks. Please try again.');
    }
  }, [team_id]);

  const fetchUsers = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`/api/team/${team_id}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (res.ok) {
        const data: User[] = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        setUsers([]);
      }
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

  const handleViewProfile = useCallback((userId: string) => {
    navigate(`/profile/${userId}`);
  }, [navigate]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  }, []);

  const handleTaskDelete = useCallback(async (taskId: string) => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`/api/team/${team_id}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }, [team_id, loadData]);

  const handleEditFromDetail = useCallback(() => {
    if (selectedTask) {
      setEditingTask(selectedTask);
      setShowDetailModal(false);
      setShowEditModal(true);
    }
  }, [selectedTask]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (!team_id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Team Not Found</h1>
          <a href="/dashboard" className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-all duration-200">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <nav className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 z-20">
        <div className="flex justify-between max-w-[1600px] mx-auto items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Team Tasks</h1>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-black text-white rounded-lg text-sm hover:bg-gray-900 transition-all duration-200 font-medium"
            >
              + Add Task
            </button>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-5 py-2.5 bg-gray-100 text-gray-900 rounded-lg text-sm hover:bg-gray-200 transition-all duration-200 font-medium"
            >
              + Add User
            </button>
            <button
              className="lg:hidden px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all duration-200"
              onClick={() => setIsSidebarOpen(true)}
            >
              Users
            </button>
          </div>
        </div>
      </nav>

      {error && (
        <div className="max-w-[1600px] mx-auto px-6 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={() => {
                setError(null);
                loadData();
              }}
              className="text-red-600 hover:text-red-800 font-semibold text-sm ml-4"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row max-w-[1600px] mx-auto">
        <main className="flex-1 px-6 py-6">
          {tasks.length === 0 ? (
            <div className="text-center py-24">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">No tasks yet</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first task for the team.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-black text-white rounded-xl text-base hover:bg-gray-900 transition-all duration-200 font-medium"
                >
                  Create Your First Task
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    users={users}
                    onUpdate={loadData}
                    onClick={() => handleTaskClick(task)}
                    onDelete={() => handleTaskDelete(task.id)}
                    teamId={team_id}
                  />
                ))}
              </div>
            </div>
          )}
        </main>

        <UserSidebar 
          users={users} 
          className="hidden lg:block w-64 flex-shrink-0"
          teamId={team_id}
          onUserRemoved={handleUserRemoved}
          onViewProfile={handleViewProfile}
        />

        {isSidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden animate-fadeIn"
              onClick={() => setIsSidebarOpen(false)}
            />
            <UserSidebar
              users={users}
              className="fixed right-0 top-0 h-full w-64 z-40 lg:hidden bg-white shadow-lg transition-transform duration-300"
              style={{ transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)' }}
              onClose={() => setIsSidebarOpen(false)}
              teamId={team_id}
              onUserRemoved={handleUserRemoved}
              onViewProfile={handleViewProfile}
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
      
      <EditTaskModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        task={editingTask}
        users={users}
        onSuccess={loadData}
        teamId={team_id}
      />
      
      {selectedTask && (
        <TaskDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          users={users}
          onEdit={handleEditFromDetail}
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
