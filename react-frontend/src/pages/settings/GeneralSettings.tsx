import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '@/services/api/index.js';
import { SettingsSidebar } from '@/widgets/SettingsSidebar/SettingsSidebar.js';
import { Contributing } from '@/pages/settings/Contributing.js';
import { Appearance } from '@/pages/settings/Appearance.js';
import { ChangePassword } from '@/pages/settings/ChangePassword.js';
import { ConnectedAccounts } from '@/pages/settings/ConnectedAccounts.js';
import { Support } from '@/pages/settings/Support.js';
import AboutUs from '@/pages/about-us/AboutUs.js';
import { Palette, User, Shield, SlidersHorizontal, Info, LifeBuoy } from 'lucide-react';
import BreadcrumbBack from '@/shared/ui/BreadcrumbBack.js';

export const GeneralSettings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'contributing' | 'appearance' | 'password' | 'accounts' | 'about' | 'support'>('appearance');
  const [isMobileView, setIsMobileView] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  useEffect(() => {
    // Auth gate handled by routing; no redirect here
  }, []);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
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
    if (tab === 'contributing' || tab === 'appearance' || tab === 'password' || tab === 'accounts' || tab === 'about' || tab === 'support') {
      setActiveTab(tab);
    }
  }, [location.search]);

  const tabs = useMemo(() => ([
    { id: 'appearance', label: 'Theme', icon: Palette },
    { id: 'accounts', label: 'Account', icon: User },
    { id: 'password', label: 'Security', icon: Shield },
    { id: 'contributing', label: 'Prefs', icon: SlidersHorizontal },
    { id: 'support', label: 'Support', icon: LifeBuoy },
    { id: 'about', label: 'About', icon: Info },
  ] as const), []);

  const tabOrder = useMemo(() => tabs.map((t) => t.id), [tabs]);

  const handleTabChange = (tab: typeof tabOrder[number]) => {
    setActiveTab(tab);
    navigate(`/settings?tab=${tab}`, { replace: true });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobileView) return;
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobileView) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    if (Math.abs(deltaY) > 40 || Math.abs(deltaX) < 60) return;
    const currentIndex = tabOrder.indexOf(activeTab);
    if (deltaX < 0 && currentIndex < tabOrder.length - 1) {
      handleTabChange(tabOrder[currentIndex + 1]);
    }
    if (deltaX > 0 && currentIndex > 0) {
      handleTabChange(tabOrder[currentIndex - 1]);
    }
  };

  const handleBack = () => {
    const lastRoute = sessionStorage.getItem('lastNonSettingsRoute');
    if (lastRoute) {
      navigate(lastRoute);
    } else {
      navigate('/dashboard');
    }
  };

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
      case 'accounts':
        return <ConnectedAccounts />;
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
        isOpen={isMobileView ? false : sidebarOpen}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onClose={() => setSidebarOpen(false)}
        onBack={handleBack}
        backLabel="Back"
      />

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen && !isMobileView ? 'lg:ml-64' : 'ml-0'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 text-center pb-20 md:pb-10">
          <div className="flex justify-start mb-4">
            <BreadcrumbBack label="Dashboard" to="/dashboard" />
          </div>
          {/* Mobile Header with Toggle Button */}
          <div className="hidden">
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
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="p-2 sm:p-4 max-w-4xl mx-auto w-full">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Settings Tabs */}
      {isMobileView && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white dark:bg-dark-bg border-t border-gray-200 dark:border-dark-border flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                  isActive ? 'text-gray-900 dark:text-dark-text' : 'text-gray-500 dark:text-dark-text-muted'
                }`}
                aria-label={tab.label}
              >
                <Icon size={18} />
                <span className={`mt-0.5 h-0.5 w-4 rounded-full ${isActive ? 'bg-gray-900 dark:bg-dark-text' : 'bg-transparent'}`} />
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};
