import React, { useState, useEffect } from 'react';

type UserProfile = {
  avatarUrl?: string;
  name?: string;
  email?: string;
};


export const API_URL = import.meta.env.VITE_API_URL ?? '';

const getToken = () => localStorage.getItem('token');

export const RightSidebar: React.FC = () => {
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
          const data: UserProfile = await res.json();
          setUser(data);
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
    window.open('/settings', '_blank');
  };

  const handleAbout = () => {
    window.open('/about', '_blank');
  };

  return (
    <aside className="w-[80px] border-l border-[#e7d3c8] bg-[#F3E6DE] flex flex-col items-center py-6 h-full fixed right-0 top-0">
      <div className="mb-6"></div>
      
      <div className="w-10 h-10 rounded-full overflow-hidden border border-[#d4a89a] flex items-center justify-center bg-[#ead4ca]">
        {loading ? (
          <div className="w-8 h-8 bg-[#d4a89a] rounded-full animate-pulse" />
        ) : user.avatarUrl ? (
          <img 
            src={user.avatarUrl} 
            alt="User avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-[#d4a89a] to-[#c69a8c] rounded-full" />
        )}
      </div>

        <div className="flex-1" />

       <div className="flex flex-col items-center space-y-3 pb-4 text-xs text-[#7b5a4f] tracking-wider font-medium">
        <button
          onClick={handleSettings}
          className="hover:text-[#60392f] px-0 py-0 bg-transparent"
        >
          Settings
        </button>
        <button
          onClick={handleAbout}
          className="hover:text-[#60392f] px-0 py-0 bg-transparent"
        >
          About us
        </button>
      </div>
    </aside>
  );
};
