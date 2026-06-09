import React, { useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { authService } from '@/services/api/index.js';

const inputCls = 'settings-input';

type Step = 'email' | 'verify' | 'done';

interface EmailChangeProps {
  currentEmail: string;
}

export const EmailChange: React.FC<EmailChangeProps> = ({ currentEmail }) => {
  const [step, setStep] = useState<Step>('email');
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }
    if (trimmed === currentEmail) {
      setError('New email must be different from current email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.requestEmailChange({ new_email: trimmed });
      setStep('verify');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setError('Enter the verification code'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.confirmEmailChange({ code: code.trim() });
      setStep('done');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="settings-message settings-message--success flex items-center gap-3">
        <Check size={16} className="text-green-400 flex-shrink-0" />
        <span className="text-body-md text-green-300">Email updated successfully. Sign in again to refresh your session.</span>
      </div>
    );
  }

  return (
    <section className="settings-section settings-section--subtle">
      <div className="settings-section-header flex items-center gap-2">
        <span className="settings-row-icon !size-8">
          <Mail size={14} />
        </span>
        <div>
          <h3 className="settings-section-title">Change email</h3>
          <p className="settings-section-description">
            Current: <span className="text-white/65">{currentEmail}</span>
          </p>
        </div>
      </div>

      {step === 'email' ? (
        <form onSubmit={handleRequestChange} className="space-y-3">
          <input
            type="email"
            value={newEmail}
            onChange={e => { setNewEmail(e.target.value); setError(''); }}
            placeholder="New email address"
            disabled={loading}
            className={inputCls}
          />
          {error && <p className="settings-message settings-message--error">{error}</p>}
          <button
            type="submit"
            disabled={loading || !newEmail.trim()}
            className="settings-button settings-button--primary"
          >
            {loading ? 'Sending code…' : 'Send verification code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-3">
          <p className="settings-hint">
            We sent a code to <span className="text-white/70">{newEmail}</span>. Enter it below to confirm.
          </p>
          <input
            type="text"
            value={code}
            onChange={e => { setCode(e.target.value); setError(''); }}
            placeholder="6-digit code"
            maxLength={8}
            disabled={loading}
            className={`${inputCls} font-mono tracking-widest`}
          />
          {error && <p className="settings-message settings-message--error">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError(''); }}
              disabled={loading}
              className="settings-button"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="settings-button settings-button--primary"
            >
              {loading ? 'Verifying…' : 'Confirm change'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
