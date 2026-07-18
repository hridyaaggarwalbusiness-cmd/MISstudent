import { create } from 'zustand';

const STORAGE_KEY = 'mis-admin:sidebar-collapsed';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1',
  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return { sidebarCollapsed: next };
    }),
}));
