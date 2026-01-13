import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '@/shared/lib/authManager.js';
import { SettingsSidebar } from '@/widgets/SettingsSidebar/SettingsSidebar.js';
import { Contributing } from '@/pages/settings/Contributing.js';
import { Appearance } from '@/pages/settings/Appearance.js';
import { ChangePassword } from '@/pages/settings/ChangePassword.js';

export const GeneralSettings: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'contributing' | 'appearance' | 'password'>('appearance');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/sign-in');
      return;
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg transition-colors">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-dark-text-muted font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'contributing':
        return <Contributing />;
      case 'appearance':
        return <Appearance />;
      case 'password':
        return <ChangePassword />;
      default:
        return <Appearance />;
    }
  };

  return (
    <div className="min-h-full bg-white dark:bg-dark-bg transition-colors overflow-hidden">
      {/* Settings Sidebar */}
      <SettingsSidebar
        isOpen={sidebarOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-64' : 'ml-0'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Mobile Header with Toggle Button */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text">Settings</h1>
              <p className="text-gray-600 dark:text-dark-text-muted mt-1">Manage your preferences</p>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border hover:bg-gray-200 dark:hover:bg-dark-border transition-colors text-gray-700 dark:text-dark-text"
              aria-label="Toggle settings menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">Settings</h1>
            <p className="text-gray-600 dark:text-dark-text-muted">Manage your account and application preferences</p>
          </div>

          {/* Content with Animation */}
          <div
            className={`transition-all duration-300 ease-in-out transform ${
              sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-100 translate-x-0'
            }`}
          >
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};
