import React, { useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { authService } from '@/services/api/index.js';

const inputCls = 'w-full px-3 py-2.5 rounded-xl text-body-md text-white bg-white/5 border border-white/10 outline-none focus:border-white/25 transition-all disabled:opacity-40 placeholder:text-white/30';

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
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-900/20 border border-green-400/20">
        <Check size={16} className="text-green-400 flex-shrink-0" />
        <span className="text-body-md text-green-300">Email updated successfully. Sign in again to refresh your session.</span>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-5 border-t border-white/8">
      <div className="flex items-center gap-2 mb-4">
        <Mail size={14} className="text-white/40" />
        <h3 className="label-caps text-white/40">Change email</h3>
      </div>

      <p className="text-label-sm text-white/40 mb-4">
        Current: <span className="text-white/60">{currentEmail}</span>
      </p>

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
          {error && <p className="text-label-sm text-[#fca5a5]">{error}</p>}
          <button
            type="submit"
            disabled={loading || !newEmail.trim()}
            className="liquid-button !bg-[--accent] !border-transparent !text-white font-medium disabled:opacity-40 text-sm"
          >
            {loading ? 'Sending code…' : 'Send verification code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-3">
          <p className="text-label-sm text-white/50">
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
          {error && <p className="text-label-sm text-[#fca5a5]">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError(''); }}
              disabled={loading}
              className="liquid-button text-sm"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="liquid-button !bg-[--accent] !border-transparent !text-white font-medium disabled:opacity-40 text-sm"
            >
              {loading ? 'Verifying…' : 'Confirm change'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
