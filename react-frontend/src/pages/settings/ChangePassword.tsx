import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authService, userService } from '@/services/api/index.js';
import { useAuth } from '@/contexts/useAuth.js';
import { PasswordStrengthMeter } from '@/shared/ui/PasswordStrengthMeter.js';
import { SecuritySessions } from './SecuritySessions.js';

interface ChangePasswordProps {
  onSubmit?: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
}

function getErrorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { status?: number; data?: { error?: string } } })?.response?.data?.error || fallback;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({ onSubmit }) => {
  const { login } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [requiresCurrent, setRequiresCurrent] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await userService.getProfile();
        const providers = Array.isArray(profile.auth_providers) ? profile.auth_providers : [];
        setRequiresCurrent(providers.includes('local'));
    } catch {
      setRequiresCurrent(true);
      }
    };
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if ((!currentPassword && requiresCurrent) || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setMessage({ type: 'error', text: 'Password must include uppercase, lowercase, number, and symbol' });
      return;
    }

    if (requiresCurrent && currentPassword === newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from current password' });
      return;
    }

    setLoading(true);
    try {
      const result = await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      onSubmit?.({ currentPassword, newPassword, confirmPassword });
      if (result?.access_token) {
        await login(result.access_token);
      }
      setMessage({ type: 'success', text: result?.message || 'Password updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) {
        setMessage({ type: 'error', text: getErrorMessage(err, 'Invalid password details') });
      } else {
        setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to update password') });
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordField = (
    label: string,
    value: string,
    onChange: (val: string) => void,
    showPassword: boolean,
    onToggleShow: () => void,
    placeholder: string
  ) => (
    <div className="settings-field">
      <label className="settings-label">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="settings-input pr-11"
        />
        <button
          type="button"
          onClick={onToggleShow}
          disabled={loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] transition-colors disabled:cursor-not-allowed"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="settings-page">
      <section className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">
            {requiresCurrent ? 'Change password' : 'Set password'}
          </h3>
          <p className="settings-section-description">
            {requiresCurrent ? 'Update your password to keep your account secure.' : 'Create a password for email sign-in.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {requiresCurrent && passwordField(
            'Current Password',
            currentPassword,
            setCurrentPassword,
            showCurrentPassword,
            () => setShowCurrentPassword(!showCurrentPassword),
            'Enter your current password'
          )}

          {passwordField(
            'New Password',
            newPassword,
            setNewPassword,
            showNewPassword,
            () => setShowNewPassword(!showNewPassword),
            'Enter your new password (min 8 characters)'
          )}

          <PasswordStrengthMeter password={newPassword} />

          {passwordField(
            'Confirm New Password',
            confirmPassword,
            setConfirmPassword,
            showConfirmPassword,
            () => setShowConfirmPassword(!showConfirmPassword),
            'Confirm your new password'
          )}

          {message && (
            <div
              className={`settings-message ${
                message.type === 'success' ? 'settings-message--success' : 'settings-message--error'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="settings-button settings-button--primary w-full"
          >
            {loading ? (
              <>
                <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              requiresCurrent ? 'Update Password' : 'Set Password'
            )}
          </button>
        </form>
      </section>

      <SecuritySessions />
    </div>
  );
};
