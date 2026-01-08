import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Avatar from '@/shared/ui/Avatar.js';
import { getAuthToken } from '@/shared/lib/authManager.js';
import type { User } from '@/entities/types.js';

interface PublicUserProfile extends User {
  email?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
}

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
        const token = getAuthToken();
        if (!token) {
          navigate('/sign-in');
          return;
        }

        setLoading(true);
        setError(null);

        // Check if user data was passed via location state (from team members)
        const userFromState = location.state?.user as any;
        if (userFromState && (userFromState.id === userId || !userFromState.id)) {
          const normalizedUser: PublicUserProfile = {
            id: userFromState.id || userId,
            firstName: userFromState.firstName || userFromState.first_name || '',
            lastName: userFromState.lastName || userFromState.last_name || '',
            email: userFromState.email || '',
            photo_url: userFromState.photo_url || null,
            role: userFromState.role,
          };
          setUser(normalizedUser);
          setLoading(false);
          return;
        }

        // Strategy: Try multiple endpoints in order
        // 1. Public profile endpoint
        let res = await fetch(`/api/users/${userId}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        
        // 2. Fallback to basic user endpoint
        if (!res.ok && res.status === 404) {
          res = await fetch(`/api/users/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          });
        }
        
        // 3. Try search by ID (if ID looks like email)
        if (!res.ok && res.status === 404 && userId.includes('@')) {
          res = await fetch(`/api/search/${encodeURIComponent(userId)}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          });
        }

        if (res.ok) {
          const data: any = await res.json();
          // Handle array response (from search)
          const userData = Array.isArray(data) ? data[0] : data;
          
          if (userData) {
            // Normalize user data structure
            const normalizedUser: PublicUserProfile = {
              id: userData.id || userId,
              firstName: userData.firstName || userData.first_name || '',
              lastName: userData.lastName || userData.last_name || '',
              email: userData.email || '',
              photo_url: userData.photo_url || null,
              role: userData.role,
            };
            setUser(normalizedUser);
          } else {
            setError('User profile not found');
          }
        } else if (res.status === 404) {
          setError('User profile not found. The user may not exist or you may not have permission to view their profile.');
        } else {
          const errorData = await res.json().catch(() => ({ message: 'Failed to load user profile' }));
          setError(errorData.message || errorData.error || 'Failed to load user profile');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, navigate, location.state]);

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-white dark:bg-dark-bg transition-colors">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-dark-text-muted font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-full flex items-center justify-center bg-white dark:bg-dark-bg transition-colors px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-2">Profile Not Found</h2>
          <p className="text-gray-600 dark:text-dark-text-muted mb-6">{error || 'This user profile does not exist.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-900 dark:hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white dark:bg-dark-bg transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-dark-text-muted hover:text-gray-900 dark:hover:text-dark-text transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text">User Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
              {/* Avatar */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-gray-200 dark:border-dark-border flex items-center justify-center">
                  <Avatar user={user} size="lg" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">
                  {user.firstName || user.first_name || ''} {user.lastName || user.last_name || ''}
                </h2>
                
                {user.email && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-dark-text-muted">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm sm:text-base break-all">{user.email}</span>
                    </div>
                  </div>
                )}

                {user.role && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-dark-text rounded-full text-sm font-medium">
                      {user.role}
                    </span>
                  </div>
                )}

                {/* Additional Info */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-dark-text-muted">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Team Member</span>
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

