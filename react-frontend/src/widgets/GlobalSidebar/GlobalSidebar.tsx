import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  CircleCheckBig,
  House,
  Inbox,
  ListTodo,
  LogOut,
  Plus,
  Settings2,
  SquareKanban,
  UserRound,
  UsersRound,
} from 'lucide-react';
import Avatar from '@/shared/ui/Avatar.js';
import { getAuthUser } from '@/shared/lib/authManager.js';
import { WorkspaceGlyph } from '@/shared/lib/workspaceIcon.js';
import { userService } from '@/services/api/index.js';
import { useAuth } from '@/contexts/useAuth.js';
import { WorkspaceCreateModal } from '@/widgets/WorkspaceCreateModal/WorkspaceCreateModal.js';
import { cn } from '@/shared/lib/cn.js';
import { dropdownVariants } from '@/shared/lib/animations.js';
import { trackItem } from '@/shared/lib/recentItems.js';
import type { User } from '@/entities/types.js';
import type { WorkspaceDTO } from '@/types/dto.js';
import { useWorkspace } from '@/contexts/useWorkspace.js';
import {
  preloadMembersShell,
  preloadMyIssuesShell,
  preloadSettingsModal,
  preloadTaskExplorerShell,
  preloadWorkspaceShell,
} from '@/app/routePreload.js';

interface GlobalSidebarProps {
  className?: string;
}

const ICON_STROKE = 1.55;

const NAV_ITEMS = [
  { label: 'Home',       icon: House,          path: (wsId: string) => `/workspace/${wsId}`, preload: preloadWorkspaceShell },
  { label: 'Projects',   icon: SquareKanban,  path: (wsId: string) => `/workspace/${wsId}?view=projects`, preload: preloadWorkspaceShell },
  { label: 'Tasks',      icon: ListTodo,      path: (wsId: string) => `/workspace/${wsId}/tasks`, preload: preloadTaskExplorerShell },
  { label: 'Members',    icon: UsersRound,    path: (wsId: string) => `/workspace/${wsId}/members`, preload: preloadMembersShell },
  { label: 'My Issues',  icon: CircleCheckBig, path: () => `/my-issues`, preload: preloadMyIssuesShell },
  { label: 'Inbox',      icon: Inbox,         path: (wsId: string) => `/workspace/${wsId}?view=inbox`, preload: preloadWorkspaceShell },
] as const;

function WsGlyph({ workspace }: { workspace: WorkspaceDTO }) {
  if (workspace.icon && workspace.icon.length <= 2 && !workspace.icon.startsWith('/')) {
    return (
      <div
        className="sidebar-workspace-glyph size-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ backgroundColor: workspace.color || '#6366f1' }}
      >
        <span className="text-xs leading-none">{workspace.icon}</span>
      </div>
    );
  }
  return <WorkspaceGlyph name={workspace.name} color={workspace.color} size={24} />;
}

