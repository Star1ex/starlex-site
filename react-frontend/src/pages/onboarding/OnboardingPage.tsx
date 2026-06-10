import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { workspaceService } from '@/services/api/index.js';
import { useWorkspace } from '@/contexts/useWorkspace.js';
import { Helmet } from 'react-helmet-async';
import { WorkspaceIdentityForm } from '@/shared/ui/WorkspaceIdentityForm.js';
import { WORKSPACE_ACCENT_PRESETS } from '@/shared/lib/workspaceIdentity.js';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState<string>(WORKSPACE_ACCENT_PRESETS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Give your workspace a name'); return; }
    setLoading(true);
    setError('');
    try {
      const nextIcon = icon.trim() || trimmed.slice(0, 2).toUpperCase();
      const ws = await workspaceService.createWorkspace({ name: trimmed, icon: nextIcon, color });
      window.dispatchEvent(new CustomEvent('workspaceCreated'));
      setActiveWorkspace({ ...ws, icon: nextIcon, color });
      navigate(`/workspace/${ws.id}`, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to create workspace';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--sx-body-bg)' }}
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
          <p className="label-caps text-[color:var(--sx-text-subtle)] tracking-[0.25em] mb-3">STARLEX</p>
          <h1 className="text-headline-lg font-hanken font-bold text-[color:var(--sx-text)] mb-2">
            Create your workspace
          </h1>
          <p className="text-body-md text-[color:var(--sx-text-muted)]">
            Your workspace is where your team's work lives.
          </p>
        </div>

        {/* Glass card */}
        <div className="glass-card rounded-2xl p-8 space-y-7">
          <form onSubmit={handleSubmit} className="space-y-6">
            <WorkspaceIdentityForm
              name={name}
              onNameChange={(value) => { setName(value); setError(''); }}
              icon={icon}
              onIconChange={(value) => { setIcon(value); setError(''); }}
              color={color}
              onColorChange={setColor}
              error={error}
              disabled={loading}
              autoFocus
            />

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

        <p className="text-center text-[color:var(--sx-text-subtle)] text-label-sm mt-6">
          You can change the name and color in workspace settings later.
        </p>
      </motion.div>
    </div>
  );
};
