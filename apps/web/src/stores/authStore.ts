import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@vynk/types';
import { connectSocket, disconnectSocket } from '../lib/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (user: User, token: string, refreshToken?: string) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitializing: true,
      initializeAuth: async () => {
        const rawToken = localStorage.getItem('vynk_access_token');
        const token = rawToken?.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
        if (!token) {
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isInitializing: false });
          return;
        }
        try {
          const { api } = await import('../lib/api');
          const res = await api.getCurrentUser();
          if (res?.user) {
            set({ user: res.user, token, isAuthenticated: true, isInitializing: false });
            connectSocket(token);
          } else {
            set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isInitializing: false });
          }
        } catch (err: any) {
          if (err?.status === 401) {
            localStorage.removeItem('vynk_access_token');
            localStorage.removeItem('vynk_refresh_token');
            disconnectSocket();
            set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isInitializing: false });
          } else {
            // Keep persisted user session active if available during temporary offline / network errors
            const existingUser = get().user;
            set({
              user: existingUser,
              token: existingUser ? token : null,
              isAuthenticated: !!existingUser,
              isInitializing: false,
            });
          }
        }
      },
      login: (user, token, refreshToken) => {
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        localStorage.setItem('vynk_access_token', cleanToken);
        if (refreshToken) {
          localStorage.setItem('vynk_refresh_token', refreshToken);
        }
        connectSocket(cleanToken);
        set({
          user,
          token: cleanToken,
          refreshToken: refreshToken || get().refreshToken,
          isAuthenticated: true,
        });
      },
      setTokens: (accessToken, refreshToken) => {
        const cleanToken = accessToken.startsWith('Bearer ') ? accessToken.slice(7) : accessToken;
        localStorage.setItem('vynk_access_token', cleanToken);
        if (refreshToken) {
          localStorage.setItem('vynk_refresh_token', refreshToken);
        }
        connectSocket(cleanToken);
        set((state) => ({
          token: cleanToken,
          refreshToken: refreshToken || state.refreshToken,
        }));
      },
      logout: async () => {
        try {
          const { api } = await import('../lib/api');
          await api.logout().catch(() => {});
        } catch {
          // Proceed with client cleanup
        } finally {
          localStorage.removeItem('vynk_access_token');
          localStorage.removeItem('vynk_refresh_token');
          disconnectSocket();
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },
      updateUser: (updatedData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedData } : null,
        })),
    }),
    {
      name: 'vynk_auth_state',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem('vynk_access_token', state.token);
          if (state.refreshToken) {
            localStorage.setItem('vynk_refresh_token', state.refreshToken);
          }
          connectSocket(state.token);
        }
      },
    }
  )
);

