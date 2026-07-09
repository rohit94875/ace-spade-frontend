import { create } from 'zustand';
import {
  loadAuth, saveAuth, clearAuth, StoredAuth, isAccessTokenExpired,
} from '../services/authStorage';
import * as authApi from '../services/authApi';
import type { UserProfile } from '../types/auth';

interface AuthStore {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  initialized: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  isLoggedIn: () => boolean;
}

function applyStored(set: (p: Partial<AuthStore>) => void, stored: StoredAuth) {
  set({
    user: stored.user,
    accessToken: stored.accessToken,
    refreshToken: stored.refreshToken,
  });
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  initialized: false,

  init: async () => {
    const stored = loadAuth();
    if (!stored) {
      set({ initialized: true });
      return;
    }
    applyStored(set, stored);
    if (isAccessTokenExpired(stored)) {
      try {
        const res = await authApi.refresh(stored.refreshToken);
        const next: StoredAuth = {
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          expiresAt: Date.now() + res.expiresInMs,
          user: res.user,
        };
        saveAuth(next);
        set({
          user: res.user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          initialized: true,
        });
        return;
      } catch {
        clearAuth();
        set({ user: null, accessToken: null, refreshToken: null, initialized: true });
        return;
      }
    }
    set({ initialized: true });
  },

  login: async (email, password) => {
    const res = await authApi.login(email, password);
    const stored: StoredAuth = {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      expiresAt: Date.now() + res.expiresInMs,
      user: res.user,
    };
    saveAuth(stored);
    set({
      user: res.user,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    });
  },

  register: async (email, password, username) => {
    const res = await authApi.register(email, password, username);
    const stored: StoredAuth = {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      expiresAt: Date.now() + res.expiresInMs,
      user: res.user,
    };
    saveAuth(stored);
    set({
      user: res.user,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    });
  },

  logout: async () => {
    const token = get().accessToken;
    if (token) {
      try {
        await authApi.logout(token);
      } catch {
        /* ignore */
      }
    }
    clearAuth();
    set({ user: null, accessToken: null, refreshToken: null });
  },

  refreshProfile: async () => {
    const token = await get().getAccessToken();
    if (!token) return;
    const profile = await authApi.getMe(token);
    set({ user: profile });
    const stored = loadAuth();
    if (stored) {
      saveAuth({ ...stored, user: profile });
    }
  },

  getAccessToken: async () => {
    const stored = loadAuth();
    if (!stored) return null;
    if (!isAccessTokenExpired(stored)) {
      return stored.accessToken;
    }
    try {
      const res = await authApi.refresh(stored.refreshToken);
      const next: StoredAuth = {
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        expiresAt: Date.now() + res.expiresInMs,
        user: res.user,
      };
      saveAuth(next);
      set({
        user: res.user,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      return res.accessToken;
    } catch {
      clearAuth();
      set({ user: null, accessToken: null, refreshToken: null });
      return null;
    }
  },

  isLoggedIn: () => Boolean(get().accessToken && get().user),
}));
