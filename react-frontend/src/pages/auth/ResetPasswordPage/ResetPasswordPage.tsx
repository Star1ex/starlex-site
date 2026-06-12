import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/api/index.js';
import { getApiErrorMessage } from '@/shared/lib/apiError.js';
import { PasswordStrengthMeter } from '@/shared/ui/PasswordStrengthMeter.js';
import { Glass } from '@/shared/ui/glass/index.js';

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
    <div className="auth-page min-h-screen flex items-center justify-center p-4">
      <Glass variant="modal" depth="floating" as="form" className="w-full max-w-sm p-8 space-y-5" onSubmit={handleSubmit}>
        <div className="text-center space-y-1.5">
          <p className="label-caps text-[color:var(--sx-text-subtle)] tracking-[0.25em]">Starlex</p>
          <h1 className="text-headline-lg font-hanken font-bold text-[color:var(--sx-text)]">Restore access</h1>
          <p className="text-body-sm text-[color:var(--sx-text-muted)]">Set a new password to regain access.</p>
        </div>

        {tokenFromUrl && (
          <div className="rounded-lg px-3 py-2.5 bg-[color:var(--sx-surface)]">
            <p className="text-xs text-[color:var(--sx-text-muted)]">
              Secure link detected. You can reset your password without entering a code.
            </p>
            <button
              type="button"
              onClick={() => setUseCode(!useCode)}
              className="mt-2 label-caps text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] transition-colors"
            >
              {useCode ? 'Use secure link' : 'Use code instead'}
            </button>
          </div>
        )}

        {message && (
          <div className="rounded-lg px-3 py-2 bg-[color:var(--status-done-bg)]">
            <p className="text-center text-sm text-[color:var(--status-done-text)] font-medium">{message}</p>
          </div>
        )}

        {errorMessage && (
          <p className="text-center text-sm text-[color:var(--sx-danger)] font-medium">{errorMessage}</p>
        )}

        {useCode && (
          <>
            <div>
              <label className="label-caps block text-[color:var(--sx-text-subtle)] mb-1.5">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="your@email.com"
                disabled={isSubmitting}
                className="glass-input w-full px-3 py-2.5 !rounded-[var(--radius-md)] text-body-md disabled:opacity-50"
              />
            </div>
            <div>
              <label className="label-caps block text-[color:var(--sx-text-subtle)] mb-1.5">Reset Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                type="text"
                placeholder="Enter the 6-digit code"
                disabled={isSubmitting}
                className="glass-input w-full px-3 py-2.5 !rounded-[var(--radius-md)] text-body-md disabled:opacity-50"
              />
            </div>
          </>
        )}

        <div>
          <label className="label-caps block text-[color:var(--sx-text-subtle)] mb-1.5">New Password</label>
          <div className="relative">
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              disabled={isSubmitting}
              className="glass-input w-full px-3 py-2.5 pr-10 !rounded-[var(--radius-md)] text-body-md disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              disabled={isSubmitting}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] transition-colors"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="label-caps block text-[color:var(--sx-text-subtle)] mb-1.5">Confirm Password</label>
          <div className="relative">
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your new password"
              disabled={isSubmitting}
              className="glass-input w-full px-3 py-2.5 pr-10 !rounded-[var(--radius-md)] text-body-md disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isSubmitting}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <PasswordStrengthMeter password={newPassword} />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[color:var(--sx-accent)] text-[color:var(--sx-accent-contrast)] font-semibold rounded-[var(--radius-md)] hover:brightness-110 transition-[filter] disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Updating...' : 'Reset Password'}
        </button>

        <p className="text-center text-sm text-[color:var(--sx-text-muted)]">
          Back to{' '}
          <button
            type="button"
            onClick={() => navigate('/sign-in')}
            disabled={isSubmitting}
            className="text-[color:var(--sx-text)] font-medium hover:text-[color:var(--sx-accent)] transition-colors"
          >
            Sign in
          </button>
        </p>
      </Glass>
    </div>
  );
};
