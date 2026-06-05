import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Moon, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Avatar from '@/shared/ui/Avatar.js';
import { getAuthUser } from '@/shared/lib/authManager.js';
import { userService, workspaceService } from '@/services/api/index.js';
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
import { dropdownVariants } from '@/shared/lib/animations.js';
import { trackItem } from '@/shared/lib/recentItems.js';

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
  const [teams, setTeams] = useState<Array<{ id: string; name: string; icon?: string }>>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();

  const foldersHook = useFolders();
  const tasksHook = useTasks();

  useEffect(() => {
    const storedUser = getAuthUser();
    if (storedUser?.firstName) {
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
        if (err?.response?.status === 401) navigate('/sign-in');
      }
    };

    const fetchTeams = async () => {
      try {
        const data = await userService.getWorkspaces();
        setTeams(Array.isArray(data) ? data.map((t: any) => ({ id: t.id, name: t.name, icon: t.icon || '' })) : []);
      } catch (err: any) {
        if (err?.response?.status === 401) navigate('/sign-in');
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
    const handleMobileCreateFolder = () => {
      const storedUser = getAuthUser();
      const ownerId = storedUser?.id || storedUser?.user_id || '';
      if (!ownerId) return;
      foldersHook.createFolder({
        name: 'New Folder',
        icon: '📁',
        color: '#3B82F6',
        parent_id: null,
        owner_id: ownerId,
        position: 0,
      });
    };
    window.addEventListener('mobileCreateFolder', handleMobileCreateFolder);
    return () => window.removeEventListener('mobileCreateFolder', handleMobileCreateFolder);
  }, [foldersHook]);

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
    const match = location.pathname.match(/\/team\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const handleAddTeam = useCallback(() => {
    window.dispatchEvent(new CustomEvent('openNewTeamModal'));
  }, []);

  const handleTeamClick = useCallback((id: string) => {
    const team = teams.find((t) => t.id === id);
    if (team) {
      trackItem({ id, name: team.name, url: `/team/${id}`, type: 'team' });
    }
    navigate(`/team/${id}`);
  }, [navigate, teams]);

  const handleRenameTeam = useCallback(async (id: string, name: string) => {
    const snapshot = teams;
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
    try {
      await workspaceService.updateWorkspace(id, { name });
    } catch {
      setTeams(snapshot);
    }
  }, [teams]);

  const handleDeleteTeam = useCallback(async (id: string) => {
    const snapshot = teams;
    setTeams((prev) => prev.filter((t) => t.id !== id));
    if (activeTeamId === id) navigate('/dashboard');
    try {
      await workspaceService.deleteWorkspace(id);
    } catch {
      setTeams(snapshot);
    }
  }, [teams, activeTeamId, navigate]);

  const handleNavigateSettings = useCallback(() => {
    navigate('/settings', { state: { background: location } });
  }, [navigate, location]);

  const themeLabel = useMemo(() => {
    if (theme === 'light') return 'Light';
    if (theme === 'dark') return 'Dark Blue';
    if (theme === 'ultra-dark') return 'Ultra Dark';
    if (theme === 'solarized') return 'Solarized';
    return 'Theme';
  }, [theme]);

  return (
    <ContextMenuProvider>
      <aside
        className={`relative h-screen flex-shrink-0 transition-all duration-200 ${className}`}
        style={{
          width: isCollapsed ? 0 : `${width}px`,
          background: 'var(--bg-sidebar, var(--bg-primary))',
          borderRight: '1px solid var(--border-sidebar, rgba(0,0,0,0.06))',
        }}
      >
        {!isCollapsed && (
          <div className="h-full flex flex-col">
            {/* Top nav: Home + collapse */}
            <SidebarHeader onToggleCollapse={collapse} />

            {/* Scrollable nav content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-1 space-y-3">
              {/* Teams */}
              <SidebarSection
                title="Teams"
                type="teams"
                defaultExpanded
                teams={teams}
                loadingTeams={loadingTeams}
                activeTeamId={activeTeamId}
                onTeamClick={handleTeamClick}
                onAddTeam={handleAddTeam}
                onRenameTeam={handleRenameTeam}
                onDeleteTeam={handleDeleteTeam}
              />

              {/* Divider */}
              <div className="h-px mx-2" style={{ background: 'var(--border-color, rgba(0,0,0,0.06))' }} />

              {/* My Tasks */}
              <SidebarSection
                title="My Tasks"
                type="tasks"
                defaultExpanded
                foldersHook={foldersHook}
                tasksHook={tasksHook}
              />
            </div>

            {/* Footer */}
            <div
              className="px-2 pb-3 pt-2 space-y-0.5"
              style={{ borderTop: '1px solid var(--border-color, rgba(0,0,0,0.06))' }}
            >
              {/* Theme */}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2.5 w-full px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-border transition-colors text-left"
              >
                <Moon size={15} className="text-gray-400 dark:text-dark-text-muted flex-shrink-0" />
                <span className="text-sm text-gray-500 dark:text-dark-text-muted truncate">{themeLabel}</span>
              </button>

              {/* Settings */}
              <button
                onClick={handleNavigateSettings}
                className="flex items-center gap-2.5 w-full px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-border transition-colors text-left"
              >
                <Settings size={15} className="text-gray-400 dark:text-dark-text-muted flex-shrink-0" />
                <span className="text-sm text-gray-500 dark:text-dark-text-muted">Settings</span>
              </button>

              {/* Profile */}
              <div className="relative pt-1" ref={profileMenuRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowProfileMenu((p) => !p); }}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-border transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    {user ? <Avatar user={user} size="sm" /> : (
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-800 dark:text-dark-text">{displayName}</p>
                    {userInfo?.email && (
                      <p className="text-xs text-gray-400 dark:text-dark-text-muted truncate">{userInfo.email}</p>
                    )}
                  </div>
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                    <circle cx="8" cy="4" r="1.5" />
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="8" cy="12" r="1.5" />
                  </svg>
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      className="absolute bottom-full left-0 mb-1.5 w-full bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-xl shadow-lg p-1 z-50 origin-bottom"
                      variants={dropdownVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <button
                        onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-sm text-gray-700 dark:text-dark-text transition-colors"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => { navigate('/settings', { state: { background: location } }); setShowProfileMenu(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-sm text-gray-700 dark:text-dark-text transition-colors"
                      >
                        Settings
                      </button>
                      <div className="h-px bg-gray-100 dark:bg-dark-border my-0.5" />
                      <button
                        onClick={() => { logout(); setShowProfileMenu(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-600 transition-colors"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        <ResizeHandle onMouseDown={handleMouseDown} isResizing={isResizing} />
      </aside>

      {isCollapsed && (
        <button
          onClick={expand}
          className="fixed left-0 top-4 z-50 p-1.5 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-r-md shadow-md hover:bg-gray-50 dark:hover:bg-dark-border transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" />
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
