import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, Configuration } from '@azure/msal-browser';
import LoginPage from './components/auth/LoginPage';
import AuthCallback from './components/auth/AuthCallback';
import Layout from './components/layout/Layout';
import HomePage from './components/home/HomePage';
import FolderDetailPage from './components/folder/FolderDetailPage';
import ToastContainer from './components/layout/ToastContainer';
import { useAuthStore } from './stores/authStore';

// ─────────────────────────────────────────────
// MSAL 实例在 useEffect 中懒创建（确保 window.location.origin 已就绪）
// ─────────────────────────────────────────────
export default function App() {
  const initializeMsal = useAuthStore((s) => s.initializeMsal);
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);

  useEffect(() => {
    const config: Configuration = {
      auth: {
        clientId: 'ae6ceb41-6cf4-4bcf-89a2-7ca49b8fb417',
        authority: 'https://login.microsoftonline.com/consumers',
        redirectUri: window.location.origin,
        postLogoutRedirectUri: `${window.location.origin}/login`,
        navigateToLoginRequestUrl: false,   // 防止自动跳转
      },
      cache: {
        cacheLocation: 'localStorage',     // 改为 localStorage，跨标签页更稳定
        storeAuthStateInCookie: true,       // Cookie 存储对移动端更友好
      },
    };

    const instance = new PublicClientApplication(config);
    setMsalInstance(instance);
    initializeMsal(instance);
  }, [initializeMsal]);

  if (!msalInstance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/folder/:folderId"
          element={
            <Layout>
              <FolderDetailPage />
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </MsalProvider>
  );
}
