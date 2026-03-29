import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Toast, ToastType } from '@/types';
import { TOAST_CONFIG } from '@/utils/constants';
import { generateId } from '@/utils/format';

interface UIState {
  darkMode: boolean;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      toasts: [],

      addToast: (toast) => {
        const id = generateId();
        const newToast: Toast = {
          ...toast,
          id,
          autoClose: toast.autoClose ?? toast.type !== 'error',
        };
        set((state) => ({ toasts: [...state.toasts, newToast] }));

        // 自动消失
        const getDuration = (type: ToastType): number => {
          if (type === 'uploading') return 0;
          if (type === 'error') return TOAST_CONFIG.errorDuration;
          if (type === 'success') return TOAST_CONFIG.successDuration;
          return TOAST_CONFIG.infoDuration;
        };
        const duration = getDuration(toast.type);

        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }

        return id;
      },

      updateToast: (id, updates) => {
        set((state) => ({
          toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      removeToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      },

      clearToasts: () => set({ toasts: [] }),

      toggleDarkMode: () => {
        const newDark = !get().darkMode;
        set({ darkMode: newDark });
        document.documentElement.setAttribute('data-theme', newDark ? 'dark' : 'light');
      },

      setDarkMode: (dark) => {
        set({ darkMode: dark });
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ darkMode: state.darkMode }),
    }
  )
);