import { useCallback, useState } from 'react';
import { useRealtimeEvent } from '@/shared/hooks/useRealtime.js';
import { useAuth } from '@/contexts/AuthContext.js';
import type { RealtimeEnvelope } from '@/shared/lib/realtime.js';

export interface PresenceUser {
  id: string;
  firstName?: string;
  lastName?: string;
  photo_url?: string | null;
}

interface PresenceSyncPayload {
  users: PresenceUser[];
}

export function usePresence() {
  const { userId } = useAuth();
  const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([]);

  const handleSync = useCallback((envelope: RealtimeEnvelope<PresenceSyncPayload>) => {
    setPresentUsers(
      (envelope.payload.users ?? []).filter(u => u.id !== userId),
    );
  }, [userId]);

  useRealtimeEvent<PresenceSyncPayload>('presence.sync', handleSync);

  return presentUsers;
}

export function useTaskRealtimeInvalidator(onInvalidate: () => void) {
  const cb = useCallback((_ev: RealtimeEnvelope) => onInvalidate(), [onInvalidate]);
  useRealtimeEvent('task.created', cb);
  useRealtimeEvent('task.updated', cb);
  useRealtimeEvent('task.deleted', cb);
  useRealtimeEvent('task.moved', cb);
}
