import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type RetryableStatus = number | undefined;

type RetryOptions = {
  attempts?: number;
  delaysMs?: readonly number[];
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
};

const DEFAULT_DELAYS_MS = [250, 700, 1400] as const;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function getStatus(error: unknown): RetryableStatus {
  if (!isRecord(error) || !isRecord(error.response)) return undefined;
  return typeof error.response.status === 'number' ? error.response.status : undefined;
}

export function isAbortLikeError(error: unknown): boolean {
  if (!isRecord(error)) return false;
  return error.name === 'AbortError' || error.code === 'ERR_CANCELED';
}

export function isRetryableRequestError(error: unknown): boolean {
  if (isAbortLikeError(error)) return false;

  const status = getStatus(error);
  if (!status) return true;
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function isChunkLoadError(error: unknown): boolean {
  if (!isRecord(error)) return false;
  const message = typeof error.message === 'string' ? error.message : '';
  const name = typeof error.name === 'string' ? error.name : '';
  return (
    name === 'ChunkLoadError' ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('Loading chunk') ||
    message.includes('dynamically imported module')
  );
}

function reloadOnceForChunkError(key: string): boolean {
  if (typeof window === 'undefined') return false;

  const storageKey = `starlex:chunk-reload:${key}`;
  if (sessionStorage.getItem(storageKey)) return false;

  sessionStorage.setItem(storageKey, '1');
  window.location.reload();
  return true;
}

export async function loadWithRetry<T>(
  loader: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 4);
  const delays = options.delaysMs ?? DEFAULT_DELAYS_MS;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await loader();
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt >= attempts;
      const canRetry = options.shouldRetry?.(error, attempt) ?? true;

      if (isLastAttempt || !canRetry) break;

      options.onRetry?.(error, attempt);
      await wait(delays[attempt - 1] ?? delays[delays.length - 1] ?? 0);
    }
  }

  throw lastError;
}

export function lazyWithRetry<T extends ComponentType<object>>(
  key: string,
  loader: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() =>
    loadWithRetry(loader, {
      attempts: 4,
      shouldRetry: isChunkLoadError,
    }).catch((error: unknown) => {
      if (isChunkLoadError(error) && reloadOnceForChunkError(key)) {
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }),
  );
}
