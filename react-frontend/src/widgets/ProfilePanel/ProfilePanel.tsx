import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type UserProfile = {
  avatarUrl?: string;
  name?: string;
  email?: string;
};

type UserPhoto = {
  url: string;
};

type Props = {
  isMobile?: boolean;
  onClose?: () => void;
};

export const API_URL = '';

const getToken = () => localStorage.getItem('token');

export const RightSidebar: React.FC<Props> = ({ isMobile = false, onClose }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) return;

        const res = await fetch(`/api/users/photo`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (res.ok) {
          const data: UserPhoto = await res.json();
          setUser(prev => ({ ...prev, avatarUrl: data.url }));
        }
      } catch (err) {
        console.error('Error loading picture:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, []);

  const handleSettings = () => { 
    navigate("/settings");
    onClose?.();
  };
  
  const handleAbout = () => { 
    navigate("/about-us");
    onClose?.();
  };
  
  const handleAvatarClick = () => { 
    navigate('/profile');
    onClose?.();
  };

  // Mobile View
  if (isMobile) {
    return (
      <aside className="w-full h-full bg-white flex flex-col items-center py-8 px-6">
        <div className="mb-8" />

        <button
          onClick={handleAvatarClick}
          className="w-24 h-24 rounded-full overflow-hidden border-4 border-black flex items-center justify-center bg-white focus:outline-none hover:border-gray-700 transition-all duration-300 shadow-lg animate-scaleIn"
        >
          {loading ? (
            <div className="w-20 h-20 bg-black rounded-full animate-pulse" />
          ) : user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="User avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-black rounded-full" />
          )}
        </button>

        <div className="flex-1" />

        <div className="w-full flex flex-col space-y-4 animate-fadeInUp">
          <button
            onClick={handleAvatarClick}
            className="w-full py-4 px-6 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            Profile
          </button>
          
          <button
            onClick={handleSettings}
            className="w-full py-4 px-6 bg-white border-2 border-black text-black rounded-xl hover:bg-gray-100 transition-all duration-200 font-semibold text-lg transform hover:scale-[1.02]"
          >
            Settings
          </button>
          
          <button
            onClick={handleAbout}
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

  // Desktop View
  return (
    <aside className="w-[100px] bg-white flex flex-col items-center py-6 h-full fixed right-0 top-0">
      <div className="mb-6" />

      <button
        onClick={handleAvatarClick}
        className="w-14 h-14 rounded-full overflow-hidden border-2 border-black flex items-center justify-center bg-white focus:outline-none hover:bg-gray-200 transition-colors duration-200"
      >
        {loading ? (
          <div className="w-12 h-12 bg-black rounded-full animate-pulse" />
        ) : user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="User avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-black rounded-full" />
        )}
      </button>

      <div className="flex-1" />

      <div className="flex flex-col items-center space-y-4 pb-4 text-sm text-black tracking-wider font-semibold">
        <button
          onClick={handleSettings}
          className="hover:text-gray-600 px-0 py-0 bg-transparent transition-colors duration-200"
        >
          Settings
        </button>
        <button
          onClick={handleAbout}
          className="hover:text-gray-600 px-0 py-0 bg-transparent transition-colors duration-200"
        >
          About us
        </button>
      </div>
    </aside>
  );
};