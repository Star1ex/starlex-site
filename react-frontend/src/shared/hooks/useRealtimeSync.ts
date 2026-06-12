import { useEffect, useRef } from 'react';
import {
  realtimeClient,
  type RealtimeEventType,
  type RealtimeEnvelope,
} from '@/shared/lib/realtime.js';
import type { ProjectDTO, WorkspaceDTO } from '@/types/dto.js';

/**
 * Subscribe to a realtime event with a handler that can change every render
 * WITHOUT re-subscribing. The latest handler is read through a ref, so callers
 * may pass inline closures freely. Connection lifecycle is owned by
 * `useRealtimeConnection` (mounted once in Layout).
 */
function useStableRealtime<T = unknown>(
  type: RealtimeEventType,
  handler: (envelope: RealtimeEnvelope<T>) => void,
) {
  const ref = useRef(handler);
  useEffect(() => { ref.current = handler; });
  useEffect(() => realtimeClient.on<T>(type, (env) => ref.current(env)), [type]);
}

type WorkspacePatch = Partial<WorkspaceDTO> & { id: string };

/** Live workspace identity changes (icon, colour, name, description, settings). */
export function useWorkspaceRealtime(onPatch: (patch: WorkspacePatch) => void) {
  useStableRealtime<WorkspacePatch>('workspace.updated', (env) => {
    if (env.payload?.id) onPatch(env.payload);
  });
}

/** Live project create / update / delete. Payloads carry the full project DTO. */
export function useProjectRealtime(opts: {
  onUpsert?: (project: ProjectDTO) => void;
  onDelete?: (projectId: string) => void;
}) {
  useStableRealtime<ProjectDTO>('project.created', (env) => {
    if (env.payload?.id) opts.onUpsert?.(env.payload);
  });
  useStableRealtime<ProjectDTO>('project.updated', (env) => {
    if (env.payload?.id) opts.onUpsert?.(env.payload);
  });
  useStableRealtime<{ id: string }>('project.deleted', (env) => {
    if (env.payload?.id) opts.onDelete?.(env.payload.id);
  });
}

/**
 * Live task changes. Task events carry a minimal payload, so consumers refetch
 * their current view. Bursts are coalesced into a single debounced refetch.
 */
export function useTaskRealtime(onChange: () => void, delay = 250) {
  const ref = useRef(onChange);
  useEffect(() => { ref.current = onChange; });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => ref.current(), delay);
    };
    const offs = (['task.created', 'task.updated', 'task.deleted', 'task.moved'] as const).map(
      (type) => realtimeClient.on(type, schedule),
    );
    return () => {
      offs.forEach((off) => off());
      if (timer.current) clearTimeout(timer.current);
    };
  }, [delay]);
}

/** Merge a project into a list immutably: replace if present, else prepend. */
export function upsertProject(list: ProjectDTO[], project: ProjectDTO): ProjectDTO[] {
  const idx = list.findIndex((p) => p.id === project.id);
  if (idx === -1) return [project, ...list];
  const next = list.slice();
  next[idx] = project;
  return next;
}
