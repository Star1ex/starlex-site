import React, { useState, useEffect, useCallback } from 'react';
import TaskCard from '@/widgets/TaskCard/TaskCard.js';
import UserSidebar from '@/widgets/UserSideBar/UserSideBar.js';
import CreateTaskModal from '@/widgets/CreateTaskModal/CreateTaskModal.js';
import EditTaskModal from '@/widgets/EditTaskModal/EditTaskModal.js';
import AddUserModal from '@/widgets/AddUserModal/AddUserModal.js';
import type { Task, User } from '@/entities/types.js';
import { useParams } from 'react-router-dom';
import { Token } from '@/app/api/token.js'; 

const getToken = () => Token.get(); 

const TaskBoard: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`/api/team/${teamId}/tasks`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (res.ok) {
        const data: Task[] = await res.json();
        setTasks(data || []);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setTasks([]);
    }
  }, [teamId]);

  const fetchUsers = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`/api/team/${teamId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (res.ok) {
        const data: User[] = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
    }
  }, [teamId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTasks(), fetchUsers()]);
    setLoading(false);
  }, [fetchTasks, fetchUsers]);

  useEffect(() => {
    if (teamId) loadData();
  }, [teamId, loadData]);

  if (!teamId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Not Found</h1>
          <a href="/dashboard" className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4 md:px-8">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Team Tasks</h1>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-all duration-200 min-h-[44px]"
            >
              Add Task
            </button>
            <button 
              onClick={() => setShowAddUserModal(true)} 
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-all duration-200 min-h-[44px]"
            >
              Add User
            </button>
            <button 
              className="md:hidden px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-all duration-200 min-h-[44px]" 
              onClick={() => setIsSidebarOpen(true)}
            >
              Users
            </button>
          </div>
        </div>
      </nav>

      <div className="flex max-w-7xl mx-auto">
        <main className="flex-1 p-6 md:p-8">
          {tasks.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first task.</p>
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition-all duration-200 min-h-[44px]"
              >
                Create Task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  teamId={teamId}
                />
              ))}
            </div>
          )}
        </main>

        <UserSidebar users={users} className="hidden lg:block" />

        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" 
              onClick={() => setIsSidebarOpen(false)} 
            />
            <UserSidebar
              users={users}
              className="fixed right-0 top-0 h-full w-80 z-40 lg:hidden transform translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out"
              style={{ transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)' }}
              onClose={() => setIsSidebarOpen(false)}
            />
          </>
        )}
      </div>

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        users={users}
        onSuccess={loadData}
        teamId={teamId}
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
        teamId={teamId}
      />
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSuccess={loadData}
        teamId={teamId}
      />
    </div>
  );
};

export default TaskBoard;
