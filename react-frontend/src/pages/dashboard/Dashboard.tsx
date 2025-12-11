import React, { useState, useEffect } from 'react';
import { TabsPanel } from '@/widgets/TabsPanel/TabsPanel.js';
import { NewTabModal } from '@/widgets/NewTabModal/NewTabModal.js';
import { RightSidebar } from '@/widgets/ProfilePanel/ProfilePanel.js'; 
import { useModal } from '@/shared/hooks/useModal.js';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

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
  const { open, onOpen, onClose } = useModal(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [markdownText, setMarkdownText] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const userId = getUserIdFromToken(token);
      setCanEdit(userId === ALLOWED_USER_ID);
    }
    setLoading(false);
  }, []);

  const handleTeamCreated = (team: Team) => {
    setTeams(prev => [...prev, team]);
  };

return (
    <div className="min-h-screen bg-white transition-colors duration-300">
      <div className="flex h-screen">
        {/* Left Sidebar - TabsPanel */}
        <div className="w-[320px] flex-shrink-0 bg-white text-black transition-colors duration-300 border-r border-gray-200">
            <TabsPanel
              tabs={teams.map(t => ({ id: t.id, name: t.name, emails: t.emails }))}
              onAddClick={onOpen}
          />
        </div>


        {/* Main Content */}
        <main className="flex-1 bg-white transition-colors duration-300 p-8 overflow-y-auto">
          {loading ? (
            <div className="max-w-4xl mx-auto h-96 flex items-center justify-center">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : canEdit ? (
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
              <div dangerouslySetInnerHTML={{ __html: markdownText || '<p>Hi</p>' }} />
            </div>
          )}
        </main>

        {/* Right Sidebar - Profile Panel */}
        <div className="w-[100px] flex-shrink-0 bg-white text-black transition-colors duration-300">
          <RightSidebar />
        </div>
      </div>

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
