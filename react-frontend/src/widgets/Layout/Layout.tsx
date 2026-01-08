import React, { useState, useEffect } from 'react';
import { GlobalSidebar } from '@/widgets/GlobalSidebar/GlobalSidebar.js';
import { NewTabModal } from '@/widgets/NewTabModal/NewTabModal.js';
import { useModal } from '@/shared/hooks/useModal.js';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { open, onOpen, onClose } = useModal(false);

  useEffect(() => {
    const handleOpenModal = () => {
      onOpen();
    };
    
    window.addEventListener('openNewTeamModal', handleOpenModal);
    
    return () => {
      window.removeEventListener('openNewTeamModal', handleOpenModal);
    };
  }, [onOpen]);

  const handleTeamCreated = () => {
    const event = new CustomEvent('teamCreated');
    window.dispatchEvent(event);
    onClose();
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 shadow-lg hover:bg-gray-50 transition-all duration-200"
      >
        <Menu size={20} />
      </button>

      {/* Global Sidebar - Desktop */}
      <GlobalSidebar className="hidden lg:block" />

      {/* Global Sidebar - Mobile */}
      {mobileSidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="lg:hidden fixed left-0 top-0 h-full z-40">
            <GlobalSidebar className="w-64" />
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <X size={20} />
            </button>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-0">
        {children}
      </main>

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

