import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Token } from '@/app/api/token.js';

const getToken = () => Token.get();

type Team = { 
  team_id: string; 
  name: string; 
  description?: string; 
};

type Tab = { id: string; name: string; emails: string[] };

type Props = {
  tabs: Tab[];
  onAddClick: () => void;
};

type ContextMenu = {
  x: number;
  y: number;
  teamId: string;
  teamName: string;
};

const getUserIdFromToken = (token: string): { firstName: string; lastName: string } | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return {
      firstName: decoded.firstName || decoded.first_name || 'User',
      lastName: decoded.lastName || decoded.last_name || '',
    };
  } catch (err) {
    console.error('Error decoding token:', err);
    return null;
  }
};

export const TabsPanel = ({ tabs, onAddClick }: Props) => {
  const navigate = useNavigate();
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');
  const [userName, setUserName] = useState<{ firstName: string; lastName: string } | null>(null);

  useEffect(() => {
    async function fetchUserTeams() {
      try {
        setLoading(true);
        setError('');
        
        const token = getToken();
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const userInfo = getUserIdFromToken(token);
        setUserName(userInfo);

        const res = await fetch(`/api/users/teams`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        
        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }

        const data: Team[] = await res.json();
        setUserTeams(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Error loading teams');
      } finally {
        setLoading(false);
      }
    }

    fetchUserTeams();
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const handleContextMenu = (e: MouseEvent) => {
      if (contextMenu) {
        const target = e.target as HTMLElement;
        if (!target.closest('.context-menu')) {
          e.preventDefault();
        }
      }
    };

    if (contextMenu) {
      document.addEventListener('click', handleClick);
      document.addEventListener('contextmenu', handleContextMenu);
    }
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent, teamId: string, teamName: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      teamId,
      teamName
    });
  };

  const handleDelete = async () => {
    if (!contextMenu) return;

    setDeleteStatus('deleting');
    const token = getToken();

    try {
      const res = await fetch(`/api/team/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          team_id: contextMenu.teamId
        })
      });

      if (res.ok) {
        setUserTeams(userTeams.filter(t => t.team_id !== contextMenu.teamId));
        setDeleteStatus('success');
        setTimeout(() => setDeleteStatus('idle'), 2000);
      } else {
        setDeleteStatus('error');
        setTimeout(() => setDeleteStatus('idle'), 3000);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setDeleteStatus('error');
      setTimeout(() => setDeleteStatus('idle'), 3000);
    }

    setContextMenu(null);
  };

  const handleTeamClick = (teamId: string) => {
    navigate(`/team/${teamId}`);
  };

  const allTabs = [...userTeams.map(team => ({
    id: team.team_id,
    name: team.name,
    emails: [], 
  })), ...tabs];

  const displayName = userName ? `${userName.firstName}${userName.lastName ? ` ${userName.lastName}` : ''}'s` : 'My';

  return (
    <>
      {deleteStatus !== 'idle' && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          deleteStatus === 'success' ? 'bg-green-500 text-white' :
          deleteStatus === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {deleteStatus === 'success' ? '✓ Team deleted' :
           deleteStatus === 'error' ? '✗ Delete failed' :
           '⟳ Deleting...'}
        </div>
      )}

      {contextMenu && (
        <div
          className="context-menu fixed bg-white border border-gray-300 rounded-lg shadow-xl py-1 z-50"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            minWidth: '160px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200">
            {contextMenu.teamName}
          </div>
          
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center gap-2"
          >
            <span>🗑️</span>
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Mobile View - Full Screen Grid */}
      <div className="md:hidden w-full min-h-screen bg-white p-4 pb-20">
        <div className="flex items-center justify-between px-2 py-4 mb-6">
          <h3 className="tracking-widest text-lg font-bold text-black uppercase">TEAMS</h3>
          <button
            onClick={onAddClick}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-black text-white text-2xl hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            title="New Team"
            disabled={loading}
          >
            +
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-black animate-pulse text-lg">Loading teams...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-black text-lg mb-3">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200"
            >
              Try again
            </button>
          </div>
        ) : allTabs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-black text-xl mb-4">No teams yet</p>
            <button
              onClick={onAddClick}
              className="px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 font-semibold shadow-lg"
            >
              Create your first team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {allTabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => handleTeamClick(tab.id)}
                onContextMenu={(e) => handleContextMenu(e, tab.id, tab.name)}
                className="w-full p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-black hover:shadow-xl text-left transition-all duration-300 transform hover:scale-[1.02] animate-fadeIn"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'both'
                }}
                title={tab.emails.join(', ')}
              >
                <h3 className="text-xl font-bold text-black mb-2">{tab.name}</h3>
                {tab.emails.length > 0 && (
                  <p className="text-sm text-gray-600 font-medium">
                    {tab.emails.length} member{tab.emails.length !== 1 ? 's' : ''}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(15px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out;
          }
        `}</style>
      </div>

      {/* Desktop View - Notion-like Sidebar */}
      <aside className="hidden md:flex w-full bg-[#F7F6F3] flex-col h-full overflow-hidden">
        {/* User Workspace Header */}
        <div className="px-3 py-2.5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 truncate">{displayName}</span>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
              <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-2 py-2 space-y-0.5">
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200 text-sm text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search</span>
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200 text-sm text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200 text-sm text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span>Meetings</span>
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200 text-sm text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>TeamTrack AI</span>
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200 text-sm text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <span>Inbox</span>
          </button>
        </div>

        {/* Private Section */}
        <div className="px-3 py-2 mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Private</span>
            <button
              onClick={onAddClick}
              className="p-0.5 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Add new"
            >
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="space-y-0.5">
            {loading ? (
              <div className="px-2 py-1.5 text-xs text-gray-500">Loading...</div>
            ) : error ? (
              <div className="px-2 py-1.5 text-xs text-red-600">{error}</div>
            ) : allTabs.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-gray-500">No teams yet</div>
            ) : (
              allTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTeamClick(tab.id)}
                  onContextMenu={(e) => handleContextMenu(e, tab.id, tab.name)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200 text-sm text-gray-700 transition-colors text-left group"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate flex-1">{tab.name}</span>
                </button>
              ))
            )}
            <button
              onClick={onAddClick}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-200 text-sm text-gray-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add new</span>
            </button>
          </div>
        </div>

        {/* Shared Section - Placeholder */}
        <div className="px-3 py-2 mt-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Shared</span>
          <div className="mt-1 space-y-0.5">
            <div className="px-2 py-1.5 text-xs text-gray-400 italic">No shared teams</div>
          </div>
        </div>
      </aside>
    </>
  );
};
