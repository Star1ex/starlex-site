import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, FolderKanban, CircleCheck, Bell, Settings, ChevronDown, Plus, LogOut, User as UserIcon } from 'lucide-react';
import Avatar from '@/shared/ui/Avatar.js';
import { getAuthUser } from '@/shared/lib/authManager.js';
import { WorkspaceGlyph } from '@/shared/lib/workspaceIcon.js';
import { userService, workspaceService } from '@/services/api/index.js';
import { useAuth } from '@/contexts/AuthContext.js';
import { WorkspaceCreateModal } from '@/widgets/WorkspaceCreateModal/WorkspaceCreateModal.js';
import { cn } from '@/shared/lib/cn.js';
import { dropdownVariants } from '@/shared/lib/animations.js';
import { trackItem } from '@/shared/lib/recentItems.js';
import type { User } from '@/entities/types.js';

interface Workspace {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface GlobalSidebarProps {
  className?: string;
}

const NAV_ITEMS = [
  { label: 'Home',       icon: Home,         path: (wsId: string) => `/workspace/${wsId}` },
  { label: 'Projects',   icon: FolderKanban, path: (wsId: string) => `/workspace/${wsId}?view=projects` },
  { label: 'My Issues',  icon: CircleCheck,  path: (_wsId: string) => `/my-issues` },
  { label: 'Inbox',      icon: Bell,         path: (wsId: string) => `/workspace/${wsId}?view=inbox` },
] as const;

function WsGlyph({ workspace }: { workspace: Workspace }) {
  if (workspace.icon && workspace.icon.length <= 2 && !workspace.icon.startsWith('/')) {
    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
        style={{ backgroundColor: workspace.color || '#6366f1' }}
      >
        <span className="text-base leading-none">{workspace.icon}</span>
      </div>
    );
  }
  return <WorkspaceGlyph name={workspace.name} color={workspace.color} size={32} />;
}

export const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
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
    const first = (user as any).firstName || (user as any).first_name || '';
    const last = (user as any).lastName || (user as any).last_name || '';
    return `${first}${last ? ` ${last}` : ''}`.trim() || 'User';
  }, [user]);

  const displayEmail = useMemo(() => {
    if (!user) return getAuthUser()?.email ?? '';
    return (user as any).email ?? '';
  }, [user]);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const data = await userService.getWorkspaces();
      setWorkspaces(
        Array.isArray(data)
          ? data.map((w: any) => ({ id: w.id, name: w.name, icon: w.icon ?? '', color: w.color ?? '' }))
          : [],
      );
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

  const handleWorkspaceSwitch = useCallback((ws: Workspace) => {
    trackItem({ id: ws.id, name: ws.name, url: `/workspace/${ws.id}`, type: 'workspace' });
    setShowSwitcher(false);
    navigate(`/workspace/${ws.id}`);
  }, [navigate]);

  const handleDeleteWorkspace = useCallback(async (id: string) => {
    const snap = workspaces;
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    if (activeWorkspaceId === id) navigate('/dashboard');
    try {
      await workspaceService.deleteWorkspace(id);
    } catch {
      setWorkspaces(snap);
    }
  }, [workspaces, activeWorkspaceId, navigate]);

  return (
    <>
      <aside
        className={cn(
          'app-sidebar scrollbar-none',
          className,
        )}
      >
        {/* Workspace header */}
        <div className="mb-5 px-1">
          {activeWorkspace ? (
            <div className="flex items-center gap-3">
              <WsGlyph workspace={activeWorkspace} />
              <div className="flex-1 min-w-0">
                <p className="text-headline-md font-hanken font-bold text-white truncate leading-none mb-0.5">
                  {activeWorkspace.name}
                </p>
                <p className="label-caps text-white/50 text-[10px] uppercase tracking-widest font-mono">
                  Workspace
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex-shrink-0" />
              <div className="flex-1 h-4 bg-white/5 rounded animate-pulse" />
            </div>
          )}
        </div>

        {/* Workspace switcher */}
        <div className="mb-5 relative" ref={switcherRef}>
          <button
            onClick={() => setShowSwitcher((p) => !p)}
            className="w-full flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-2 text-white/60 hover:text-white hover:bg-white/8 transition-all text-sm"
          >
            <span className="flex-1 text-left truncate">
              {activeWorkspace?.name ?? 'Select workspace'}
            </span>
            <ChevronDown size={14} className="flex-shrink-0" />
          </button>

          <AnimatePresence>
            {showSwitcher && (
              <motion.div
                className="absolute top-full mt-1.5 left-0 right-0 dropdown-menu z-[60]"
                variants={dropdownVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {loadingWorkspaces ? (
                  <div className="px-3 py-2 text-xs text-white/40">Loading…</div>
                ) : (
                  workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => handleWorkspaceSwitch(ws)}
                      className={cn(
                        'dropdown-menu-item',
                        ws.id === activeWorkspaceId && '!text-white !bg-white/8',
                      )}
                    >
                      <WsGlyph workspace={ws} />
                      <span className="truncate">{ws.name}</span>
                    </button>
                  ))
                )}
                <div className="dropdown-divider" />
                <button
                  onClick={() => { setShowSwitcher(false); setShowCreateWorkspace(true); }}
                  className="dropdown-menu-item"
                >
                  <Plus size={14} className="text-white/40" />
                  <span>New workspace</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
            const to = activeWorkspace ? path(activeWorkspace.id) : '/dashboard';
            const isActive = activeWorkspace
              ? location.pathname + location.search === to ||
                (label === 'Home' && location.pathname === `/workspace/${activeWorkspace.id}` && !location.search)
              : false;
            return (
              <button
                key={label}
                onClick={() => navigate(to)}
                className={cn('sidebar-nav-item', isActive && 'active')}
              >
                <Icon size={16} className="flex-shrink-0" />
                <span className="text-body-md">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom dock */}
        <div className="mt-auto flex flex-col gap-2 pt-4">
          {/* Settings */}
          <NavLink
            to="/settings"
            state={{ background: location }}
            className="sidebar-dock-pill"
          >
            <Settings size={15} className="text-white/40 flex-shrink-0" />
            <span className="text-body-md text-white/60">Settings</span>
          </NavLink>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu((p) => !p)}
              className="sidebar-dock-pill w-full"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-white/5">
                {user ? (
                  <Avatar user={user} size="sm" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-medium text-white/60">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate leading-none mb-0.5">{displayName}</p>
                {displayEmail && (
                  <p className="text-xs text-white/40 truncate">{displayEmail}</p>
                )}
              </div>
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  className="absolute bottom-full left-0 right-0 mb-1.5 dropdown-menu"
                  variants={dropdownVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <button
                    onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                    className="dropdown-menu-item"
                  >
                    <UserIcon size={14} />
                    View Profile
                  </button>
                  <button
                    onClick={() => { navigate('/settings', { state: { background: location } }); setShowProfileMenu(false); }}
                    className="dropdown-menu-item"
                  >
                    <Settings size={14} />
                    Settings
                  </button>
                  <div className="dropdown-divider" />
                  <button
                    onClick={() => { logout(); setShowProfileMenu(false); }}
                    className="dropdown-menu-item !text-[#fca5a5] hover:!bg-[rgba(239,68,68,0.12)]"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      <WorkspaceCreateModal
        isOpen={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
        onCreated={(ws) => {
          setWorkspaces((prev) => [...prev, { id: ws.id, name: ws.name, icon: ws.icon, color: (ws as any).color }]);
          setShowCreateWorkspace(false);
          navigate(`/workspace/${ws.id}`);
        }}
      />
    </>
  );
};

export default GlobalSidebar;
