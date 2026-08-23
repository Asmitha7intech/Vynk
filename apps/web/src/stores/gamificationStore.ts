import { create } from 'zustand';

interface GamificationState {
  showLevelUpModal: boolean;
  levelUpData: { newLevel: number; levelTitle: string; xp: number } | null;
  showXPToast: boolean;
  xpToastData: { amount: number; reason: string } | null;
  triggerLevelUp: (newLevel: number, levelTitle: string, xp: number) => void;
  closeLevelUpModal: () => void;
  awardXPFeedback: (amount: number, reason: string) => void;
}

export const useGamificationStore = create<GamificationState>((set) => ({
  showLevelUpModal: false,
  levelUpData: null,
  showXPToast: false,
  xpToastData: null,
  triggerLevelUp: (newLevel, levelTitle, xp) => set({
    showLevelUpModal: true,
    levelUpData: { newLevel, levelTitle, xp },
  }),
  closeLevelUpModal: () => set({ showLevelUpModal: false, levelUpData: null }),
  awardXPFeedback: (amount, reason) => {
    set({ showXPToast: true, xpToastData: { amount, reason } });
    setTimeout(() => {
      set({ showXPToast: false, xpToastData: null });
    }, 4000);
  },
}));
