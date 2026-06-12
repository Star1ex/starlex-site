import React, { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';

import { GlobalSidebar } from '@/widgets/GlobalSidebar/GlobalSidebar.js';
import { Topbar } from '@/widgets/Topbar/Topbar.js';
import SearchModal from '@/widgets/SearchModal/LazySearchModal.js';
import { preloadSearchModal } from '@/app/routePreload.js';
import { ToastHost } from '@/shared/ui/ToastHost.js';
import { useRealtimeConnection } from '@/shared/hooks/useRealtime.js';
import { useWorkspace } from '@/contexts/useWorkspace.js';
import { Menu, Plus, Search, X } from 'lucide-react';

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => unknown;
};

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  useRealtimeConnection();
  const navigate = useNavigate();
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();
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

  const routeKey = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    queueMicrotask(() => setMobileSidebarOpen(false));
  }, [routeKey]);

  useEffect(() => {
    if (!isMobile || !mobileSidebarOpen) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileSidebarOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobile, mobileSidebarOpen]);

  const openSearch = useCallback(() => {
    preloadSearchModal();
    const doc = document as ViewTransitionDocument;
    if (typeof doc.startViewTransition === 'function' && !prefersReducedMotion()) {
      doc.startViewTransition(() => { flushSync(() => setSearchOpen(true)); });
    } else {
      setSearchOpen(true);
    }
  }, []);

  const closeSearch = useCallback(() => {
    const doc = document as ViewTransitionDocument;
    if (typeof doc.startViewTransition === 'function' && !prefersReducedMotion()) {
      doc.startViewTransition(() => { flushSync(() => setSearchOpen(false)); });
    } else {
      setSearchOpen(false);
    }
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

  // Depth-field scroll parallax (Law 12): scrollY * -0.04px via rAF.
  // Disabled under prefers-reduced-motion.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const field = document.querySelector('.sx-depth') as HTMLElement | null;
    if (!field) return;
    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        field.style.setProperty('--depth-shift', `${window.scrollY * -0.04}px`);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

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

      {/* Desktop sidebar */}
      {!isMobile && <GlobalSidebar />}

      {/* Desktop topbar */}
      {!isMobile && <Topbar onSearchOpen={openSearch} isSearchOpen={searchOpen} />}

      {/* Mobile topbar */}
      {isMobile && (
        <header className="mobile-app-topbar">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="mobile-icon-button"
            aria-label="Open menu"
            aria-controls="mobile-navigation-drawer"
            aria-expanded={mobileSidebarOpen}
          >
            <Menu size={20} />
          </button>
          <div className="mobile-topbar-title">
            <span>Workspace</span>
            <strong>{activeWorkspace?.name ?? 'Starlex'}</strong>
          </div>
          <div className="mobile-topbar-actions">
            <button
              type="button"
              onClick={openSearch}
              className="mobile-icon-button"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
            <button
              type="button"
              onClick={() => navigate(newTaskPath)}
              className="mobile-icon-button mobile-icon-button--accent"
              aria-label="New task"
            >
              <Plus size={18} />
            </button>
          </div>
        </header>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && (
        <>
          <div
            className={`mobile-menu-overlay ${mobileSidebarOpen ? 'is-open' : ''}`}
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-navigation-drawer"
            className={`mobile-sidebar-drawer ${mobileSidebarOpen ? 'is-open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-hidden={!mobileSidebarOpen}
            aria-label="Mobile navigation"
            inert={mobileSidebarOpen ? undefined : true}
          >
            <div className="mobile-drawer-grabber" aria-hidden="true" />
            <GlobalSidebar
              className="app-sidebar--mobile"
              onNavigate={() => setMobileSidebarOpen(false)}
            />
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="mobile-drawer-close"
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
            ? 'mobile-main-content'
            : 'ml-[272px] pt-[92px] px-12 pb-12 max-w-[1640px]'
        }
      >
        <div className={isMobile ? '' : 'max-w-container mx-auto flex flex-col gap-10'}>
          {children}
        </div>
      </main>

      <ToastHost />
      <SearchModal isOpen={searchOpen} onClose={closeSearch} />
    </div>
  );
};
