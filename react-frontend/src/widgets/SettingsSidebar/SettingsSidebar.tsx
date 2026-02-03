import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Palette, Lock, Info } from 'lucide-react';

interface SettingsSidebarProps {
  isOpen: boolean;
  activeTab: 'contributing' | 'appearance' | 'password' | 'about';
  onTabChange: (tab: 'contributing' | 'appearance' | 'password' | 'about') => void;
  onClose: () => void;
}

const tabs = [
  { id: 'contributing', label: 'Contributing', icon: FileText },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'password', label: 'Change Password', icon: Lock },
  { id: 'about', label: 'About Us', icon: Info },
];

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
}) => {
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleBackToDashboard = () => {
    // Animate out
    onClose();
    // Navigate after animation completes
    setTimeout(() => {
      navigate('/dashboard');
    }, 300);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-dark-surface z-40 shadow-2xl transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header with back button */}
        <div className="sticky top-0 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Settings</h2>
          <button
            onClick={handleBackToDashboard}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors text-gray-600 dark:text-dark-text-muted hover:text-gray-900 dark:hover:text-dark-text"
            title="Back to Dashboard"
            aria-label="Back to Dashboard"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                    : 'text-gray-600 dark:text-dark-text-muted hover:bg-gray-50 dark:hover:bg-dark-border'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="text-sm">{tab.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="border-t border-gray-200 dark:border-dark-border px-4 py-4">
          <p className="text-xs text-gray-500 dark:text-dark-text-muted">
            Use the up arrow to return to Dashboard
          </p>
        </div>
      </div>
    </>
  );
};
