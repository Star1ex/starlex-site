import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Palette, Shield, User, LifeBuoy, Info, X, Building2, Bell } from 'lucide-react';
import { userService } from '@/services/api/index.js';
import Avatar from '@/shared/ui/Avatar.js';
import { Glass } from '@/shared/ui/glass/index.js';
import type { User as UserEntity } from '@/entities/types.js';

type TabId = 'appearance' | 'accounts' | 'password' | 'support' | 'about' | 'workspace' | 'notifications';

interface ProfileState {
  firstName?: string;
  lastName?: string;
  email?: string;
  photo_url?: string | null;
  avatar_url?: string | null;
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'appearance',     label: 'Appearance',     icon: Palette },
  { id: 'accounts',       label: 'Account',        icon: User },
  { id: 'password',       label: 'Security',       icon: Shield },
  { id: 'notifications',  label: 'Notifications',  icon: Bell },
  { id: 'workspace',      label: 'Workspace',      icon: Building2 },
  { id: 'support',        label: 'Support',        icon: LifeBuoy },
  { id: 'about',          label: 'About',          icon: Info },
];

const Appearance = React.lazy(() => import('@/pages/settings/Appearance.js').then((module) => ({ default: module.Appearance })));
const ChangePassword = React.lazy(() => import('@/pages/settings/ChangePassword.js').then((module) => ({ default: module.ChangePassword })));
const ConnectedAccounts = React.lazy(() => import('@/pages/settings/ConnectedAccounts.js').then((module) => ({ default: module.ConnectedAccounts })));
const Support = React.lazy(() => import('@/pages/settings/Support.js').then((module) => ({ default: module.Support })));
const WorkspaceSettings = React.lazy(() => import('@/pages/settings/WorkspaceSettings.js').then((module) => ({ default: module.WorkspaceSettings })));
const NotificationsSettings = React.lazy(() => import('@/pages/settings/NotificationsSettings.js').then((module) => ({ default: module.NotificationsSettings })));
const AboutUs = React.lazy(() => import('@/pages/about-us/AboutUs.js'));

function SettingsPanelSkeleton() {
  return (
    <div className="settings-page" aria-hidden="true">
      <section className="settings-section settings-panel-skeleton">
        <div className="settings-panel-skeleton__title" />
        <div className="settings-panel-skeleton__line" />
        <div className="settings-panel-skeleton__line settings-panel-skeleton__line--short" />
      </section>
      <section className="settings-section settings-panel-skeleton">
        <div className="settings-panel-skeleton__row" />
        <div className="settings-panel-skeleton__row" />
      </section>
    </div>
  );
}

export const SettingsModal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabId | null;
  const activeTab: TabId = tabParam && TABS.some(t => t.id === tabParam) ? tabParam : 'appearance';
  const [profile, setProfile] = useState<ProfileState | null>(null);

  // Load user profile for sidebar display
  useEffect(() => {
    let cancelled = false;
    userService.getProfile()
      .then(p => { if (!cancelled) setProfile(p); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleTabChange = useCallback((tab: TabId) => {
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
      case 'appearance':    return <Appearance />;
      case 'accounts':      return <ConnectedAccounts />;
      case 'password':      return <ChangePassword />;
      case 'notifications': return <NotificationsSettings />;
      case 'workspace':     return <WorkspaceSettings />;
      case 'support':       return <Support />;
      case 'about':         return <AboutUs variant="settings" />;
      default:              return <Appearance />;
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
      className="settings-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.12 } }}
      exit={{ opacity: 0, transition: { duration: 0.10 } }}
    >
      {/* Backdrop */}
      <div
        className="settings-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal box — Glass material (refraction = the showcase wow moment) */}
      <Glass
        as={motion.div}
        variant="modal"
        depth="floating"
        refract
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="settings-modal-shell"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } }}
        exit={{ opacity: 0, scale: 0.985, y: 4, transition: { duration: 0.12, ease: 'easeIn' } }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Left Sidebar */}
        <aside
          className="settings-modal-sidebar"
        >
          {/* Profile section */}
          <div className="settings-profile-wrap">
            <div className="settings-profile-card">
              {avatarUser ? (
                <Avatar user={avatarUser} size="sm" className="settings-profile-avatar" />
              ) : (
                <div className="settings-profile-avatar" />
              )}
              <div className="settings-profile-copy">
                <div className="settings-profile-name">
                  {displayName}
                </div>
                <div className="settings-profile-email">
                  {profile?.email || ''}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="settings-sidebar-divider" />

          {/* Nav items */}
          <nav className="settings-nav-list">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="settings-nav-item"
                  data-active={isActive}
                >
                  <Icon size={15} className="settings-nav-icon" />
                  <span className="settings-nav-label">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Content Panel */}
        <div className="settings-main-panel">
          {/* Header bar */}
          <div className="settings-modal-header">
            <div>
              <div className="settings-header-kicker">Settings</div>
              <h2 className="settings-header-title">
                {activeTabInfo?.label}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="settings-close-button"
              aria-label="Close settings"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mobile tab row — visible only on small screens */}
          <div className="settings-mobile-tabs scrollbar-none">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="settings-mobile-tab"
                data-active={activeTab === tab.id}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable content with AnimatePresence for tab transitions */}
          <div className="settings-content-scroll">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.16, ease: 'easeOut' } }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                className="settings-content-inner"
              >
                <React.Suspense fallback={<SettingsPanelSkeleton />}>
                  {renderContent()}
                </React.Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Glass>
    </motion.div>,
    document.body
  );
};
