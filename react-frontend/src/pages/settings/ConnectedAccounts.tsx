import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, userService } from '@/services/api/index.js';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { EmailChange } from './EmailChange.js';

type Provider = 'local' | 'google' | 'github';

interface ConnectedProfile {
  auth_providers?: string[];
  email?: string;
}

function getErrorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error || fallback;
}

export const ConnectedAccounts: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Provider | null>(null);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<ConnectedProfile | null>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getProfile();
      setProfile(data);
    } catch {
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
  const canUnlink = (provider: Provider) => authProviders.filter((p) => p !== provider).length > 0;

  const handleLink = async (provider: Provider) => {
    setError('');
    setActionLoading(provider);
    try {
      if (provider === 'google') {
        const { auth_url } = await authService.linkGoogle('/settings?tab=accounts');
        window.location.href = auth_url;
        return;
      }
      if (provider === 'github') {
        const { auth_url } = await authService.linkGithub('/settings?tab=accounts');
        window.location.href = auth_url;
        return;
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to start linking.'));
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to unlink account.'));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-section text-center text-white/40">Loading connected accounts...</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <section className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">Connected accounts</h3>
          <p className="settings-section-description">
            Manage how you sign in and link additional providers.
          </p>
        </div>

        {error && (
          <div className="settings-message settings-message--error mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <AccountRow
            title="Password"
            description={hasProvider('local') ? 'Password is set' : 'No password set'}
            status={hasProvider('local') ? 'Connected' : 'Not connected'}
            actionLabel={hasProvider('local') ? 'Change Password' : 'Set Password'}
            onAction={() => navigate('/settings?tab=password')}
          />


          <AccountRow
            title="Google"
            icon={<FaGoogle className="size-4" />}
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
            icon={<FaGithub className="size-4" />}
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
      </section>

      {profile?.email && <EmailChange currentEmail={profile.email} />}
    </div>
  );
};

type AccountRowProps = {
  title: string;
  icon?: React.ReactNode;
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
  icon,
  description,
  status,
  actionLabel,
  onAction,
  disabled,
  helper,
  loading,
}) => {
  return (
    <div className="settings-row flex-col sm:flex-row sm:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon && <span className="settings-row-icon !size-7">{icon}</span>}
          <p className="settings-row-title">{title}</p>
        </div>
        <p className="settings-row-description">{description}</p>
        <p className="settings-status-pill mt-2">{status}</p>
        {helper && <p className="settings-hint mt-2">{helper}</p>}
      </div>
      <button
        onClick={onAction}
        disabled={disabled}
        className="settings-button shrink-0"
      >
        {loading ? 'Working...' : actionLabel}
      </button>
    </div>
  );
};