export const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { setActiveWorkspace } = useWorkspace();

  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceDTO[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const activeWorkspaceId = useMemo(() => {
    const match = location.pathname.match(/\/workspace\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0],
    [workspaces, activeWorkspaceId],
  );

  const displayName = useMemo(() => {
    if (!user) return getAuthUser()?.firstName ?? 'User';
    const first = user.firstName || '';
    const last = user.lastName || '';
    return `${first}${last ? ` ${last}` : ''}`.trim() || 'User';
  }, [user]);

  const displayEmail = useMemo(() => {
    if (!user) return getAuthUser()?.email ?? '';
    return user.email ?? '';
  }, [user]);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const data = await userService.getWorkspaces();
      setWorkspaces(Array.isArray(data) ? data : []);
    } catch {
      // silent — user may be unauthed
    } finally {
      setLoadingWorkspaces(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = getAuthUser();
    if (storedUser) setUser(storedUser as unknown as User);

    userService.getProfile().then((data) => setUser(data as unknown as User)).catch(() => null);
    fetchWorkspaces();

    const onCreated = () => fetchWorkspaces();
    window.addEventListener('workspaceCreated', onCreated);
    return () => window.removeEventListener('workspaceCreated', onCreated);
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    const workspace = workspaces.find((w) => w.id === activeWorkspaceId);
    if (workspace) setActiveWorkspace(workspace);
  }, [activeWorkspaceId, workspaces, setActiveWorkspace]);

  useEffect(() => {
    if (!showSwitcher && !showProfileMenu) return;
    const handler = (e: MouseEvent) => {
      if (showSwitcher && switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setShowSwitcher(false);
      }
      if (showProfileMenu && profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSwitcher, showProfileMenu]);

  const handleWorkspaceSwitch = useCallback((ws: WorkspaceDTO) => {
    trackItem({ id: ws.id, name: ws.name, url: `/workspace/${ws.id}`, type: 'workspace' });
    setShowSwitcher(false);
    navigate(`/workspace/${ws.id}`);
  }, [navigate]);

  const sidebarStyle = useMemo(() => ({
    ['--workspace-accent' as string]: activeWorkspace?.color || '#6366f1',
  }) as React.CSSProperties, [activeWorkspace?.color]);

  return (
    <>
      <motion.aside
        className={cn(
          'app-sidebar scrollbar-none',
          className,
        )}
        style={sidebarStyle}
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Workspace switcher */}
        <div className="mb-6 relative z-20" ref={switcherRef}>
          <motion.button
            type="button"
            onClick={() => setShowSwitcher((p) => !p)}
            className="sidebar-workspace-button"
            data-state={showSwitcher ? 'open' : 'closed'}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            {activeWorkspace ? (
              <>
                <WsGlyph workspace={activeWorkspace} />
                <span className="sidebar-workspace-name">{activeWorkspace.name}</span>
              </>
            ) : (
              <>
                <div className="size-7 rounded-lg bg-[color:var(--sx-panel)] border border-[color:var(--sx-border)] flex-shrink-0" />
                <span className="sidebar-workspace-name text-[color:var(--sx-text-subtle)]">Select workspace</span>
              </>
            )}
            <ChevronDown size={14} strokeWidth={ICON_STROKE} className="sidebar-workspace-chevron flex-shrink-0" />
          </motion.button>

          <AnimatePresence>
            {showSwitcher && (
              <motion.div
                className="absolute top-full mt-1.5 left-0 right-0 dropdown-menu sidebar-floating-menu z-[60]"
                variants={dropdownVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {loadingWorkspaces ? (
                  <div className="px-3 py-2 text-xs text-[color:var(--sx-text-subtle)]">Loading…</div>
                ) : (
                  workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => handleWorkspaceSwitch(ws)}
                      className={cn(
                        'dropdown-menu-item',
                        ws.id === activeWorkspaceId && '!text-[color:var(--sx-text)] !bg-[color:var(--sx-control)]',
                      )}
                    >
                      <WsGlyph workspace={ws} />
                      <span className="truncate">{ws.name}</span>
                    </button>
                  ))
                )}
                <div className="dropdown-divider" />
                {activeWorkspace && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSwitcher(false);
                      navigate('/settings?tab=workspace', { state: { background: location } });
                    }}
                    onMouseEnter={preloadSettingsModal}
                    onFocus={preloadSettingsModal}
                    className="dropdown-menu-item"
                  >
                    <Settings2 size={14} strokeWidth={ICON_STROKE} className="text-[color:var(--sx-text-subtle)]" />
                    <span>Workspace settings</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setShowSwitcher(false); setShowCreateWorkspace(true); }}
                  className="dropdown-menu-item"
                >
                  <Plus size={14} strokeWidth={ICON_STROKE} className="text-[color:var(--sx-text-subtle)]" />
                  <span>New workspace</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav flex-1">
          {NAV_ITEMS.map(({ label, icon: Icon, path, preload }, index) => {
            const to = activeWorkspace ? path(activeWorkspace.id) : '/dashboard';
            const isActive = activeWorkspace
              ? location.pathname + location.search === to ||
                (label === 'Home' && location.pathname === `/workspace/${activeWorkspace.id}` && !location.search)
              : false;
            return (
              <motion.button
                key={label}
                type="button"
                onMouseEnter={preload}
                onFocus={preload}
                onClick={() => navigate(to)}
                className={cn('sidebar-nav-item', isActive && 'active')}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.28,
                  delay: 0.08 + index * 0.025,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="sidebar-nav-icon">
                  <Icon size={16} strokeWidth={ICON_STROKE} />
                </span>
                <span className="sidebar-nav-label text-body-md">{label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom dock */}
        <div className="mt-auto flex flex-col gap-2 pt-4">
          {/* Settings */}
          <NavLink
            to="/settings"
            state={{ background: location }}
            onMouseEnter={preloadSettingsModal}
            onFocus={preloadSettingsModal}
            className={({ isActive }) => cn('sidebar-dock-pill', isActive && 'active')}
          >
            <Settings2 size={15} strokeWidth={ICON_STROKE} className="text-[color:var(--sx-text-subtle)] flex-shrink-0" />
            <span className="text-body-md text-[color:var(--sx-text-muted)]">Settings</span>
          </NavLink>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <motion.button
              type="button"
              onClick={() => setShowProfileMenu((p) => !p)}
              className={cn('sidebar-dock-pill w-full', showProfileMenu && 'active')}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {user ? (
                <Avatar user={user} size="sm" className="sidebar-profile-avatar" />
              ) : (
                <div className="sidebar-profile-avatar flex items-center justify-center text-sm font-medium text-[color:var(--sx-text-muted)]">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="sidebar-profile-copy flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-[color:var(--sx-text)] truncate leading-none mb-0.5">{displayName}</p>
                {displayEmail && (
                  <p className="text-xs text-[color:var(--sx-text-subtle)] truncate">{displayEmail}</p>
                )}
              </div>
            </motion.button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  className="absolute bottom-full left-0 right-0 mb-1.5 dropdown-menu sidebar-floating-menu"
                  variants={dropdownVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <button
                    type="button"
                    onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                    className="dropdown-menu-item"
                  >
                    <UserRound size={14} strokeWidth={ICON_STROKE} />
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => { navigate('/settings', { state: { background: location } }); setShowProfileMenu(false); }}
                    onMouseEnter={preloadSettingsModal}
                    onFocus={preloadSettingsModal}
                    className="dropdown-menu-item"
                  >
                    <Settings2 size={14} strokeWidth={ICON_STROKE} />
                    Settings
                  </button>
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    onClick={() => { logout(); setShowProfileMenu(false); }}
                    className="dropdown-menu-item !text-[#fca5a5] hover:!bg-[rgba(239,68,68,0.12)]"
                  >
                    <LogOut size={14} strokeWidth={ICON_STROKE} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      <WorkspaceCreateModal
        isOpen={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
        onCreated={(ws) => {
          setWorkspaces((prev) => [...prev, ws]);
          setActiveWorkspace(ws);
          setShowCreateWorkspace(false);
          navigate(`/workspace/${ws.id}`);
        }}
      />
    </>
  );
};

export default GlobalSidebar;
