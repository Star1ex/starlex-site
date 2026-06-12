import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import Avatar from '@/shared/ui/Avatar.js';
import { userService, authService } from '@/services/api/index.js';
import { searchService } from '@/services/api/index.js';
import type { User } from '@/entities/types.js';
import BreadcrumbBack from '@/shared/ui/BreadcrumbBack.js';

interface PublicUserProfile {
  id: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  photo_url?: string | null;
  avatar_url?: string | null;
}

type ProfileLocationState = {
  user?: Partial<PublicUserProfile>;
};

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setError('Invalid user ID');
        setLoading(false);
        return;
      }

      try {
        if (!authService.isAuthenticated()) {
          navigate('/sign-in');
          return;
        }

        setLoading(true);
        setError(null);

        // Check if user data was passed via location state (from team members)
        const userFromState = (location.state as ProfileLocationState | null)?.user;
        if (userFromState && (userFromState.id === userId || !userFromState.id)) {
          const normalizedUser: PublicUserProfile = {
            id: userFromState.id || userId,
            firstName: userFromState.firstName || '',
            lastName: userFromState.lastName || '',
            email: userFromState.email || '',
            photo_url: userFromState.photo_url || null,
            avatar_url: userFromState.avatar_url || null,
            role: userFromState.role,
          };
          setUser(normalizedUser);
          setLoading(false);
          return;
        }

        // Try public profile endpoint first
        try {
          const data = await userService.getUserProfileById(userId);
          const userData = data;
          const normalizedUser: PublicUserProfile = {
            id: userData.id || userId,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            photo_url: userData.photo_url || null,
            avatar_url: userData.avatar_url || null,
            role: userData.role,
          };
          setUser(normalizedUser);
        } catch {
          // Fallback to basic user endpoint
          try {
            const data = await userService.getUserById(userId);
            const userData = data;
            const normalizedUser: PublicUserProfile = {
              id: userData.id || userId,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              photo_url: userData.photo_url || null,
              avatar_url: userData.avatar_url || null,
              role: userData.role,
            };
            setUser(normalizedUser);
          } catch {
            // If looks like email, try search
            if (userId.includes('@')) {
              try {
                const results = await searchService.searchUsers(userId);
                const userData = Array.isArray(results) && results.length > 0 ? results[0] : null;
                if (userData) {
                  const normalizedUser: PublicUserProfile = {
                    id: userData.id || userId,
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email || '',
                    photo_url: userData.photo_url || null,
                    avatar_url: userData.avatar_url || null,
                    role: userData.role,
                  };
                  setUser(normalizedUser);
                } else {
                  setError('User profile not found');
                }
              } catch {
                setError('User profile not found');
              }
            } else {
              setError('User profile not found. The user may not exist or you may not have permission to view their profile.');
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, navigate, location.state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-bg transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-10 animate-pulse">
          <div className="mb-6 flex items-center justify-between">
            <div className="h-4 w-24 bg-gray-200 dark:bg-dark-border rounded-full" />
            <div className="h-3 w-20 bg-gray-200 dark:bg-dark-border rounded-full" />
          </div>
          <div className="rounded-2xl overflow-hidden border border-gray-200/40 dark:border-dark-border/40 bg-white dark:bg-dark-surface shadow-sm">
            <div className="px-8 py-6 border-b border-gray-100/50 dark:border-dark-border/40 bg-gray-50 dark:bg-dark-bg/40">
              <div className="h-6 w-40 bg-gray-200 dark:bg-dark-border rounded-full" />
              <div className="mt-2 h-3 w-56 bg-gray-200 dark:bg-dark-border rounded-full" />
            </div>
            <div className="p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/3 flex items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-gray-200 dark:bg-dark-border" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-dark-border rounded-full" />
                    <div className="h-3 w-24 bg-gray-200 dark:bg-dark-border rounded-full" />
                  </div>
                </div>
                <div className="lg:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-gray-200/40 dark:border-dark-border/40">
                      <div className="h-3 w-16 bg-gray-200 dark:bg-dark-border rounded-full" />
                      <div className="mt-3 h-4 w-40 bg-gray-200 dark:bg-dark-border rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-full flex items-center justify-center bg-white dark:bg-dark-bg transition-colors px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <TriangleAlert className="w-8 h-8 text-red-600 dark:text-red-400" strokeWidth={1.55} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-2">Profile Not Found</h2>
          <p className="text-gray-600 dark:text-dark-text-muted mb-6">{error || 'This user profile does not exist.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-[color:var(--starlex-accent)] text-[color:var(--starlex-accent-contrast)] rounded-lg hover:brightness-110 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
        <div className="mb-6 flex items-center justify-between">
          <BreadcrumbBack
            label={sessionStorage.getItem('prevRouteLabel') || 'Dashboard'}
            to={sessionStorage.getItem('prevRoutePath') || '/dashboard'}
          />
          <span className="text-xs font-medium text-gray-500 dark:text-dark-text-muted">Public profile</span>
        </div>

        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm">
          <div className="px-8 py-6 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/40">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-dark-text">User Profile</h1>
            <p className="text-sm text-gray-600 dark:text-dark-text-muted mt-1">View public account details</p>
          </div>
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/3 flex items-center gap-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-border bg-gray-100 dark:bg-dark-border flex items-center justify-center">
                  <Avatar user={user as User} size="lg" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                    {user.firstName || ''} {user.lastName || ''}
                  </div>
                  {user.role && (
                    <span className="inline-block mt-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-dark-text text-xs font-medium">
                      {user.role}
                    </span>
                  )}
                </div>
              </div>

              <div className="lg:flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.email && (
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
                      <div className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-dark-text-muted">Email</div>
                      <div className="mt-2 text-sm text-gray-800 dark:text-dark-text break-all">{user.email}</div>
                    </div>
                  )}
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-dark-text-muted">Role</div>
                    <div className="mt-2 text-sm text-gray-800 dark:text-dark-text">{user.role || 'Team Member'}</div>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-dark-text-muted">Status</div>
                    <div className="mt-2 text-sm text-gray-800 dark:text-dark-text">Active</div>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-dark-text-muted">Member Type</div>
                    <div className="mt-2 text-sm text-gray-800 dark:text-dark-text">Team Member</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
