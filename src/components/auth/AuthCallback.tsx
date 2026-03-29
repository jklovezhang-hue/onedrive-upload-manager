import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const msalInstance = useAuthStore((s) => s.msalInstance);

  useEffect(() => {
    // MSAL 3.x 的 handleRedirectPromise 应该在 App.tsx 中处理
    // 此页面作为降级处理
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="mt-4 text-base-content/60">正在处理登录...</p>
      </div>
    </div>
  );
}