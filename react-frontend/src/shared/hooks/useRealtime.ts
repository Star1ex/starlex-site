import { useEffect } from 'react';
import { realtimeClient, type RealtimeEventType, type RealtimeEnvelope } from '@/shared/lib/realtime.js';
import { useWorkspace } from '@/contexts/WorkspaceContext.js';

export function useRealtimeEvent<T = unknown>(
  type: RealtimeEventType,
  handler: (envelope: RealtimeEnvelope<T>) => void,
) {
  const { activeWorkspaceId } = useWorkspace();

  useEffect(() => {
    if (!activeWorkspaceId) return;
    realtimeClient.connect(activeWorkspaceId);
    return realtimeClient.on<T>(type, handler);
  }, [activeWorkspaceId, type, handler]);
}

export function useRealtimeConnection() {
  const { activeWorkspaceId } = useWorkspace();

  useEffect(() => {
    if (!activeWorkspaceId) return;
    realtimeClient.connect(activeWorkspaceId);
    return () => realtimeClient.disconnect();
  }, [activeWorkspaceId]);
}
