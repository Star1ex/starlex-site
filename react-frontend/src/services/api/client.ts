import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshing: Promise<string> | null = null;
  private csrfToken: string | null = null;
  private initPromise: Promise<boolean> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: '', // empty for relative paths
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (this.accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      if (this.csrfToken && config.headers && config.method && config.method.toLowerCase() !== 'get') {
        config.headers['X-CSRF-Token'] = this.csrfToken;
      }
      return config;
    }, (error) => Promise.reject(error));

    this.client.interceptors.response.use((response) => response, async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/login') &&
        !originalRequest.url?.includes('/auth/refresh')
      ) {
        originalRequest._retry = true;

        try {
          const newAccessToken = await this.refreshAccessToken();
          this.setAccessToken(newAccessToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return this.client(originalRequest);
        } catch (refreshError) {
          this.clearAccessToken();
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/sign-in')) {
            window.location.replace('/login');
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    });
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshing) {
      return this.refreshing as Promise<string>;
    }

    this.refreshing = this.client
      .post<{ access_token: string }>('/api/auth/refresh')
      .then((response) => {
        const token = response.data?.access_token;
        if (!token) {
          throw new Error('No access token returned');
        }
        return token;
      })
      .catch((err) => {
        this.clearAccessToken();
        throw err;
      })
      .finally(() => {
        this.refreshing = null;
      });

    return this.refreshing as Promise<string>;
  }

  // Try to initialize session by using refresh cookie to get a new access token
  public async initialize(): Promise<boolean> {
    if (this.initPromise !== null) {
      return this.initPromise;
    }
    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<boolean> {
    try {
      const token = await this.refreshAccessToken();
      this.setAccessToken(token);

      // Fetch CSRF token so all protected mutations (POST/PUT/DELETE) work
      try {
        const csrfResponse = await this.client.get<{ csrf_token: string }>('/api/auth/csrf');
        const csrfToken = csrfResponse.data?.csrf_token;
        if (csrfToken) {
          this.setCsrfToken(csrfToken);
        }
      } catch {
        // Non-fatal: mutations may fail with 403 until next CSRF fetch
      }

      return true;
    } catch {
      this.clearAccessToken();
      return false;
    }
  }

  public setAccessToken(token: string) {
    this.accessToken = token;
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public clearAccessToken() {
    this.accessToken = null;
    this.csrfToken = null;
    this.initPromise = null;
  }

  public setCsrfToken(token: string) {
    this.csrfToken = token;
  }

  public getCsrfToken(): string | null {
    return this.csrfToken;
  }

  public getClient() {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export const httpClient = apiClient.getClient();
