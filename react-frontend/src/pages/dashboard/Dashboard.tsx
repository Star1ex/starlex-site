import React, { useState, useEffect } from 'react';
import { TabsPanel } from '@/widgets/TabsPanel/TabsPanel.js';
import { NewTabModal } from '@/widgets/NewTabModal/NewTabModal.js';
import { RightSidebar } from '@/widgets/ProfilePanel/ProfilePanel.js'; 
import { useModal } from '@/shared/hooks/useModal.js';
import { Menu, X } from 'lucide-react';

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
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

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
      {/* Mobile Menu Button (Right Sidebar Toggle) */}
      <button
        onClick={() => setRightSidebarOpen(true)}
        className="md:hidden fixed top-4 right-4 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-black text-white shadow-lg hover:bg-gray-800 transition-all duration-200"
      >
        <Menu size={20} />
      </button>

      <div className="flex h-screen">
        {/* Left Sidebar - TabsPanel - Desktop: sidebar, Mobile: full screen with teams grid */}
        <div className="w-full md:w-[320px] md:flex-shrink-0 bg-white text-black transition-colors duration-300 md:border-r md:border-gray-200">
          <TabsPanel
            tabs={teams.map(t => ({ id: t.id, name: t.name, emails: t.emails }))}
            onAddClick={onOpen}
          />
        </div>

        {/* Main Content - Hidden on mobile, shown on desktop */}
        <main className="hidden md:block flex-1 bg-white transition-colors duration-300 p-8 overflow-y-auto">
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
              <div dangerouslySetInnerHTML={{ __html: markdownText || '<p>TeamTrack v1.0</p>' }} />
            </div>
          )}
        </main>

        {/* Right Sidebar - Desktop only */}
        <div className="hidden md:block w-[100px] flex-shrink-0 bg-white text-black transition-colors duration-300">
          <RightSidebar />
        </div>

        {/* Mobile Sliding Right Sidebar */}
        <>
          {/* Overlay */}
          <div
            className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
              rightSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setRightSidebarOpen(false)}
          />
          
          {/* Sliding Panel */}
          <div
            className={`md:hidden fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
              rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <button
              onClick={() => setRightSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors duration-200"
            >
              <X size={20} />
            </button>
            
            <RightSidebar isMobile={true} onClose={() => setRightSidebarOpen(false)} />
          </div>
        </>
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