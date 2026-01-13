import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface ChangePasswordProps {
  onSubmit?: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({ onSubmit }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
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

    if (currentPassword === newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from current password' });
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement API call to change password
      // For now, this is just a prototype
      onSubmit?.({ currentPassword, newPassword, confirmPassword });
      setMessage({ type: 'success', text: 'Password change feature coming soon!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
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
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
          Change Password
        </h3>
        <p className="text-sm text-gray-600 dark:text-dark-text-muted">
          Update your password to keep your account secure
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {passwordField(
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
                ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Updating...
            </>
          ) : (
            'Update Password'
          )}
        </button>
      </form>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          <strong>Note:</strong> This is a prototype for the password change feature. Implementation coming soon!
        </p>
      </div>
    </div>
  );
};
