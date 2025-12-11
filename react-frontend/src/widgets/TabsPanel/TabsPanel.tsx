import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

export const API_URL = import.meta.env.VITE_API_URL ?? '';

const getToken = () => localStorage.getItem('token');

export const TabsPanel = ({ tabs, onAddClick }: Props) => {
  const navigate = useNavigate();
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUserTeams() {
      try {
        setLoading(true);
        setError('');
        
        const token = getToken();
        if (!token) {
          setError('Not auth');
          return;
        }

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
        setUserTeams(data);
      } catch (err) {
        console.error(err);
        setError('Error loading teams');
      } finally {
        setLoading(false);
      }
    }

    fetchUserTeams();
  }, []);

  const handleTeamClick = (teamId: string) => {
    navigate(`/team/${teamId}`);
  };

  const allTabs = [...userTeams.map(team => ({
    id: team.team_id,
    name: team.name,
    emails: [], 
  })), ...tabs];

  return (
    <aside className="w-full bg-white p-4 flex flex-col transition-colors duration-300">
      <div className="flex items-center justify-between px-2 py-2">
        <h3 className="tracking-widest text-xs text-black uppercase transition-colors duration-300">TEAMS</h3>
        <button
          onClick={onAddClick}
          className="w-7 h-7 flex items-center justify-center rounded bg-transparent border border-black text-black hover:bg-gray-200 transition-colors duration-200"
          title="New Tab"
          disabled={loading}
        >
          +
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-black transition-colors duration-300">
          Loading teams...
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-black transition-colors duration-300">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-black underline hover:text-gray-700 transition-colors duration-200"
          >
            Try again
          </button>
        </div>
      ) : allTabs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-black transition-colors duration-300">
          <p className="mb-1">No tabs yet</p>
          <button
            onClick={onAddClick}
            className="text-black hover:text-gray-700 underline transition-colors duration-200"
          >
            Create your first team
          </button>
        </div>
      ) : (
        <ul className="mt-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {allTabs.map(tab => (
            <li key={tab.id}>
              <button
                onClick={() => handleTeamClick(tab.id)}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-200 text-black transition-colors duration-200"
                title={tab.emails.join(', ')}
              >
                {tab.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};
