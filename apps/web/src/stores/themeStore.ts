import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem('vynk-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch (e) {
    // ignore local storage errors
  }
  return 'dark';
};

const applyThemeToDOM = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
  }
};

const initialTheme = getInitialTheme();
applyThemeToDOM(initialTheme);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const nextTheme: Theme = state.theme === 'dark' ? 'light' : 'dark';
      applyThemeToDOM(nextTheme);
      try {
        localStorage.setItem('vynk-theme', nextTheme);
      } catch (e) {}
      return { theme: nextTheme };
    }),
  setTheme: (theme: Theme) => {
    applyThemeToDOM(theme);
    try {
      localStorage.setItem('vynk-theme', theme);
    } catch (e) {}
    set({ theme });
  },
}));
