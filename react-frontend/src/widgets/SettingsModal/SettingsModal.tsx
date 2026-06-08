import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Palette, Shield, User, SlidersHorizontal, LifeBuoy, Info, X, Building2 } from 'lucide-react';
import { userService } from '@/services/api/index.js';
import { Appearance } from '@/pages/settings/Appearance.js';
import { ChangePassword } from '@/pages/settings/ChangePassword.js';
import { ConnectedAccounts } from '@/pages/settings/ConnectedAccounts.js';
import { Contributing } from '@/pages/settings/Contributing.js';
import { Support } from '@/pages/settings/Support.js';
import { WorkspaceSettings } from '@/pages/settings/WorkspaceSettings.js';
import AboutUs from '@/pages/about-us/AboutUs.js';
import Avatar from '@/shared/ui/Avatar.js';
import type { User as UserEntity } from '@/entities/types.js';

type TabId = 'appearance' | 'accounts' | 'password' | 'contributing' | 'support' | 'about' | 'workspace';

interface ProfileState {
  firstName?: string;
  lastName?: string;
  email?: string;
  photo_url?: string | null;
  avatar_url?: string | null;
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'appearance',   label: 'Appearance',  icon: Palette },
  { id: 'accounts',     label: 'Account',     icon: User },
  { id: 'password',     label: 'Security',    icon: Shield },
  { id: 'contributing', label: 'Preferences', icon: SlidersHorizontal },
  { id: 'workspace',    label: 'Workspace',   icon: Building2 },
  { id: 'support',      label: 'Support',     icon: LifeBuoy },
  { id: 'about',        label: 'About',       icon: Info },
];

export const SettingsModal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(
    (searchParams.get('tab') as TabId) || 'appearance'
  );
  const [profile, setProfile] = useState<ProfileState | null>(null);

  // Load user profile for sidebar display
  useEffect(() => {
    let cancelled = false;
    userService.getProfile()
      .then(p => { if (!cancelled) setProfile(p); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Sync active tab from URL search params
  useEffect(() => {
    const tab = searchParams.get('tab') as TabId;
    if (tab && TABS.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);

  const handleClose = useCallback(() => {
    const bg = (location.state as { background?: Location } | null)?.background;
    if (bg) {
      const bgLoc = bg as unknown as { pathname: string; search?: string };
      navigate(bgLoc.pathname + (bgLoc.search || ''), { replace: true });
    } else {
      const last = sessionStorage.getItem('lastNonSettingsRoute');
      navigate(last || '/dashboard', { replace: true });
    }
  }, [navigate, location.state]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleClose]);

  const renderContent = () => {
    switch (activeTab) {
      case 'appearance':   return <Appearance />;
      case 'accounts':     return <ConnectedAccounts />;
      case 'password':     return <ChangePassword />;
      case 'contributing': return <Contributing />;
      case 'workspace':    return <WorkspaceSettings />;
      case 'support':      return <Support />;
      case 'about':        return <AboutUs variant="settings" />;
      default:             return <Appearance />;
    }
  };

  const activeTabInfo = TABS.find(t => t.id === activeTab);

  // Build a minimal user shape for Avatar — it expects the User entity type
  const avatarUser = profile
    ? ({
        firstName: profile.firstName ?? '',
        lastName:  profile.lastName ?? '',
        photo_url: profile.photo_url ?? null,
        avatar_url: profile.avatar_url ?? null,
      } as unknown as UserEntity)
    : null;

  const displayName = profile
    ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'User'
    : '—';

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.18 } }}
      exit={{ opacity: 0, transition: { duration: 0.14 } }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal box */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="relative rounded-2xl overflow-hidden flex"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
          width: 'calc(100vw - 80px)',
          maxWidth: '1300px',
          height: 'min(88vh, 860px)',
        }}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } }}
        exit={{ opacity: 0, scale: 0.97, y: 6, transition: { duration: 0.14, ease: 'easeIn' } }}
        onClick={e => e.stopPropagation()}
      >
        {/* Left Sidebar */}
        <aside
          className="hidden md:flex flex-col w-60 flex-shrink-0 overflow-y-auto"
          style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}
        >
          {/* Profile section */}
          <div className="p-4 pb-3">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
              {avatarUser ? (
                <Avatar user={avatarUser} size="sm" />
              ) : (
                <div className="w-10 h-10 rounded-full" style={{ background: 'var(--bg-tertiary)' }} />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {displayName}
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  {profile?.email || ''}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 mb-2 h-px" style={{ background: 'var(--border-color)' }} />

          {/* Nav items */}
          <nav className="flex-1 px-2 pb-4 space-y-0.5">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100 text-left"
                  style={{
                    background: isActive ? 'var(--bg-active)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  <Icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Content Panel */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header bar */}
          <div className="flex items-center justify-between px-6 pt-5 pb-0 flex-shrink-0">
            <div>
              <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>Settings</div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {activeTabInfo?.label}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg transition-colors hover:opacity-70"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Close settings"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mobile tab row — visible only on small screens */}
          <div className="md:hidden flex overflow-x-auto gap-1 px-4 pt-3 pb-1 scrollbar-none">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: activeTab === tab.id ? 'var(--bg-active)' : 'var(--bg-secondary)',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable content with AnimatePresence for tab transitions */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.16, ease: 'easeOut' } }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                className="px-6 py-5 pb-8"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};
