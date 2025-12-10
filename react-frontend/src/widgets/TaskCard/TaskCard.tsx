// TaskCard.tsx - FIXED в стиле RightSidebar
import React, { useState, useCallback } from 'react';
import Avatar from '@/shared/ui/Avatar.js';
import type { Task, User } from '@/entities/types.js';
import { Token } from '@/app/api/token.js';

const getToken = () => Token.get();

interface TaskCardProps {
  task: Task;
  users: User[];
  onEdit: () => void;
  onUpdate: () => void;
  teamId: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  done: { label: 'Done', color: 'bg-green-100 text-green-800' },
};

const TaskCard: React.FC<TaskCardProps> = ({ task, users, onEdit, onUpdate, teamId }) => {
  const [status, setStatus] = useState(task.progress);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = useCallback(async (newStatus: 'backlog' | 'in_progress' | 'done') => {
    setIsUpdating(true);
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/sign-in';
        return;
      }

      const res = await fetch(`/api/team/${teamId}/tasks/${task.id}/update_progress`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({ 
          progress: newStatus, 
          task: task.task,
          description: task.description,
          user_ids: task.user_ids.map(u => u.id)
        }),
      });

      if (res.ok) {
        setStatus(newStatus);
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [task, teamId, onUpdate]);

  const assignedUsers = task.user_ids
    ?.map((assignedUser) => users.find((u) => u.id === assignedUser.id))  
    .filter(Boolean) as User[] || [];

  return (
    <article className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 h-full">
      <div className="flex justify-between items-start mb-4 gap-3">
        <h3 className="font-bold text-lg leading-tight flex-1 pr-2">{task.task}</h3>
        <div className="flex gap-2 flex-shrink-0">
          <select
            value={status}
            onChange={(e) => updateStatus(e.target.value as 'backlog' | 'in_progress' | 'done')}
            disabled={isUpdating}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 disabled:opacity-50"
          >
            <option value="backlog">Backlog</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200 group-hover:scale-110"
            title="Edit task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
        {task.description}
      </p>

      {assignedUsers.length > 0 && (
        <div className="flex items-center gap-2">
          {assignedUsers.slice(0, 3).map((user) => (
            <Avatar key={user.id} user={user} size="sm" />
          ))}
          {assignedUsers.length > 3 && (
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
              +{assignedUsers.length - 3}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default TaskCard;
