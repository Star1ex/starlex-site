export type ApiErrorData = {
  error?: string;
  message?: string;
  auth_providers?: string[];
  user_id?: string;
};

export type ApiErrorInfo = {
  message?: string;
  status?: number;
  data?: ApiErrorData;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

export function getApiErrorInfo(error: unknown): ApiErrorInfo {
  if (!isRecord(error)) return {};

  const response = isRecord(error.response) ? error.response : undefined;
  const data = response && isRecord(response.data) ? response.data : undefined;
  const authProviders = data?.auth_providers;

  return {
    message: typeof error.message === 'string' ? error.message : undefined,
    status: typeof response?.status === 'number' ? response.status : undefined,
    data: data
      ? {
          error: typeof data.error === 'string' ? data.error : undefined,
          message: typeof data.message === 'string' ? data.message : undefined,
          auth_providers: Array.isArray(authProviders)
            ? authProviders.filter((provider): provider is string => typeof provider === 'string')
            : undefined,
          user_id: typeof data.user_id === 'string' ? data.user_id : undefined,
        }
      : undefined,
  };
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const info = getApiErrorInfo(error);
  return info.data?.error ?? info.data?.message ?? info.message ?? fallback;
}
