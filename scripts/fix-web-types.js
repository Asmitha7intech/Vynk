const fs = require('fs');
const path = require('path');

const authStorePath = path.resolve(__dirname, '../apps/web/src/stores/authStore.ts');
const rightPanelPath = path.resolve(__dirname, '../apps/web/src/components/RightPanel.tsx');

const authStoreContent = `
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@vynk/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        localStorage.setItem('vynk_access_token', token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('vynk_access_token');
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (updatedData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedData } : null,
        })),
    }),
    {
      name: 'vynk_auth_state',
    }
  )
);
`;

let rightPanelContent = fs.readFileSync(rightPanelPath, 'utf8');
if (!rightPanelContent.includes('onOpenCreatePost?:')) {
  rightPanelContent = rightPanelContent.replace(
    'export function RightPanel() {',
    'export function RightPanel({ onOpenCreatePost }: { onOpenCreatePost?: () => void } = {}) {'
  );
}

fs.writeFileSync(authStorePath, authStoreContent.trim() + '\n', 'utf8');
fs.writeFileSync(rightPanelPath, rightPanelContent.trim() + '\n', 'utf8');
console.log('Updated authStore.ts and RightPanel.tsx');
