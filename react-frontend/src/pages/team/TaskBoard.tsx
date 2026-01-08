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
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
  }, []);

  const handleViewProfile = useCallback((userId: string) => {
    navigate(`/profile/${userId}`);
  }, [navigate]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  }, []);

  const handleEditFromDetail = useCallback(() => {
    if (selectedTask) {
      setEditingTask(selectedTask);
      setShowDetailModal(false);
      setShowEditModal(true);
    }
  }, [selectedTask]);

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
          <a href="/dashboard" className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-all duration-200">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <nav className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 z-20 transition-all duration-200">
        <div className="flex justify-between max-w-7xl mx-auto items-center">
          <h1 className="text-xl sm:text-2xl font-bold">Team Tasks</h1>
          <div className="flex gap-2 sm:gap-3 items-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 sm:px-4 py-2 bg-black text-white rounded-lg text-sm sm:text-base hover:bg-gray-900 transition-all duration-200 hover:scale-105"
            >
              Add Task
            </button>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-3 sm:px-4 py-2 bg-black text-white rounded-lg text-sm sm:text-base hover:bg-gray-900 transition-all duration-200 hover:scale-105"
            >
              Add User
            </button>
            <button
              className="md:hidden px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all duration-200 hover:scale-105"
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
            <div className="text-center py-16 sm:py-20 animate-fadeIn">
              <h3 className="text-lg sm:text-xl font-bold mb-2">No tasks yet</h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 sm:px-6 py-2 sm:py-3 bg-black text-white rounded-xl text-sm sm:text-base hover:bg-gray-900 transition-all duration-200 hover:scale-105"
              >
                Create Task
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  users={users}
                  onUpdate={loadData}
                  onClick={() => handleTaskClick(task)}
                />
              ))}
            </div>
          )}
        </main>

        <UserSidebar 
          users={users} 
          className="hidden lg:block w-72 flex-shrink-0"
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