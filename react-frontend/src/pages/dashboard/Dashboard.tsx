import React, { useState, useEffect } from 'react';
import { NewTabModal } from '@/widgets/NewTabModal/NewTabModal.js';
import { useModal } from '@/shared/hooks/useModal.js';
import { useNavigate } from 'react-router-dom';
import { getAuthUser } from '@/shared/lib/authManager.js';
import { userService, authService } from '@/services/api/index.js';

type Team = {
  id: string;
  name: string;
  description: string;
  emails: string[];
};

type RecentTask = {
  id: string;
  title: string;
  openedAt: number;
};

const RECENT_TASKS_KEY = 'recentTasks';

const ALLOWED_USER_ID = import.meta.env.VITE_ALLOWED_USER_ID || 'f8634233-48f0-4ae3-8924-8ca482b6fb62';

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

const getUserNameFromToken = (token: string): string => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return 'User';
    const decoded = JSON.parse(atob(payload));
    const firstName = decoded.firstName || decoded.first_name || '';
    const lastName = decoded.lastName || decoded.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'User';
  } catch (err) {
    return 'User';
  }
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { open, onOpen, onClose } = useModal(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [markdownText, setMarkdownText] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/sign-in');
      return;
    }

    const storedUser = getAuthUser();
    const userId = storedUser?.id || storedUser?.user_id || null;
    setCanEdit(userId === ALLOWED_USER_ID);

    if (storedUser && (storedUser.firstName || storedUser.first_name)) {
      const firstName = storedUser.firstName || storedUser.first_name || '';
      const lastName = storedUser.lastName || storedUser.last_name || '';
      setUserName(`${firstName} ${lastName}`.trim() || 'User');
    }

    const fetchUser = async () => {
      try {
        const userData = await userService.getProfile();
        const firstName = userData.firstName || '';
        const lastName = userData.lastName || '';
        setUserName(`${firstName} ${lastName}`.trim() || 'User');
      } catch (err: any) {
        if (err?.response?.status === 401) {
          navigate('/sign-in');
        } else {
          console.error('Error fetching user:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const loadRecent = () => {
      try {
        const raw = localStorage.getItem(RECENT_TASKS_KEY);
        const parsed = raw ? (JSON.parse(raw) as RecentTask[]) : [];
        const next = parsed
          .filter((t) => t && t.id)
          .sort((a, b) => b.openedAt - a.openedAt)
          .slice(0, 3);
        setRecentTasks(next);
      } catch {
        setRecentTasks([]);
      }
    };
    loadRecent();
    window.addEventListener('storage', loadRecent);
    return () => window.removeEventListener('storage', loadRecent);
  }, []);

  const handleTeamCreated = (team: Team) => {
    setTeams(prev => [...prev, team]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg transition-colors">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-dark-text-muted font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white dark:bg-dark-bg transition-colors duration-300">
      {/* Main Content */}
      <main className="flex-1 bg-white dark:bg-dark-bg transition-colors duration-300 p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-dark-text mb-2">
              Hi {userName.split(' ')[0] || 'there'}
            </h1>
          </div>

          {recentTasks.length > 0 && (
            <div className="mb-10">
              <h2 className="text-sm uppercase tracking-[0.2em] text-gray-500 dark:text-dark-text-muted mb-3">
                Recent
              </h2>
              <div className="space-y-2">
                {recentTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => navigate(`/task/${task.id}`)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                      {task.title || 'Untitled'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {canEdit ? (
            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-surface rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-4">Edit Content</h2>
                <textarea
                  value={markdownText}
                  onChange={(e) => setMarkdownText(e.target.value)}
                  placeholder="Write text in Markdown format..."
                  className="w-full h-96 p-4 border border-gray-200 dark:border-dark-border rounded-lg font-mono text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text transition-colors"
                />
              </div>
              {markdownText && (
                <div className="prose prose-lg dark:prose-invert max-w-none bg-white dark:bg-dark-surface rounded-lg p-6">
                  <div dangerouslySetInnerHTML={{ __html: markdownText }} />
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
            </div>
          )}
        </div>
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
