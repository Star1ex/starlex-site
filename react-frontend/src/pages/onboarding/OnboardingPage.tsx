import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { workspaceService } from '@/services/api/index.js';
import { useWorkspace } from '@/contexts/WorkspaceContext.js';
import { Helmet } from 'react-helmet-async';

const ACCENT_PRESETS = [
  { label: 'Indigo',  value: '#6366f1' },
  { label: 'Violet',  value: '#8b5cf6' },
  { label: 'Sky',     value: '#0ea5e9' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber',   value: '#f59e0b' },
  { label: 'Rose',    value: '#f43f5e' },
  { label: 'Slate',   value: '#64748b' },
  { label: 'White',   value: '#c0c1ff' },
];

function WorkspacePreview({ name, color }: { name: string; color: string }) {
  const letter = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white font-hanken shadow-lifted transition-all duration-300"
      style={{ backgroundColor: color }}
    >
      {letter}
    </div>
  );
}

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [color, setColor] = useState(ACCENT_PRESETS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 200);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Give your workspace a name'); return; }
    setLoading(true);
    setError('');
    try {
      const ws = await workspaceService.createWorkspace({ name: trimmed, color });
      window.dispatchEvent(new CustomEvent('workspaceCreated'));
      setActiveWorkspace({ ...ws, color });
      navigate(`/workspace/${ws.id}`, { replace: true });
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error ?? 'Failed to create workspace';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--bg-primary)' }}
    >
      <Helmet>
        <title>Create workspace — Starlex</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Brand */}
        <div className="text-center mb-10">
          <p className="label-caps text-white/40 tracking-[0.25em] mb-3">STARLEX</p>
          <h1 className="text-headline-lg font-hanken font-bold text-white mb-2">
            Create your workspace
          </h1>
          <p className="text-body-md text-white/50">
            Your workspace is where your team's work lives.
          </p>
        </div>

        {/* Glass card */}
        <div className="glass-card rounded-2xl p-8 space-y-7">
          {/* Preview */}
          <div className="flex items-center gap-5">
            <WorkspacePreview name={name} color={color} />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate text-body-lg">
                {name.trim() || 'My Workspace'}
              </p>
              <p className="text-white/40 text-label-sm">Workspace</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="label-caps text-white/50 block">Workspace name</label>
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="e.g. Acme Engineering"
                disabled={loading}
                className="glass-input disabled:opacity-50"
                autoComplete="off"
                maxLength={60}
              />
            </div>

            {/* Color */}
            <div className="space-y-3">
              <label className="label-caps text-white/50 block">Accent color</label>
              <div className="flex flex-wrap gap-2.5">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setColor(preset.value)}
                    title={preset.label}
                    className="w-8 h-8 rounded-lg transition-all duration-150 flex items-center justify-center"
                    style={{
                      backgroundColor: preset.value,
                      transform: color === preset.value ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: color === preset.value
                        ? `0 0 0 2px rgba(255,255,255,0.20), 0 0 16px ${preset.value}60`
                        : 'none',
                    }}
                    aria-label={preset.label}
                    aria-pressed={color === preset.value}
                  >
                    {color === preset.value && <Check size={14} className="text-white/90" />}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-[#fca5a5] text-label-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="liquid-button w-full !justify-between !px-5 !py-3 !rounded-xl disabled:opacity-40"
              style={{
                background: color,
                borderColor: 'transparent',
                color: '#fff',
                boxShadow: `0 8px 32px ${color}40`,
              }}
            >
              <span className="font-semibold">
                {loading ? 'Creating workspace…' : 'Create workspace'}
              </span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-label-sm mt-6">
          You can change the name and color in workspace settings later.
        </p>
      </motion.div>
    </div>
  );
};
