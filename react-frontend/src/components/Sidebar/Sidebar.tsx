import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Home, Moon, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Avatar from '@/shared/ui/Avatar.js';
import { getAuthUser } from '@/shared/lib/authManager.js';
import { userService } from '@/services/api/index.js';
import { useTheme } from '@/shared/contexts/ThemeContext.js';
import { useAuth } from '@/contexts/AuthContext.js';
import type { User } from '@/entities/types.js';
import { useSidebarResize } from '@/hooks/useSidebarResize.js';
import { ContextMenuProvider } from '@/hooks/useContextMenu.js';
import SidebarHeader from './SidebarHeader.js';
import SidebarSection from './SidebarSection.js';
import ResizeHandle from './ResizeHandle.js';
import ContextMenu from './ContextMenu.js';
import { useFolders } from '@/hooks/useFolders.js';
import { useTasks } from '@/hooks/useTasks.js';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { width, isCollapsed, isResizing, handleMouseDown, collapse, expand } = useSidebarResize();

  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<{ firstName: string; lastName: string; email?: string } | null>(null);
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();

  const foldersHook = useFolders();
  const tasksHook = useTasks();

  useEffect(() => {
    const storedUser = getAuthUser();
    if (storedUser && storedUser.firstName) {
      setUserInfo({
        firstName: storedUser.firstName || '',
        lastName: storedUser.lastName || '',
        email: storedUser.email || '',
      });
    }

    const fetchUser = async () => {
      try {
        const data = await userService.getProfile();
        setUser(data as unknown as User);
        setUserInfo({
          firstName: (data as any).firstName || '',
          lastName: (data as any).lastName || '',
          email: (data as any).email || '',
        });
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
        setLoadingTeams(false);
      }
    };

    fetchUser();
    fetchTeams();

    const handleTeamCreated = () => fetchTeams();
    window.addEventListener('teamCreated', handleTeamCreated);
    return () => window.removeEventListener('teamCreated', handleTeamCreated);
  }, [navigate]);

  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const displayName = useMemo(() => {
    if (user) {
      const first = (user as any).firstName || (user as any).first_name || '';
      const last = (user as any).lastName || (user as any).last_name || '';
      return `${first}${last ? ` ${last}` : ''}`.trim() || 'User';
    }
    if (userInfo) {
      return `${userInfo.firstName || ''}${userInfo.lastName ? ` ${userInfo.lastName}` : ''}`.trim() || 'User';
    }
    return 'User';
  }, [user, userInfo]);

  const activeTeamId = useMemo(() => {
    const match = location.pathname.match(/\/team\/(.+)$/);
    return match ? match[1] : null;
  }, [location.pathname]);

  return (
    <ContextMenuProvider>
      <aside
        className={`relative h-screen bg-white dark:bg-dark-surface border-r border-gray-100 dark:border-dark-border flex-shrink-0 transition-all duration-200 ${className}`}
        style={{ width: isCollapsed ? 0 : `${width}px` }}
      >
        {!isCollapsed && (
          <div className="h-full flex flex-col">
            <SidebarHeader displayName={`${displayName}'s`} onToggleCollapse={collapse} />

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1">
              <button
                onClick={() => navigate('/dashboard')}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors text-left ${
                  location.pathname === '/dashboard'
                    ? 'bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-dark-text'
                    : 'text-gray-700 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-border'
                }`}
              >
                <Home className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">Home</span>
              </button>

              <SidebarSection
                title="TEAMS"
                type="teams"
                defaultExpanded={false}
                teams={teams}
                loadingTeams={loadingTeams}
                activeTeamId={activeTeamId}
                onTeamClick={(id) => navigate(`/team/${id}`)}
                onAddTeam={() => window.dispatchEvent(new CustomEvent('openNewTeamModal'))}
              />

              <SidebarSection title="TASKS" type="tasks" defaultExpanded foldersHook={foldersHook} tasksHook={tasksHook} />
            </div>

            <div className="border-t border-gray-100 dark:border-dark-border p-2 space-y-1">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-left"
              >
                <Moon className="w-4 h-4" />
                <span className="text-sm">{theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-left"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </button>
              <button
                onClick={() => navigate('/about-us')}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-left"
              >
                <span className="text-sm">About Us</span>
              </button>

              <div className="pt-2 border-t border-gray-100 dark:border-dark-border relative sidebar-footer" ref={profileMenuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileMenu((prev) => !prev);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex-shrink-0">
                    {user ? <Avatar user={user} size="sm" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-dark-text-muted truncate">{userInfo?.email || ''}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" fill="currentColor" viewBox="0 0 16 16">
                    <circle cx="8" cy="4" r="1.5" />
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="8" cy="12" r="1.5" />
                  </svg>
                </button>

                {showProfileMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-xl p-2 z-50">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-dark-border text-sm"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-dark-border text-sm"
                    >
                      Settings
                    </button>
                    <div className="h-px bg-gray-200 dark:bg-dark-border my-1" />
                    <button
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 text-sm"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <ResizeHandle onMouseDown={handleMouseDown} isResizing={isResizing} />
      </aside>

      {isCollapsed && (
        <button
          onClick={expand}
          className="fixed left-0 top-4 z-50 p-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-r-md shadow-md hover:bg-gray-50"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <ContextMenu
        onCreateFolder={foldersHook.createFolder}
        onCreateTask={tasksHook.createTask}
        onDeleteFolder={foldersHook.deleteFolder}
        onDeleteTask={tasksHook.deleteTask}
      />
    </ContextMenuProvider>
  );
};

export default Sidebar;
