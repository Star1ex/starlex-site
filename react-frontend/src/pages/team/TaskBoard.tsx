// TaskBoard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import TaskCard from '@/widgets/TaskCard/TaskCard.js';
import UserSidebar from '@/widgets/UserSideBar/UserSideBar.js';
import CreateTaskModal from '@/widgets/CreateTaskModal/CreateTaskModal.js';
import EditTaskModal from '@/widgets/EditTaskModal/EditTaskModal.js';
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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`/api/team/${team_id}/tasks`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (res.ok) {
        const data: Task[] = await res.json();
        setTasks(data || []);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
      setTasks([]);
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
      console.error(err);
      setUsers([]);
    }
  }, [team_id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTasks(), fetchUsers()]);
    } finally {
      setLoading(false);
    }
  }, [fetchTasks, fetchUsers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUserRemoved = useCallback((userId: string) => {
    // Оптимистично обновляем UI
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
  }, []);

  const handleViewProfile = useCallback((userId: string) => {
    // Навигация к профилю пользователя
    navigate(`/profile/${userId}`);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!team_id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Team Not Found</h1>
          <a href="/dashboard" className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 z-20">
        <div className="flex justify-between max-w-7xl mx-auto items-center">
          <h1 className="text-xl sm:text-2xl font-bold">Team Tasks</h1>
          <div className="flex gap-2 sm:gap-3 items-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 sm:px-4 py-2 bg-black text-white rounded-lg text-sm sm:text-base hover:bg-gray-900 transition-colors"
            >
              Add Task
            </button>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-3 sm:px-4 py-2 bg-black text-white rounded-lg text-sm sm:text-base hover:bg-gray-900 transition-colors"
            >
              Add User
            </button>
            <button
              className="md:hidden px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              Users
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto">
        <main className="flex-1 p-4 sm:p-6">
          {tasks.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <h3 className="text-lg sm:text-xl font-bold mb-2">No tasks yet</h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 sm:px-6 py-2 sm:py-3 bg-black text-white rounded-xl text-sm sm:text-base hover:bg-gray-900 transition-colors"
              >
                Create Task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  users={users}
                  onEdit={() => {
                    setEditingTask(task);
                    setShowEditModal(true);
                  }}
                  onUpdate={loadData}
                  teamId={team_id}
                />
              ))}
            </div>
          )}
        </main>

        {/* Desktop Sidebar */}
        <UserSidebar 
          users={users} 
          className="hidden lg:block w-72 flex-shrink-0"
          teamId={team_id}
          onUserRemoved={handleUserRemoved}
          onViewProfile={handleViewProfile}
        />

        {/* Mobile Sidebar */}
        {isSidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <UserSidebar
              users={users}
              className="fixed right-0 top-0 h-full w-72 z-40 lg:hidden bg-white shadow-lg transition-transform duration-300"
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
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSuccess={loadData}
        teamId={team_id}
      />
    </div>
  );
};

export default TaskBoard;