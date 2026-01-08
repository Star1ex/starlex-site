import React, { useState, useEffect } from 'react';
import { NewTabModal } from '@/widgets/NewTabModal/NewTabModal.js';
import { useModal } from '@/shared/hooks/useModal.js';
import { useNavigate } from 'react-router-dom';

type Team = {
  id: string;
  name: string;
  description: string;
  emails: string[];
};

const ALLOWED_USER_ID = import.meta.env.VITE_ALLOWED_USER_ID || 'f8634233-48f0-4ae3-8924-8ca482b6fb62';

const getToken = () => localStorage.getItem('token');

const getUserIdFromToken = (token: string): string | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return decoded.userId || decoded.id || decoded.sub || null;
  } catch (err) {
    console.error('Error decoding token:', err);
    return null;
  }
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { open, onOpen, onClose } = useModal(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [markdownText, setMarkdownText] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/sign-in');
      return;
    }
    
    const userId = getUserIdFromToken(token);
    setCanEdit(userId === ALLOWED_USER_ID);
    setLoading(false);
  }, [navigate]);

  const handleTeamCreated = (team: Team) => {
    setTeams(prev => [...prev, team]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F6F3]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white transition-colors duration-300">
      {/* Main Content */}
      <main className="flex-1 bg-white transition-colors duration-300 p-8 overflow-y-auto">
        {canEdit ? (
          <div className="max-w-4xl mx-auto">
            <textarea
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              placeholder="Write text in Markdown format..."
              className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-black"
            />
            <div className="mt-8 prose prose-lg max-w-none prose-headings:text-black prose-strong:text-black prose-p:text-gray-700">
              <div dangerouslySetInnerHTML={{ __html: markdownText }} />
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto flex items-center justify-center text-gray-500 min-h-[50vh]">
            <div dangerouslySetInnerHTML={{ __html: markdownText || '<p>TeamTrack v1.0</p>' }} />
          </div>
        )}
      </main>

      {open && (
        <NewTabModal
          open={open}
          onClose={onClose}
          onTeamCreated={handleTeamCreated}
        />
      )}
    </div>
  );
};