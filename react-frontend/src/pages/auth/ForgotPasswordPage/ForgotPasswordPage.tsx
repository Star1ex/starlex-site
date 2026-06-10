import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/api/index.js';
import { getApiErrorInfo } from '@/shared/lib/apiError.js';
import { Glass } from '@/shared/ui/glass/index.js';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');

    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.requestPasswordReset({ email });
      setMessage(response?.message || 'If an account exists, a reset code was sent.');
    } catch (err: unknown) {
      const { status, data } = getApiErrorInfo(err);
      if (status === 429) {
        setMessage('If an account exists, a reset code was sent. Please try again later.');
      } else {
        setErrorMessage(data?.error || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page min-h-screen flex items-center justify-center p-4">
      <Glass variant="modal" depth="floating" as="form" className="w-full max-w-sm p-8 space-y-6" onSubmit={handleSubmit}>
        <div className="text-center space-y-1.5">
          <p className="label-caps text-[color:var(--sx-text-subtle)] tracking-[0.25em]">Starlex</p>
          <h1 className="text-headline-lg font-hanken font-bold text-[color:var(--sx-text)]">Reset password</h1>
          <p className="text-body-sm text-[color:var(--sx-text-muted)]">We will send a secure reset code.</p>
        </div>

        {message && (
          <div className="rounded-lg px-3 py-2 bg-[color:var(--status-done-bg)]">
            <p className="text-center text-sm text-[color:var(--status-done-text)] font-medium">{message}</p>
          </div>
        )}

        {errorMessage && (
          <p className="text-center text-sm text-[color:var(--sx-danger)] font-medium">{errorMessage}</p>
        )}

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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[color:var(--sx-accent)] text-[color:var(--sx-accent-contrast)] font-semibold rounded-[var(--radius-md)] hover:brightness-110 transition-[filter] disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending...' : 'Send Reset Code'}
        </button>

        <p className="text-center text-sm text-[color:var(--sx-text-muted)]">
          Remembered your password?{' '}
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
