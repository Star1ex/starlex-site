import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { GlobalSidebar } from '@/widgets/GlobalSidebar/GlobalSidebar.js';
import { Topbar } from '@/widgets/Topbar/Topbar.js';
import SearchModal from '@/widgets/SearchModal/LazySearchModal.js';
import { preloadSearchModal } from '@/app/routePreload.js';
import { ToastHost } from '@/shared/ui/ToastHost.js';
import { RefractionFilter } from '@/shared/ui/glass/index.js';
import { useRealtimeConnection } from '@/shared/hooks/useRealtime.js';
import { useWorkspace } from '@/contexts/useWorkspace.js';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  useRealtimeConnection();
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    queueMicrotask(() => setMobileSidebarOpen(false));
  }, [location.pathname]);

  const openSearch = useCallback(() => {
    preloadSearchModal();
    setSearchOpen(true);
  }, []);
  const newTaskPath = activeWorkspaceId ? `/task/new?workspaceId=${activeWorkspaceId}` : '/dashboard';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const editing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        preloadSearchModal();
        setSearchOpen((s) => !s);
      }
      if (!editing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key === 'c') {
        navigate(newTaskPath);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate, newTaskPath]);

  // Track last non-settings route
  useEffect(() => {
    if (!location.pathname.startsWith('/settings')) {
      sessionStorage.setItem('lastNonSettingsRoute', `${location.pathname}${location.search}`);
    }
  }, [location.pathname, location.search]);

  return (
    <div className="starlex-app-shell min-h-screen">
      {/* Depth field — the only thing behind the shell */}
      <div className="sx-depth" aria-hidden="true" />

      {/* Chromium-only edge-refraction filter for <Glass refract> (sidebar) */}
      <RefractionFilter />

      {/* Desktop sidebar */}
      {!isMobile && <GlobalSidebar />}

      {/* Desktop topbar */}
      {!isMobile && <Topbar onSearchOpen={openSearch} />}

      {/* Mobile topbar */}
      {isMobile && (
        <div
          className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-3"
          style={{ background: 'var(--topbar-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--sx-border)' }}
        >
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[color:var(--sx-control)] transition-colors text-[color:var(--sx-text-muted)]"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-[color:var(--sx-text)] truncate">Starlex</span>
          <div className="w-9" />
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && (
        <>
          <div
            className={`fixed inset-0 z-[45] transition-opacity duration-300 ${
              mobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            style={{ background: 'var(--sx-overlay)' }}
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div
            className={`fixed left-0 top-0 h-full z-[50] transition-transform duration-300 ease-out ${
              mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <GlobalSidebar className="!w-72 !rounded-r-3xl" />
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg glass-card text-[color:var(--sx-text-muted)] hover:text-[color:var(--sx-text)]"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </>
      )}

      {/* Main content area */}
      <main
        className={
          isMobile
            ? 'pt-12 pb-6 px-4'
            : 'ml-[272px] pt-[92px] px-12 pb-12 max-w-[1640px]'
        }
      >
        <div className={isMobile ? '' : 'max-w-container mx-auto flex flex-col gap-10'}>
          {children}
        </div>
      </main>

      <ToastHost />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};
