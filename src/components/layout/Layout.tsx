import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import TopBar from './TopBar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const account = useAuthStore((s) => s.account);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isLoading = useAuthStore((s) => s.isLoading);
  const darkMode = useUIStore((s) => s.darkMode);
  const setDarkMode = useUIStore((s) => s.setDarkMode);

  // 初始化主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // 认证守卫
  useEffect(() => {
    if (isInitialized && !isLoading && !account) {
      navigate('/login', { replace: true });
    }
  }, [isInitialized, isLoading, account, navigate]);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!account) {
    return null; // 会在 useEffect 中跳转
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <TopBar />
      <main className="flex-1">{children}</main>
    </div>
  );
}