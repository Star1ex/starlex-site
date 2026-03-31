import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GlobalSidebar } from '@/widgets/GlobalSidebar/GlobalSidebar.js';
import { NewTabModal } from '@/widgets/NewTabModal/NewTabModal.js';
import { useModal } from '@/shared/hooks/useModal.js';
import { Menu, X, MoreVertical, User, Settings as SettingsIcon } from 'lucide-react';
import { ToastHost } from '@/shared/ui/ToastHost.js';
import { useAuth } from '@/contexts/AuthContext.js';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileQuickMenuOpen, setMobileQuickMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const { open, onOpen, onClose } = useModal(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const sidebarTouchStartXRef = useRef(0);
  const prevRouteRef = useRef<{ path: string; label: string } | null>(null);
  const isSettingsRoute = location.pathname.startsWith('/settings');

  useEffect(() => {
    const handleOpenModal = () => {
      onOpen();
    };
    
    window.addEventListener('openNewTeamModal', handleOpenModal);
    
    return () => {
      window.removeEventListener('openNewTeamModal', handleOpenModal);
    };
  }, [onOpen]);

  useEffect(() => {
    if (!isSettingsRoute) {
      sessionStorage.setItem('lastNonSettingsRoute', `${location.pathname}${location.search}`);
    } else {
      setMobileSidebarOpen(false);
    }
  }, [isSettingsRoute, location.pathname, location.search]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileSidebarOpen(false);
        setMobileQuickMenuOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMobileQuickMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const authRoutes = ['/sign-in', '/sign-up', '/oauth', '/verify-email', '/forgot-password', '/reset-password'];
    const isAuthRoute = authRoutes.some((route) => location.pathname.startsWith(route));
    const getRouteLabel = (path: string) => {
      if (path.startsWith('/team/')) return 'Tasks';
      if (path.startsWith('/task/')) return 'Task';
      if (path.startsWith('/settings')) return 'Settings';
      if (path.startsWith('/profile')) return 'Profile';
      if (path.startsWith('/dashboard')) return 'Dashboard';
      if (path === '/') return 'Home';
      return 'Back';
    };

    if (!isAuthRoute) {
      if (prevRouteRef.current && prevRouteRef.current.path !== location.pathname) {
        sessionStorage.setItem('prevRoutePath', prevRouteRef.current.path);
        sessionStorage.setItem('prevRouteLabel', prevRouteRef.current.label);
      }
      prevRouteRef.current = {
        path: location.pathname,
        label: getRouteLabel(location.pathname),
      };
    }
  }, [location.pathname]);

  const handleTeamCreated = () => {
    const event = new CustomEvent('teamCreated');
    window.dispatchEvent(event);
    onClose();
  };

  const mobileTitle = useMemo(() => {
    if (location.pathname.startsWith('/team/')) return 'Team Tasks';
    if (location.pathname.startsWith('/task/')) return 'Task';
    if (location.pathname.startsWith('/settings')) return 'Settings';
    if (location.pathname.startsWith('/profile')) return 'Profile';
    if (location.pathname.startsWith('/dashboard')) return 'Dashboard';
    return 'TeamTrack';
  }, [location.pathname]);

  const handleRootTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || mobileSidebarOpen) return;
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleRootTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || mobileSidebarOpen) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    if (touchStartXRef.current <= 24 && deltaX > 60 && Math.abs(deltaY) < 40) {
      setMobileSidebarOpen(true);
    }
  };

  const handleSidebarTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    sidebarTouchStartXRef.current = touch.clientX;
  };

  const handleSidebarTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - sidebarTouchStartXRef.current;
    if (deltaX < -60) {
      setMobileSidebarOpen(false);
    }
  };

  return (
    <div
      className="flex h-screen bg-white dark:bg-dark-bg transition-colors"
      onTouchStart={handleRootTouchStart}
      onTouchMove={handleRootTouchMove}
    >
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-3 bg-white dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
        <button
          onClick={() => {
            if (isSettingsRoute) {
              setMobileQuickMenuOpen((prev) => !prev);
              return;
            }
            setMobileSidebarOpen(true);
          }}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="text-sm font-semibold text-gray-900 dark:text-dark-text truncate">
          {mobileTitle}
        </div>
        <button
          onClick={() => setMobileQuickMenuOpen((prev) => !prev)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
          aria-label="Open quick menu"
        >
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Mobile Quick Menu */}
      {isMobile && mobileQuickMenuOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileQuickMenuOpen(false)} />
          <div className="md:hidden fixed top-12 right-3 z-50 min-w-[180px] bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-xl overflow-hidden">
            <button
              onClick={() => {
                navigate('/profile');
                setMobileQuickMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border"
            >
              Profile
            </button>
            <button
              onClick={() => {
                navigate('/settings', { state: { background: location } });
                setMobileQuickMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border"
            >
              Settings
            </button>
            <div className="h-px bg-gray-200 dark:bg-dark-border" />
            <button
              onClick={() => {
                logout();
                setMobileQuickMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              Logout
            </button>
          </div>
        </>
      )}

      {/* Swipe Indicator */}
      {!mobileSidebarOpen && (
        <div className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-r-full bg-gray-300/60 dark:bg-dark-border/80 shadow-sm" />
      )}

      {/* Global Sidebar - Desktop */}
      <GlobalSidebar className="hidden md:block" />

      {/* Global Sidebar - Mobile */}
      <>
        <div
          className={`md:hidden fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 ${
            mobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileSidebarOpen(false)}
        />
        <div
          className={`md:hidden fixed left-0 top-0 h-full z-40 transition-transform duration-300 ease-out ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onTouchStart={handleSidebarTouchStart}
          onTouchMove={handleSidebarTouchMove}
        >
          <GlobalSidebar className="w-72" />
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
      </>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto md:ml-0 ${isMobile ? 'pt-12 pb-16' : ''}`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white dark:bg-dark-bg border-t border-gray-200 dark:border-dark-border flex items-center justify-around">
          <button
            onClick={() => navigate('/profile')}
            className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-colors ${
              location.pathname.startsWith('/profile') ? 'text-gray-900 dark:text-dark-text' : 'text-gray-500 dark:text-dark-text-muted'
            }`}
            aria-label="Profile"
          >
            <User size={20} />
            <span className={`mt-0.5 h-0.5 w-4 rounded-full ${location.pathname.startsWith('/profile') ? 'bg-gray-900 dark:bg-dark-text' : 'bg-transparent'}`} />
          </button>
          <button
            onClick={() => navigate('/settings', { state: { background: location } })}
            className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-colors ${
              location.pathname.startsWith('/settings') ? 'text-gray-900 dark:text-dark-text' : 'text-gray-500 dark:text-dark-text-muted'
            }`}
            aria-label="Settings"
          >
            <SettingsIcon size={20} />
            <span className={`mt-0.5 h-0.5 w-4 rounded-full ${location.pathname.startsWith('/settings') ? 'bg-gray-900 dark:bg-dark-text' : 'bg-transparent'}`} />
          </button>
          <button
            onClick={() => setMobileQuickMenuOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center w-10 h-10 rounded-lg text-gray-500 dark:text-dark-text-muted hover:text-gray-900 dark:hover:text-dark-text transition-colors"
            aria-label="Menu"
          >
            <Menu size={20} />
            <span className={`mt-0.5 h-0.5 w-4 rounded-full ${mobileQuickMenuOpen ? 'bg-gray-900 dark:bg-dark-text' : 'bg-transparent'}`} />
          </button>
        </nav>
      )}

      <ToastHost />

      {open && (
        <NewTabModal
          open={open}
          onClose={onClose}
          onTeamCreated={handleTeamCreated}
        />
      )}
    </div>
  );
};
