import { apiClient } from '@/services/api/client.js';

export type RealtimeEventType =
  | 'task.created' | 'task.updated' | 'task.deleted' | 'task.moved'
  | 'project.created' | 'project.updated' | 'project.deleted'
  | 'workspace.updated'
  | 'member.added' | 'member.removed' | 'member.role_changed'
  | 'discussion.message'
  | 'presence.sync';

export interface RealtimeEnvelope<T = unknown> {
  type: RealtimeEventType;
  workspace_id: string;
  payload: T;
  actor_id: string;
  ts: string;
}

type Handler<T = unknown> = (envelope: RealtimeEnvelope<T>) => void;

const BACKOFF_BASE = 1_000;
const BACKOFF_MAX = 30_000;

type RealtimeAuthMode = 'subprotocol' | 'query';
type RealtimeConnection = {
  url: string;
  protocols?: string[];
};

const getRealtimeAuthMode = (): RealtimeAuthMode => {
  return import.meta.env.VITE_WS_AUTH_MODE === 'query' ? 'query' : 'subprotocol';
};

const getWebSocketBase = () => {
  const configuredBase = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').trim();
  const httpBase = configuredBase || window.location.origin;
  return httpBase.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
};

const buildRealtimeConnection = (workspaceId: string): RealtimeConnection | null => {
  const mode = getRealtimeAuthMode();
  const url = new URL('/api/ws', getWebSocketBase());
  url.searchParams.set('workspace_id', workspaceId);

  const token = apiClient.getAccessToken();
  if (!token) return null;

  if (mode === 'query') {
    url.searchParams.set('token', token);
    return { url: url.toString() };
  }

  return {
    url: url.toString(),
    protocols: [`bearer.${token}`],
  };
};

class RealtimeClient {
  private ws: WebSocket | null = null;
  private workspaceId: string | null = null;
  private handlers = new Map<RealtimeEventType, Set<Handler>>();
  private attempt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  connect(workspaceId: string) {
    if (this.workspaceId === workspaceId && this.ws?.readyState === WebSocket.OPEN) return;
    this.workspaceId = workspaceId;
    this.attempt = 0;
    this.closed = false;
    this._open();
  }

  disconnect() {
    this.closed = true;
    this._clearTimer();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  on<T = unknown>(type: RealtimeEventType, handler: Handler<T>): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler as Handler);
    return () => { this.handlers.get(type)?.delete(handler as Handler); };
  }

  private _open() {
    if (this.closed || !this.workspaceId) return;
    const connection = buildRealtimeConnection(this.workspaceId);
    if (!connection) return;

    const ws = new WebSocket(connection.url, connection.protocols);
    this.ws = ws;

    ws.onopen = () => { this.attempt = 0; };

    ws.onmessage = (ev: MessageEvent) => {
      let envelope: RealtimeEnvelope;
      try { envelope = JSON.parse(ev.data as string) as RealtimeEnvelope; }
      catch { return; }
      const set = this.handlers.get(envelope.type);
      if (!set) return;
      for (const h of set) h(envelope);
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      if (this.closed) return;
      this.ws = null;
      const delay = Math.min(BACKOFF_BASE * 2 ** this.attempt, BACKOFF_MAX);
      this.attempt++;
      this.retryTimer = setTimeout(() => this._open(), delay);
    };
  }

  private _clearTimer() {
    if (this.retryTimer !== null) { clearTimeout(this.retryTimer); this.retryTimer = null; }
  }
}

export const realtimeClient = new RealtimeClient();
