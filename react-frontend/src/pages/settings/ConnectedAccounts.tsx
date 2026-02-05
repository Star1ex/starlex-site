import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, userService } from '@/services/api/index.js';

type Provider = 'local' | 'google' | 'github';

export const ConnectedAccounts: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Provider | null>(null);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<any>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getProfile();
      setProfile(data);
    } catch (err) {
      setError('Failed to load connected accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const authProviders = useMemo(() => {
    const providers = Array.isArray(profile?.auth_providers) ? profile.auth_providers : [];
    return providers;
  }, [profile]);

  const hasProvider = (provider: Provider) => authProviders.includes(provider);
  const canUnlink = (provider: Provider) => authProviders.filter((p: string) => p !== provider).length > 0;

  const handleLink = async (provider: Provider) => {
    setError('');
    setActionLoading(provider);
    try {
      if (provider === 'google') {
        const { auth_url } = await authService.linkGoogle();
        window.location.href = auth_url;
        return;
      }
      if (provider === 'github') {
        const { auth_url } = await authService.linkGithub();
        window.location.href = auth_url;
        return;
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to start linking.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlink = async (provider: Provider) => {
    setError('');
    setActionLoading(provider);
    try {
      if (provider === 'google') {
        await authService.unlinkGoogle();
      } else if (provider === 'github') {
        await authService.unlinkGithub();
      }
      await loadProfile();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to unlink account.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full text-center py-10 text-gray-600">Loading connected accounts...</div>
    );
  }

  return (
    <div className="w-full text-left">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-dark-text">Connected Accounts</h2>
        <p className="text-sm text-gray-600 dark:text-dark-text-muted mt-1">
          Manage how you sign in and link additional providers.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <AccountRow
          title="Password"
          description={hasProvider('local') ? 'Password is set' : 'No password set'}
          status={hasProvider('local') ? 'Connected' : 'Not connected'}
          actionLabel={hasProvider('local') ? 'Change Password' : 'Set Password'}
          onAction={() => navigate('/settings?tab=password')}
        />

        <AccountRow
          title="Google"
          description="Use your Google account to sign in"
          status={hasProvider('google') ? 'Connected' : 'Not connected'}
          actionLabel={hasProvider('google') ? 'Disconnect' : 'Connect'}
          onAction={() => (hasProvider('google') ? handleUnlink('google') : handleLink('google'))}
          disabled={actionLoading !== null || (hasProvider('google') && !canUnlink('google'))}
          helper={
            hasProvider('google') && !canUnlink('google')
              ? 'At least one sign-in method must remain connected.'
              : undefined
          }
          loading={actionLoading === 'google'}
        />

        <AccountRow
          title="GitHub"
          description="Use your GitHub account to sign in"
          status={hasProvider('github') ? 'Connected' : 'Not connected'}
          actionLabel={hasProvider('github') ? 'Disconnect' : 'Connect'}
          onAction={() => (hasProvider('github') ? handleUnlink('github') : handleLink('github'))}
          disabled={actionLoading !== null || (hasProvider('github') && !canUnlink('github'))}
          helper={
            hasProvider('github') && !canUnlink('github')
              ? 'At least one sign-in method must remain connected.'
              : undefined
          }
          loading={actionLoading === 'github'}
        />
      </div>
    </div>
  );
};

type AccountRowProps = {
  title: string;
  description: string;
  status: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  helper?: string;
  loading?: boolean;
};

const AccountRow: React.FC<AccountRowProps> = ({
  title,
  description,
  status,
  actionLabel,
  onAction,
  disabled,
  helper,
  loading,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-dark-text">{title}</p>
        <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">{description}</p>
        <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-dark-text-muted mt-2">{status}</p>
        {helper && <p className="text-[11px] text-gray-500 dark:text-dark-text-muted mt-2">{helper}</p>}
      </div>
      <button
        onClick={onAction}
        disabled={disabled}
        className="px-4 py-2 rounded-full border border-black dark:border-white text-black dark:text-white text-xs font-semibold tracking-wide hover:bg-gray-100 dark:hover:bg-dark-border transition-colors disabled:opacity-50"
      >
        {loading ? 'Working...' : actionLabel}
      </button>
    </div>
  );
};

