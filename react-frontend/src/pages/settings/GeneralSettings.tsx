import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '@/services/api/index.js';
import { SettingsSidebar } from '@/widgets/SettingsSidebar/SettingsSidebar.js';
import { Contributing } from '@/pages/settings/Contributing.js';
import { Appearance } from '@/pages/settings/Appearance.js';
import { ChangePassword } from '@/pages/settings/ChangePassword.js';
import { Support } from '@/pages/settings/Support.js';
import AboutUs from '@/pages/about-us/AboutUs.js';

export const GeneralSettings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'contributing' | 'appearance' | 'password' | 'about' | 'support'>('appearance');

  useEffect(() => {
    // Auth gate handled by routing; no redirect here
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'contributing' || tab === 'appearance' || tab === 'password' || tab === 'about' || tab === 'support') {
      setActiveTab(tab);
    }
  }, [location.search]);

  const handleBack = () => {
    const lastRoute = sessionStorage.getItem('lastNonSettingsRoute');
    if (lastRoute) {
      navigate(lastRoute);
    } else {
      navigate('/dashboard');
    }
  };

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
      case 'about':
        return <AboutUs variant="settings" />;
      case 'support':
        return <Support />;
      default:
        return <Appearance />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg transition-colors">
      {/* Settings Sidebar */}
      <SettingsSidebar
        isOpen={sidebarOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={() => setSidebarOpen(false)}
        onBack={handleBack}
        backLabel="Back"
      />

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-64' : 'ml-0'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 text-center">
          {/* Mobile Header with Toggle Button */}
          <div className="lg:hidden flex items-center justify-between gap-3 mb-6">
            <div className="flex-1 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text">Settings</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-dark-border transition-colors text-gray-700 dark:text-dark-text shadow-sm"
              aria-label="Toggle settings menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Desktop Header */}


          {/* Content with Animation */}
          <div
            className={`transition-all duration-300 ease-in-out transform ${
              sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-100 translate-x-0'
            }`}
          >
            <div className="p-2 sm:p-4 max-w-4xl mx-auto w-full">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
