import React, { useState, useRef, useEffect } from 'react';
import Avatar from '@/shared/ui/Avatar.js';
import type { User } from '@/entities/types.js';
import { teamService } from '@/services/api/index.js';

interface UserSidebarProps {
  users: User[];
  className?: string;
  onClose?: () => void;
  style?: React.CSSProperties;
  teamId: string;
  onUserRemoved?: (userId: string) => void;
  onViewProfile?: (userId: string, userData?: User) => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ 
  users, 
  className = '', 
  onClose,
  teamId,
  onUserRemoved,
  onViewProfile
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  const handleUserClick = (userId: string) => {
    setActiveMenu(activeMenu === userId ? null : userId);
  };

  const handleProfileClick = (userId: string) => {
    if (onViewProfile) {
      // Pass user data if available
      const userFromList = users.find(u => u.id === userId);
      onViewProfile(userId, userFromList);
    }
    setActiveMenu(null);
  };

  const handleDeleteClick = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    setDeletingUserId(userId);

    try {
      await teamService.removeUserFromTeam(teamId, userId);

      if (onUserRemoved) {
        onUserRemoved(userId);
      }
    } catch (error) {
      console.error('Error removing user:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove user from team');
    } finally {
      setDeletingUserId(null);
      setActiveMenu(null);
    }
  };

  return (
    <aside className={`bg-white dark:bg-dark-surface ${onClose ? 'border-l border-gray-100 dark:border-dark-border' : ''} flex flex-col transition-colors ${className}`}>
      {onClose && (
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-dark-border">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-500 dark:text-dark-text-muted hover:text-black dark:hover:text-dark-text transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Close</span>
          </button>
        </div>
      )}
      
      <div className="p-2 sm:p-3 flex-1 overflow-y-auto">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-dark-text-muted uppercase tracking-wider mb-2 px-2">Members</h2>
        <div className="space-y-0.5">
          {users.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-dark-text-muted px-2">
              <p className="text-xs">No members</p>
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="transition-all duration-300 ease-in-out">
                <div
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-border transition-colors duration-200 group cursor-pointer"
                  role="listitem"
                  onClick={() => handleUserClick(user.id)}
                >
                  <Avatar user={user} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-dark-text truncate text-xs">
                      {`${user.firstName} ${user.lastName}`}
                    </p>
                  </div>
                  {deletingUserId === user.id && (
                    <div className="w-3 h-3 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-400 rounded-full animate-spin flex-shrink-0" />
                  )}
                </div>

                <div 
                  ref={activeMenu === user.id ? menuRef : null}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    activeMenu === user.id ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="mx-2 sm:mx-3 mb-2 sm:mb-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-md">
                    <button
                      onClick={() => handleProfileClick(user.id)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs sm:text-sm text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border transition-colors flex items-center gap-2 rounded-t-lg"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile</span>
                    </button>
                    <div className="border-t border-gray-100 dark:border-dark-border" />
                    <button
                      onClick={() => handleDeleteClick(user.id)}
                      disabled={deletingUserId === user.id}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-b-lg"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};

export default UserSidebar;