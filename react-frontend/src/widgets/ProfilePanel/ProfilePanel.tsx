import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@/shared/ui/Avatar.js';
import { userService } from '@/services/api/index.js';
import type { User } from '@/entities/types.js';

import { getAuthUser } from '@/shared/lib/authManager.js';

type Props = {
  isMobile?: boolean;
  onClose?: () => void;
};

const getUserIdFromToken = (token: string): { firstName: string; lastName: string; email?: string } | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return {
      firstName: decoded.firstName || decoded.first_name || 'User',
      lastName: decoded.lastName || decoded.last_name || '',
      email: decoded.email || '',
    };
  } catch (err) {
    console.error('Error decoding token:', err);
    return null;
  }
};

export const RightSidebar: React.FC<Props> = ({ isMobile = false, onClose }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<{ firstName: string; lastName: string; email?: string } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Try to get user info from stored data first
    const storedUser = getAuthUser();
    if (storedUser && storedUser.firstName) {
      const firstName = storedUser.firstName || '';
      const lastName = storedUser.lastName || '';
      const email = storedUser.email || '';
      setUserInfo({ firstName, lastName, email });
    }

    const fetchUser = async () => {
      try {
        const data = await userService.getProfile();
        setUser(data as unknown as User);
        const firstName = data.firstName || '';
        const lastName = data.lastName || '';
        const email = data.email || '';
        if (firstName || lastName) {
          setUserInfo({ firstName, lastName, email });
        }
      } catch (err: any) {
        if (err?.response?.status === 401) {
          navigate('/sign-in');
        } else {
          console.error('Error loading profile:', err);
        }
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
  };
  }, [showMenu]);

  // Prioritize user data from API over token
  const displayName = user 
    ? `${(user as any).firstName || (user as any).first_name || ''}${((user as any).lastName || (user as any).last_name) ? ` ${(user as any).lastName || (user as any).last_name}` : ''}`.trim() || 'User'
    : (userInfo 
      ? `${userInfo.firstName || ''}${userInfo.lastName ? ` ${userInfo.lastName}` : ''}`.trim() || 'User'
      : 'User');
  const displayEmail = (user as any)?.email || userInfo?.email || '';

  // Mobile View
  if (isMobile) {
    return (
      <aside className="w-full h-full bg-white flex flex-col items-center py-8 px-6">
        <div className="mb-8" />

        <button
          onClick={() => {
            navigate('/profile');
            onClose?.();
          }}
          className="w-24 h-24 rounded-full overflow-hidden border-4 border-black flex items-center justify-center bg-white focus:outline-none hover:border-gray-700 transition-all duration-300 shadow-lg animate-scaleIn"
        >
          {user ? (
            <Avatar user={user} size="lg" />
          ) : (
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-medium">
                {(displayName && displayName.length > 0) ? displayName.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          )}
        </button>

        <div className="flex-1" />

        <div className="w-full flex flex-col space-y-4 animate-fadeInUp">
          <button
            onClick={() => {
              navigate('/profile');
              onClose?.();
            }}
            className="w-full py-4 px-6 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            Profile
          </button>
          
          <button
            onClick={() => {
              navigate('/settings');
              onClose?.();
            }}
            className="w-full py-4 px-6 bg-white border-2 border-black text-black rounded-xl hover:bg-gray-100 transition-all duration-200 font-semibold text-lg transform hover:scale-[1.02]"
          >
            Settings
          </button>
          
          <button
            onClick={() => {
              navigate('/settings?tab=about');
              onClose?.();
            }}
            className="w-full py-4 px-6 bg-white border-2 border-black text-black rounded-xl hover:bg-gray-100 transition-all duration-200 font-semibold text-lg transform hover:scale-[1.02]"
          >
            About Us
          </button>
        </div>

        <div className="mb-8" />

        <style>{`
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-scaleIn {
            animation: scaleIn 0.4s ease-out;
          }
          .animate-fadeInUp {
            animation: fadeInUp 0.5s ease-out 0.2s;
            animation-fill-mode: both;
          }
        `}</style>
      </aside>
    );
  }

  // Desktop View - Profile Card
  return (
    <aside className="w-full bg-white flex flex-col h-full">
      <div className="flex-1" />

      {/* Profile Card */}
      <div className="p-4 border-t border-gray-100">
        <div className="relative" ref={menuRef}>
      <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <div className="flex-shrink-0">
              {user && (user.photo_url || user.avatar_url) ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  <Avatar user={user} size="sm" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {(displayName && displayName.length > 0) ? displayName.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-semibold text-gray-900 truncate">{displayName}</div>
              {displayEmail && (
                <div className="text-xs text-gray-500 truncate">{displayEmail}</div>
              )}
            </div>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
      </button>

          {showMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition-colors text-sm text-gray-700"
              >
                Profile
              </button>
              <div className="border-t border-gray-100" />
        <button
                onClick={() => {
                  navigate('/settings');
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition-colors text-sm text-gray-700"
        >
          Settings
        </button>
        <button
                onClick={() => {
                  navigate('/settings?tab=about');
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition-colors text-sm text-gray-700"
        >
                About Us
        </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
