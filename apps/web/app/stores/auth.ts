import { defineStore } from 'pinia';
import type { ApiResponse, User } from '@minisoccer/shared-types';

interface SessionPayload {
  accessToken: string;
  user: User;
}

/**
 * Client auth state (SPEC: Pinia for client state).
 *
 * Best practice with a NestJS JWT backend: the short-lived **access token lives in
 * memory only** (never localStorage — XSS-safe), and the long-lived refresh token
 * is an httpOnly cookie the browser sends automatically to `/auth/*`. On a hard
 * reload the in-memory token is gone, so `refresh()` silently restores the session
 * from the cookie (see `plugins/auth.client.ts`). The 401-retry in `useApi` calls
 * `refresh()` transparently when an access token expires mid-session.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    accessToken: null as string | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    isAdmin: (state) => state.user?.role === 'ADMIN',
  },
  actions: {
    /** Base URL of the API, read from runtime config. */
    apiBase(): string {
      return useRuntimeConfig().public.apiBase as string;
    },

    setSession(payload: SessionPayload) {
      this.accessToken = payload.accessToken;
      this.user = payload.user;
    },

    clear() {
      this.accessToken = null;
      this.user = null;
    },

    async login(email: string, password: string) {
      // Bare $fetch (not useApi) so login/refresh never recurse through the 401 retry.
      const res = await $fetch<ApiResponse<SessionPayload>>('/auth/login', {
        baseURL: this.apiBase(),
        method: 'POST',
        body: { email, password },
        credentials: 'include',
      });
      if (!res.success) throw new Error('Login failed');
      this.setSession(res.data);
    },

    /** Exchange the refresh cookie for a new access token. Returns success. */
    async refresh(): Promise<boolean> {
      try {
        const res = await $fetch<ApiResponse<SessionPayload>>('/auth/refresh', {
          baseURL: this.apiBase(),
          method: 'POST',
          credentials: 'include',
        });
        if (res.success) {
          this.setSession(res.data);
          return true;
        }
      } catch {
        // No / expired / reused refresh cookie — treat as logged out.
      }
      this.clear();
      return false;
    },

    async logout() {
      try {
        await $fetch('/auth/logout', {
          baseURL: this.apiBase(),
          method: 'POST',
          credentials: 'include',
        });
      } catch {
        // Ignore — clear local state regardless.
      }
      this.clear();
    },
  },
});
