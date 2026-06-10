import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone, Globe, Loader2 } from 'lucide-react';
import { authService } from '@/services/api/index.js';
import { showToast } from '@/shared/lib/toast.js';
import type { SessionDTO } from '@/types/dto.js';

function parseUA(ua?: string): { icon: React.ReactNode; label: string } {
  if (!ua) return { icon: <Globe size={14} />, label: 'Unknown device' };
  const lower = ua.toLowerCase();
  if (/mobile|android|iphone|ipad/.test(lower)) {
    return { icon: <Smartphone size={14} />, label: ua.slice(0, 60) };
  }
  return { icon: <Monitor size={14} />, label: ua.slice(0, 60) };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export const SecuritySessions: React.FC = () => {
  const [sessions, setSessions] = useState<SessionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await authService.listSessions();
      setSessions(list);
    } catch {
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await authService.revokeSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      showToast('Session revoked', 'success');
    } catch {
      showToast('Failed to revoke session', 'error');
    } finally {
      setRevoking(null);
    }
  };

  return (
    <section className="settings-section settings-section--subtle">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="settings-section-title">Active sessions</h3>
          <p className="settings-section-description">Devices currently signed in to your account.</p>
        </div>
        {!loading && sessions.length > 0 && (
          <span className="settings-status-pill">{sessions.length} device{sessions.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {error && <p className="settings-message settings-message--error mb-3">{error}</p>}

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[0, 1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-[color:var(--sx-control)]" />)}
        </div>
      ) : sessions.length === 0 ? (
        <p className="settings-hint px-3 py-2">No active sessions found</p>
      ) : (
        <div className="space-y-1.5">
          {sessions.map(s => {
            const ua = parseUA(s.user_agent);
            const isCurrent = s.is_current;
            const isRevoking = revoking === s.id;
            return (
              <div
                key={s.id}
                className="settings-row"
              >
                <span className={`flex-shrink-0 ${isCurrent ? 'text-[color:var(--starlex-accent)]' : 'text-[color:var(--sx-text-subtle)]'}`}>
                  {ua.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body-md text-[color:var(--sx-text)] truncate text-sm">{ua.label}</span>
                    {isCurrent && (
                      <span
                        className="settings-status-pill !text-[color:var(--starlex-accent)] flex-shrink-0"
                        style={{ background: 'rgb(var(--starlex-accent-rgb) / 0.15)' }}
                      >
                        current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {s.ip && <span className="text-label-sm text-[color:var(--sx-text-subtle)] text-xs">{s.ip}</span>}
                    <span className="text-label-sm text-[color:var(--sx-text-disabled)] text-xs">
                      {s.last_seen_at ? `Last seen ${formatDate(s.last_seen_at)}` : `Created ${formatDate(s.created_at)}`}
                    </span>
                  </div>
                </div>
                {!isCurrent && (
                  <button
                    onClick={() => handleRevoke(s.id)}
                    disabled={isRevoking}
                    className="settings-button !py-1 !px-3 flex-shrink-0 hover:!text-red-300 hover:!bg-red-400/10"
                  >
                    {isRevoking ? <Loader2 size={12} className="animate-spin" /> : 'Revoke'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
