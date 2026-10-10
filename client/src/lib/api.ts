import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { User } from '@/types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * The Redux store registers these callbacks at startup. Going through a bridge
 * avoids a circular import (store -> api -> store).
 */
export const authBridge = {
  getToken: (): string | null => null,
  onSession: (_user: User, _token: string) => {},
  onLogout: () => {},
};

export const api = axios.create({ baseURL: API_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = authBridge.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

/** Single-flight refresh: concurrent 401s share one /auth/refresh call. */
export function refreshSession(): Promise<string> {
  refreshing ??= axios
    .post<{ user: User; accessToken: string }>(`${API_URL}/api/auth/refresh`, null, { withCredentials: true })
    .then((res) => {
      authBridge.onSession(res.data.user, res.data.accessToken);
      return res.data.accessToken;
    })
    .finally(() => { refreshing = null; });
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthCall = original?.url?.includes('/api/auth/');
    if (error.response?.status === 401 && original && !original._retried && !isAuthCall && authBridge.getToken()) {
      original._retried = true;
      try {
        const token = await refreshSession();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        authBridge.onLogout();
      }
    }
    return Promise.reject(error);
  },
);

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg[0];
    if (typeof msg === 'string') return msg;
    if (!error.response) return 'Cannot reach the server. Is the API running?';
  }
  return 'Something went wrong';
}
