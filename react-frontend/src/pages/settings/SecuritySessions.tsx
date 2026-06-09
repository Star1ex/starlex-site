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
    <div className="mt-8 pt-6 border-t border-white/8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="label-caps text-white/40">Active sessions</h3>
        {!loading && sessions.length > 0 && (
          <span className="text-label-sm text-white/30">{sessions.length} device{sessions.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {error && <p className="text-label-sm text-[#fca5a5] mb-3">{error}</p>}

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[0, 1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-white/4" />)}
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-label-sm text-white/30 px-3 py-2">No active sessions found</p>
      ) : (
        <div className="space-y-1.5">
          {sessions.map(s => {
            const ua = parseUA(s.user_agent);
            const isCurrent = s.is_current;
            const isRevoking = revoking === s.id;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${isCurrent ? 'bg-white/5 border border-white/10' : 'hover:bg-white/3'} transition-colors`}
              >
                <span className={`flex-shrink-0 ${isCurrent ? 'text-[--accent]' : 'text-white/30'}`}>
                  {ua.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body-md text-white/70 truncate text-sm">{ua.label}</span>
                    {isCurrent && (
                      <span className="text-label-sm text-xs px-1.5 py-0.5 rounded-md bg-[--accent]/20 text-[--accent] flex-shrink-0">
                        current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {s.ip && <span className="text-label-sm text-white/30 text-xs">{s.ip}</span>}
                    <span className="text-label-sm text-white/25 text-xs">
                      {s.last_seen_at ? `Last seen ${formatDate(s.last_seen_at)}` : `Created ${formatDate(s.created_at)}`}
                    </span>
                  </div>
                </div>
                {!isCurrent && (
                  <button
                    onClick={() => handleRevoke(s.id)}
                    disabled={isRevoking}
                    className="flex-shrink-0 px-3 py-1 rounded-lg text-label-sm text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40 text-xs"
                  >
                    {isRevoking ? <Loader2 size={12} className="animate-spin" /> : 'Revoke'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
