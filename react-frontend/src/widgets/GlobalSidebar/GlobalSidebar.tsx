import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Avatar from '@/shared/ui/Avatar.js';
import { getAuthUser } from '@/shared/lib/authManager.js';
import { userService } from '@/services/api/index.js';
import { useTheme } from '@/shared/contexts/ThemeContext.js';
import type { User } from '@/entities/types.js';

interface GlobalSidebarProps {
  className?: string;
}



export const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<{ firstName: string; lastName: string; email?: string } | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userService) return; // safety

    const storedUser = getAuthUser();
    if (storedUser && storedUser.firstName) {
      const firstName = storedUser.firstName || '';
      const lastName = storedUser.lastName || '';
      const email = storedUser.email || '';
      setUserInfo({ firstName, lastName, email });
    }

    const fetchUser = async () => {
      try {
        const data = await userService.getProfile();
        setUser(data as unknown as User);
        const firstName = data.firstName || '';
        const lastName = data.lastName || '';
        const email = data.email || '';
        if (firstName || lastName) {
          setUserInfo({ firstName, lastName, email });
        }
      } catch (err: any) {
        if (err?.response?.status === 401) {
          navigate('/sign-in');
        } else {
          console.error('Error fetching user:', err);
        }
      }
    };

    const fetchTeams = async () => {
      try {
        const data = await userService.getTeams();
        setTeams(Array.isArray(data) ? data.map((t: any) => ({ id: t.id, name: t.name })) : []);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          navigate('/sign-in');
        } else {
          console.error('Error fetching teams:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    fetchTeams();

    // Listen for team creation events to refresh teams list
    const handleTeamCreated = () => {
      fetchTeams();
    };
    window.addEventListener('teamCreated', handleTeamCreated);
    
    return () => {
      window.removeEventListener('teamCreated', handleTeamCreated);
    };
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Prioritize user data from API over token
  const displayName = user 
    ? `${(user as any).firstName || (user as any).first_name || ''}${((user as any).lastName || (user as any).last_name) ? ` ${(user as any).lastName || (user as any).last_name}` : ''}`.trim() || 'User'
    : (userInfo 
      ? `${userInfo.firstName || ''}${userInfo.lastName ? ` ${userInfo.lastName}` : ''}`.trim() || 'User'
      : 'User');
  const displayEmail = (user as any)?.email || userInfo?.email || '';

  return (
    <aside className={`bg-white dark:bg-dark-surface border-r border-gray-100 dark:border-dark-border w-64 flex flex-col h-full transition-colors ${className}`}>
      {/* User Workspace Header */}
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">{displayName}'s</span>
          <div className="flex items-center gap-1">
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded transition-colors">
              <svg className="w-4 h-4 text-gray-600 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded transition-colors">
              <svg className="w-4 h-4 text-gray-600 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="px-2 py-2">
        <button
          onClick={() => navigate('/dashboard')}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
            location.pathname === '/dashboard' 
              ? 'bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-dark-text' 
              : 'text-gray-700 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-border'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Home</span>
        </button>
      </div>

      {/* Teams Section */}
      <div className="px-3 py-2 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">Teams</span>
          <button
            onClick={() => {
              const event = new CustomEvent('openNewTeamModal');
              window.dispatchEvent(event);
            }}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-dark-border rounded transition-colors"
            title="Add new"
          >
            <svg className="w-3 h-3 text-gray-500 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div className="space-y-0.5 mt-1">
          {loading ? (
            <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-dark-text-muted">Loading...</div>
          ) : teams.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-dark-text-muted">No teams yet</div>
          ) : (
            teams.map(team => (
              <button
                key={team.id}
                onClick={() => navigate(`/team/${team.id}`)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors text-left ${
                  location.pathname === `/team/${team.id}`
                    ? 'bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-dark-text'
                    : 'text-gray-700 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-border'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="truncate flex-1">{team.name}</span>
              </button>
            ))
          )}
          <button
            onClick={() => {
              const event = new CustomEvent('openNewTeamModal');
              window.dispatchEvent(event);
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-border text-sm text-gray-500 dark:text-dark-text-muted transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add new</span>
          </button>
        </div>

        {/* Divider + Personal TASKS section */}
        <div className="mt-4 mb-2 border-t border-gray-100 dark:border-dark-border" />

        <div className="flex items-center justify-between mb-1 mt-3">
          <span className="text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">Tasks</span>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const el = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (el) el.classList.toggle('hidden');
              }}
              className="p-0.5 hover:bg-gray-100 dark:hover:bg-dark-border rounded transition-colors"
              title="Create"
            >
              <svg className="w-3 h-3 text-gray-500 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <div className="hidden absolute right-0 mt-2 w-36 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded shadow z-30 overflow-hidden">
              <button
                onClick={(e) => {
                  (e.currentTarget.parentElement as HTMLElement | null)?.classList.add('hidden');
                  window.dispatchEvent(new CustomEvent('openPersonalTaskCreate'));
                  window.location.href = '/personal';
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-border text-sm"
              >
                 New Task
              </button>
              <button
                onClick={(e) => {
                  (e.currentTarget.parentElement as HTMLElement | null)?.classList.add('hidden');
                  window.dispatchEvent(new CustomEvent('openPersonalFolderCreate'));
                  window.location.href = '/personal';
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-border text-sm"
              >
                 New Folder
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-0.5 mt-1">
          <button
            onClick={() => window.location.assign('/personal')}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors text-left `}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate flex-1">Personal Tasks</span>
          </button>
        </div>
      </div>

      {/* Theme Toggle & Menu */}      <div className="border-t border-gray-100 dark:border-dark-border p-3 space-y-2">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-border transition-all duration-300 group"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          <div className="relative w-10 h-6 rounded-full bg-gray-200 dark:bg-gray-700 transition-all duration-500 ease-in-out">
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white dark:bg-yellow-400 shadow-md transform transition-transform duration-500 ease-in-out ${
                theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
              }`}
            >
              {theme === 'dark' ? (
                <svg className="w-full h-full p-1 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-full h-full p-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-dark-text">
            {theme === 'dark' ? 'Dark' : 'Light'} Mode
          </span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-left"
        >
          <svg className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-dark-text">Settings</span>
        </button>

        {/* About Us Button */}
        <button
          onClick={() => navigate('/about-us')}
          className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-left"
        >
          <svg className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-dark-text">About Us</span>
        </button>

        {/* Profile Button - Always at bottom */}
        <div className="relative pt-2 border-t border-gray-100 dark:border-dark-border" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-border transition-colors"
          >
            <div className="flex-shrink-0">
              {user && user.photo_url ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  <Avatar user={user} size="sm" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-dark-surface flex items-center justify-center">
                  <span className="text-gray-600 dark:text-dark-text text-sm font-medium">
                    {(displayName && displayName.length > 0) ? displayName.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">{displayName}</div>
              {displayEmail && (
                <div className="text-xs text-gray-500 dark:text-dark-text-muted truncate">{displayEmail}</div>
              )}
            </div>
            <svg className="w-4 h-4 text-gray-400 dark:text-dark-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {showProfileMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors text-sm text-gray-700 dark:text-dark-text"
              >
                Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

