// UserSidebar.tsx
import React from 'react';
import Avatar from '@/shared/ui/Avatar.js';
import type { User } from '@/entities/types.js';

interface UserSidebarProps {
  users: User[];
  className?: string;
  onClose?: () => void;
  style?: React.CSSProperties;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ users, className = '', onClose }) => (
  <aside className={`bg-white border-l border-gray-200 w-80 lg:w-80 flex flex-col ${className}`}>
    {onClose && (
      <div className="p-6 border-b border-gray-200">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors"
          aria-label="Close sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Close
        </button>
      </div>
    )}
    
    <div className="p-6 flex-1 overflow-y-auto">
      <h2 className="text-lg font-bold mb-6">TEAM MEMBERS</h2>
      <div className="space-y-3">
        {users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No team members yet</p>
            <p className="text-xs mt-1">Add members to get started</p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 group"
              role="listitem"
            >
              <Avatar user={user} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">{`${user.firstName} ${user.lastName}`}</p>
                <p className="text-xs text-gray-500">Team Member</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </aside>
);

export default UserSidebar;
