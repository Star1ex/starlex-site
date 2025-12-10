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

export const API_URL = '';

const getToken = () => localStorage.getItem('token');

export const RightSidebar: React.FC = () => {
  const navigate = useNavigate()
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

  const handleSettings = () => { navigate("/settings") };
  const handleAbout = () => { navigate("/about-us") };
  const handleAvatarClick = () => { navigate('/profile'); };

  return (
    <aside className="w-[80px] border-l border-black bg-white flex flex-col items-center py-6 h-full fixed right-0 top-0">
      <div className="mb-6" />

      <button
        onClick={handleAvatarClick}
        className="w-10 h-10 rounded-full overflow-hidden border border-black flex items-center justify-center bg-white focus:outline-none hover:bg-gray-200 transition-colors duration-200"
      >
        {loading ? (
          <div className="w-8 h-8 bg-black rounded-full animate-pulse" />
        ) : user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="User avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-black rounded-full" />
        )}
      </button>

      <div className="flex-1" />

      <div className="flex flex-col items-center space-y-3 pb-4 text-xs text-black tracking-wider font-medium">
        <button
          onClick={handleSettings}
          className="hover:text-gray-700 px-0 py-0 bg-transparent transition-colors duration-200"
        >
          Settings
        </button>
        <button
          onClick={handleAbout}
          className="hover:text-gray-700 px-0 py-0 bg-transparent transition-colors duration-200"
        >
          About us
        </button>
      </div>
    </aside>
  );
};
