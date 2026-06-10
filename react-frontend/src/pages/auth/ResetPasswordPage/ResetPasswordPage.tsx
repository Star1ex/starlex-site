import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/api/index.js';
import { getApiErrorMessage } from '@/shared/lib/apiError.js';
import { PasswordStrengthMeter } from '@/shared/ui/PasswordStrengthMeter.js';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tokenFromUrl = params.get('token') || '';

  const [useCode, setUseCode] = useState(!tokenFromUrl);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePasswords = () => {
    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please enter and confirm your new password');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return false;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setErrorMessage('Password must include uppercase, lowercase, number, and symbol');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setMessage('');

    if (useCode) {
      if (!email || !email.includes('@') || !email.includes('.')) {
        setErrorMessage('Enter a valid email address');
        return;
      }
      if (!code) {
        setErrorMessage('Enter the reset code from your email');
        return;
      }
    } else if (!tokenFromUrl) {
      setErrorMessage('Reset token missing. Please use the reset link from your email.');
      return;
    }

    if (!validatePasswords()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword({
        email: useCode ? email : undefined,
        code: useCode ? code : undefined,
        token: useCode ? undefined : tokenFromUrl,
        new_password: newPassword,
      });

      setMessage('Password reset successful. Redirecting to sign in...');
      setTimeout(() => {
        navigate('/sign-in', { state: { message: 'Password reset successful. Please sign in.' } });
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err, 'Invalid or expired reset code'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-dark-bg transition-colors duration-300">
      <div className="flex flex-col md:flex-row w-full max-w-5xl overflow-hidden bg-white dark:bg-dark-surface">
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center items-start">
          <h1 className="text-4xl sm:text-5xl md:text-7xl text-black dark:text-dark-text font-serif mb-4 md:mb-6 transition-colors duration-300">
            Restore
          </h1>
          <div className="w-16 sm:w-24 md:w-1/3 h-0.5 bg-black dark:bg-dark-text mb-4 md:mb-6 transition-colors duration-300"></div>
          <p className="text-base sm:text-lg text-black dark:text-dark-text-muted transition-colors duration-300">
            Set a new password to regain access.
          </p>
        </div>

        <div className="auth-panel w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <form className="space-y-6 sm:space-y-7" onSubmit={handleSubmit}>
            {tokenFromUrl && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-xs text-gray-700">
                  Secure link detected. You can reset your password without entering a code.
                </p>
                <button
                  type="button"
                  onClick={() => setUseCode(!useCode)}
                  className="mt-2 text-xs uppercase tracking-wider text-black/70 hover:text-black transition-colors duration-200"
                >
                  {useCode ? 'Use secure link' : 'Use code instead'}
                </button>
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-center text-sm text-green-700 font-medium">
                  {message}
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-center text-sm text-red-700 font-medium">
                  {errorMessage}
                </p>
              </div>
            )}

            {useCode && (
              <>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-dark-text uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="your@email.com"
                    disabled={isSubmitting}
                    className="auth-input mt-1 w-full border-b border-black dark:border-dark-border focus:border-black dark:focus:border-dark-text focus:outline-none py-2 text-black dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted transition-colors duration-300 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-dark-text uppercase tracking-wider mb-1">
                    Reset Code
                  </label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    type="text"
                    placeholder="Enter the 6-digit code"
                    disabled={isSubmitting}
                    className="auth-input mt-1 w-full border-b border-black dark:border-dark-border focus:border-black dark:focus:border-dark-text focus:outline-none py-2 text-black dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted transition-colors duration-300 disabled:opacity-50"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-black dark:text-dark-text uppercase tracking-wider mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  disabled={isSubmitting}
                  className="auth-input mt-1 w-full border-b border-black dark:border-dark-border focus:border-black dark:focus:border-dark-text focus:outline-none py-2 text-black dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted transition-colors duration-300 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isSubmitting}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-dark-text-muted hover:text-black dark:hover:text-dark-text transition-colors"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-dark-text uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  disabled={isSubmitting}
                  className="auth-input mt-1 w-full border-b border-black dark:border-dark-border focus:border-black dark:focus:border-dark-text focus:outline-none py-2 text-black dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted transition-colors duration-300 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-dark-text-muted hover:text-black dark:hover:text-dark-text transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <PasswordStrengthMeter password={newPassword} />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 mt-6 sm:mt-8 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-md shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Reset Password'}
            </button>

            <p className="text-center text-sm text-black dark:text-dark-text pt-4 transition-colors duration-300">
              Back to{' '}
              <button
                type="button"
                onClick={() => navigate('/sign-in')}
                disabled={isSubmitting}
                className="text-black dark:text-dark-text font-medium hover:text-gray-700 dark:hover:text-dark-text-muted transition-colors duration-200"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
