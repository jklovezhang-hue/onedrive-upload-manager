import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { UploadCloud } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const account = useAuthStore((s) => s.account);
  const addToast = useUIStore((s) => s.addToast);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 如果已登录，跳转主页（移到 useEffect 避免警告）
  useEffect(() => {
    if (account) {
      navigate('/', { replace: true });
    }
  }, [account, navigate]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
      // loginRedirect 触发页面跳转，这里不会执行到
    } catch {
      addToast({ type: 'error', message: '登录失败，请重试。' });
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral to-neutral-focus flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-2xl w-full max-w-md">
        <div className="card-body items-center text-center py-12">
          {/* Logo */}
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
            <UploadCloud className="w-10 h-10 text-primary" />
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-base-content mb-2">
            Onedrive Upload Manager
          </h1>
          <p className="text-base-content/60 mb-8">
            管理你的 OneDrive 文件，简单高效
          </p>

          {/* 登录按钮 */}
          <button
            className="btn btn-primary btn-wide gap-2"
            onClick={handleLogin}
            disabled={isLoggingIn || isLoading}
          >
            {isLoggingIn || isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                正在跳转到 Microsoft 登录页...
              </>
            ) : (
              <>
                {/* Microsoft Logo SVG */}
                <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                </svg>
                使用 Microsoft 账户登录
              </>
            )}
          </button>

          {/* 提示文字 */}
          <p className="text-xs text-base-content/40 mt-6 max-w-xs">
            登录后将获取以下权限：读取和管理你的 OneDrive 文件
          </p>
        </div>
      </div>
    </div>
  );
}