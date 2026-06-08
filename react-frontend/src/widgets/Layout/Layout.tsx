import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { GlobalSidebar } from '@/widgets/GlobalSidebar/GlobalSidebar.js';
import { Topbar } from '@/widgets/Topbar/Topbar.js';
import { SearchModal } from '@/widgets/SearchModal/SearchModal.js';
import { ToastHost } from '@/shared/ui/ToastHost.js';
import { useRealtimeConnection } from '@/shared/hooks/useRealtime.js';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  useRealtimeConnection();
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
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const openSearch = useCallback(() => setSearchOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Track last non-settings route
  useEffect(() => {
    if (!location.pathname.startsWith('/settings')) {
      sessionStorage.setItem('lastNonSettingsRoute', `${location.pathname}${location.search}`);
    }
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Desktop sidebar */}
      {!isMobile && <GlobalSidebar />}

      {/* Desktop topbar */}
      {!isMobile && <Topbar onSearchOpen={openSearch} />}

      {/* Mobile topbar */}
      {isMobile && (
        <div
          className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-3"
          style={{ background: 'var(--topbar-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/8 transition-colors text-white/60"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-white truncate">Starlex</span>
          <div className="w-9" />
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && (
        <>
          <div
            className={`fixed inset-0 bg-black/60 z-[45] transition-opacity duration-300 ${
              mobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
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
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg glass-card text-white/60 hover:text-white"
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
            : 'ml-[240px] pt-[100px] px-12 pb-12 max-w-[1640px]'
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
