import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authService, userService } from '@/services/api/index.js';
import { useAuth } from '@/contexts/AuthContext.js';
import { PasswordStrengthMeter } from '@/shared/ui/PasswordStrengthMeter.js';
import { SecuritySessions } from './SecuritySessions.js';

interface ChangePasswordProps {
  onSubmit?: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
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
      } catch (err) {
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
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) {
        setMessage({ type: 'error', text: err?.response?.data?.error || 'Invalid password details' });
      } else {
        setMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to update password' });
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
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="w-full px-0 py-2 bg-transparent border-0 border-b border-gray-200/80 dark:border-dark-border/60 text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-0 focus:border-gray-400 dark:focus:border-dark-text-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        />
        <button
          type="button"
          onClick={onToggleShow}
          disabled={loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text transition-colors disabled:cursor-not-allowed"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
          {requiresCurrent ? 'Change Password' : 'Set Password'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-dark-text-muted">
          {requiresCurrent ? 'Update your password to keep your account secure' : 'Create a password for email sign-in'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left max-w-2xl mx-auto">
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
            className={`p-4 rounded-lg text-sm font-medium transition-all ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-gray-900 text-white dark:bg-white dark:text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Updating...
            </>
          ) : (
            requiresCurrent ? 'Update Password' : 'Set Password'
          )}
        </button>
      </form>

      <SecuritySessions />
    </div>
  );
};
