import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Home, Info, LifeBuoy, Lock, Moon, Palette, Settings, Link2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@/shared/ui/Avatar.js';
import { getAuthUser } from '@/shared/lib/authManager.js';
import { userService } from '@/services/api/index.js';
import { useTheme } from '@/shared/contexts/ThemeContext.js';
import { useAuth } from '@/contexts/AuthContext.js';
import type { User } from '@/entities/types.js';
import { useSidebarResize } from '@/hooks/useSidebarResize.js';
import SidebarHeader from '@/components/Sidebar/SidebarHeader.js';
import ResizeHandle from '@/components/Sidebar/ResizeHandle.js';

interface SettingsSidebarProps {
  isOpen: boolean;
  activeTab: 'contributing' | 'appearance' | 'password' | 'accounts' | 'about' | 'support';
  onTabChange: (tab: 'contributing' | 'appearance' | 'password' | 'accounts' | 'about' | 'support') => void;
  onClose: () => void;
  onBack?: () => void;
  backLabel?: string;
}

const settingsTabs = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'password', label: 'Change Password', icon: Lock },
  { id: 'accounts', label: 'Connected Accounts', icon: Link2 },
  { id: 'contributing', label: 'Contributing', icon: FileText },
  { id: 'about', label: 'About Us', icon: Info },
  { id: 'support', label: 'Support', icon: LifeBuoy },
] as const;

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  onBack,
  backLabel = 'Back',
}) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { width, isCollapsed, isResizing, handleMouseDown, collapse, expand } = useSidebarResize();
  const { logout } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<{ firstName: string; lastName: string; email?: string } | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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
      } catch (err) {
        // Ignore profile errors here; sidebar still renders
      }
    };

    fetchUser();
  }, []);

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

  const handleBack = useCallback(() => {
    if (onBack) onBack();
    else navigate('/dashboard');
  }, [onBack, navigate]);

  const handleNavigateHome = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleNavigateSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  if (!isOpen) return null;

  return (
    <aside
      className="fixed left-0 top-0 z-40 h-screen bg-white dark:bg-dark-surface border-r border-gray-100 dark:border-dark-border flex-shrink-0 transition-all duration-200"
      style={{ width: isCollapsed ? 0 : `${width}px` }}
    >
      {!isCollapsed && (
        <div className="h-full flex flex-col">
          <SidebarHeader displayName={`${displayName}'s`} onToggleCollapse={collapse} />

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1">
            <button
              onClick={handleBack}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors text-left text-gray-700 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-border"
              aria-label={backLabel}
              title={backLabel}
            >
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate">{backLabel}</span>
            </button>

            <button
              onClick={handleNavigateHome}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors text-left text-gray-700 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-border"
            >
              <Home className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate">Home</span>
            </button>

            <div className="py-1">
              <div className="flex items-center justify-between px-1 group">
                <button
                  onClick={() => onTabChange(activeTab)}
                  className="flex items-center gap-2 flex-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded-md transition-colors text-left"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500 transition-transform rotate-90" />
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">
                    SETTINGS
                  </span>
                </button>
              </div>
              <div className="pl-2 mt-1 space-y-0.5" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 400px' }}>
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`w-full flex items-center gap-2 pl-4 pr-2 py-1.5 rounded text-sm transition-colors text-left ${
                        isActive
                          ? 'bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-dark-text'
                          : 'text-gray-700 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-border'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate flex-1">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-dark-border p-2 space-y-1">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-left"
            >
              <Moon className="w-4 h-4" />
              <span className="text-sm">
                {theme === 'light' && 'White'}
                {theme === 'dark' && 'Dark Blue'}
                {theme === 'ultra-dark' && 'Ultra Dark'}
                {theme === 'solarized' && 'Solarized White'}
                {' '}Mode
              </span>
            </button>
            <button
              onClick={handleNavigateSettings}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-left"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>

            <div className="pt-2 border-t border-gray-100 dark:border-dark-border relative sidebar-footer" ref={profileMenuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu((prev) => !prev);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
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

      {isCollapsed && (
        <button
          onClick={expand}
          className="fixed left-0 top-4 z-50 p-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-r-md shadow-md hover:bg-gray-50"
          aria-label={backLabel}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </aside>
  );
};
