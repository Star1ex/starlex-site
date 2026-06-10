import React, { useState, useRef, KeyboardEvent, ClipboardEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '@/services/api/index.js';
import { useAuth } from '@/contexts/useAuth.js';
import { getLastWorkspaceId } from '@/contexts/useWorkspace.js';
import { setAuthUser } from '@/shared/lib/authManager.js';
import { getApiErrorMessage } from '@/shared/lib/apiError.js';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state?.email as string) || '';
  const { login } = useAuth();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').charAt(0);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...code];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) { setErrorMessage('Please enter all 6 digits'); return; }
    if (!email) { setErrorMessage('Email is missing. Please try registering again.'); return; }

    setIsLoading(true);
    try {
      const result = await authService.verifyEmail({ email, code: verificationCode });

      if (result.access_token) {
        if (result.user) setAuthUser(result.user);
        await login(result.access_token);

        if (result.needs_onboarding) {
          navigate('/onboarding', { replace: true });
          return;
        }
        const lastId = getLastWorkspaceId();
        navigate(lastId ? `/workspace/${lastId}` : '/onboarding', { replace: true });
      } else {
        navigate('/sign-in', {
          replace: true,
          state: { message: 'Email verified! You can now sign in.' },
        });
      }
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err, 'Invalid verification code'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setErrorMessage('');
    setIsResending(true);
    try {
      await authService.resendCode({ email });
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err, 'Failed to resend code'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--sx-body-bg)' }}
    >
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="text-center mb-8">
          <p className="label-caps text-[color:var(--sx-text-subtle)] tracking-[0.25em] mb-3">STARLEX</p>
          <h1 className="text-headline-lg font-hanken font-bold text-[color:var(--sx-text)] mb-3">
            Check your email
          </h1>
          <p className="text-body-md text-[color:var(--sx-text-muted)]">
            We sent a 6-digit code to{' '}
            <span className="text-[color:var(--sx-text)] font-medium">{email || 'your email'}</span>
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 space-y-7">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* OTP inputs */}
            <div className="flex justify-center gap-2.5">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={isLoading}
                  className="w-11 h-14 text-center text-xl font-bold font-mono text-[color:var(--sx-text)] bg-[color:var(--sx-panel)] border border-[color:var(--sx-border)] rounded-xl focus:border-[color:var(--sx-border-strong)] focus:ring-1 focus:ring-[color:var(--sx-border-strong)] outline-none transition-all disabled:opacity-40"
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>

            {errorMessage && (
              <p className="text-center text-label-sm text-[#fca5a5]">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || code.join('').length !== 6}
              className="liquid-button w-full !justify-center !py-3 !rounded-xl disabled:opacity-40 !bg-[color:var(--starlex-accent)] !border-transparent !text-[color:var(--starlex-accent-contrast)] font-semibold"
            >
              {isLoading ? 'Verifying…' : 'Verify email'}
            </button>
          </form>

          <div className="text-center space-y-2 pt-1">
            <p className="text-label-sm text-[color:var(--sx-text-subtle)]">Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              className="text-label-sm text-[color:var(--sx-text-muted)] hover:text-[color:var(--sx-text)] transition-colors disabled:opacity-40"
            >
              {isResending ? 'Resending…' : 'Resend code'}
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate('/sign-in')}
            className="text-label-sm text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text-muted)] transition-colors"
          >
            ← Back to Sign In
          </button>
        </div>
      </motion.div>
    </div>
  );
};
