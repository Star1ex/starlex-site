import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, CheckCircle, AlertCircle } from 'lucide-react';
import { workspaceService } from '@/services/api/index.js';
import type { InvitePreviewDTO } from '@/types/dto.js';
import { useAuth } from '@/contexts/useAuth.js';
import { useWorkspace } from '@/contexts/useWorkspace.js';

function WorkspaceGlyph({ name, color }: { name: string; color?: string }) {
  const bg = color || '#6366f1';
  const letter = name.charAt(0).toUpperCase();
  return (
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold font-hanken text-white shadow-lg"
      style={{ background: bg, boxShadow: `0 8px 32px ${bg}55` }}
    >
      {letter}
    </div>
  );
}

export const InviteAcceptPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { setActiveWorkspace } = useWorkspace();

  const [preview, setPreview] = useState<InvitePreviewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    workspaceService.getInvitePreview(token)
      .then(setPreview)
      .catch(() => setError('Invite not found or expired'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    if (!isAuthenticated) {
      localStorage.setItem('redirectPath', `/invite/${token}`);
      navigate('/sign-in');
      return;
    }
    setJoining(true);
    try {
      const acceptedWorkspace = await workspaceService.acceptInvite(token);
      setJoined(true);
      const ws = acceptedWorkspace.id ? acceptedWorkspace : preview?.workspace;
      if (ws) {
        setActiveWorkspace({
          ...acceptedWorkspace,
          id: ws.id,
          name: ws.name,
          description: acceptedWorkspace.description ?? '',
          color: ws.color,
          icon: ws.icon,
        });
        setTimeout(() => navigate(`/workspace/${ws.id}`), 1200);
      } else {
        setTimeout(() => navigate('/dashboard'), 1200);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to join workspace');
    } finally {
      setJoining(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sx-body-bg)' }}>
        <div className="w-6 h-6 rounded-full border-2 border-[color:var(--sx-border)] border-t-[color:var(--sx-text-muted)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--sx-body-bg)' }}>
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="text-center mb-8">
          <p className="label-caps text-[color:var(--sx-text-subtle)] tracking-[0.25em] mb-6">STARLEX</p>

          {error || !preview?.valid ? (
            <div className="space-y-3">
              <AlertCircle size={40} className="text-red-400 mx-auto" />
              <h1 className="text-headline-md font-hanken font-bold text-[color:var(--sx-text)]">Invite expired</h1>
              <p className="text-body-md text-[color:var(--sx-text-muted)]">{error || 'This invite link is no longer valid.'}</p>
              <button onClick={() => navigate('/sign-in')} className="liquid-button mt-4 !justify-center w-full">
                Go to Sign In
              </button>
            </div>
          ) : joined ? (
            <div className="space-y-3">
              <CheckCircle size={40} className="text-green-400 mx-auto" />
              <h1 className="text-headline-md font-hanken font-bold text-[color:var(--sx-text)]">You're in!</h1>
              <p className="text-body-md text-[color:var(--sx-text-muted)]">Taking you to the workspace…</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 space-y-6 text-center">
              <div className="flex flex-col items-center gap-4">
                {preview.workspace && (
                  <WorkspaceGlyph name={preview.workspace.name} color={preview.workspace.color} />
                )}
                <div>
                  <p className="text-label-sm text-[color:var(--sx-text-subtle)] mb-1">You've been invited to</p>
                  <h1 className="text-headline-md font-hanken font-bold text-[color:var(--sx-text)]">
                    {preview.workspace?.name ?? 'a workspace'}
                  </h1>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-label-sm text-[color:var(--sx-text-subtle)]">
                <Users size={14} />
                <span>Join as a member</span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleAccept}
                  disabled={joining}
                  className="w-full liquid-button !justify-center !py-3 !rounded-xl !bg-[color:var(--starlex-accent)] !border-transparent !text-[color:var(--starlex-accent-contrast)] font-semibold disabled:opacity-40"
                  style={preview.workspace?.color ? {
                    background: preview.workspace.color,
                    boxShadow: `0 4px 20px ${preview.workspace.color}44`,
                  } : undefined}
                >
                  {joining ? 'Joining…' : isAuthenticated ? 'Accept invitation' : 'Sign in to join'}
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full text-label-sm text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text-muted)] transition-colors py-2"
                >
                  Decline
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
