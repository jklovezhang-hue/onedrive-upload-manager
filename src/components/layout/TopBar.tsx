import { LogOut, Moon, Sun, UploadCloud, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

export default function TopBar() {
  const account = useAuthStore((s) => s.account);
  const logout = useAuthStore((s) => s.logout);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);

  const handleLogout = () => {
    // logoutRedirect 会跳转到 Microsoft 注销页，结束后回到 /login
    logout();
  };

  const displayName = account?.name ?? account?.username ?? 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="navbar bg-base-100 border-b border-base-300 sticky top-0 z-40 px-4">
      {/* Logo */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <UploadCloud className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold text-lg hidden sm:block">Onedrive Upload Manager</span>
        </div>
      </div>

      {/* 右侧操作 */}
      <div className="flex items-center gap-2">
        {/* 深色模式切换 */}
        <button
          className="btn btn-ghost btn-circle"
          onClick={toggleDarkMode}
          title={darkMode ? '切换到浅色模式' : '切换到深色模式'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* 用户信息 */}
        {account && (
          <>
            <div className="flex items-center gap-2 px-2">
              {/* 头像占位 */}
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-8">
                  <span className="text-xs">{initials}</span>
                </div>
              </div>
              <span className="text-sm font-medium hidden md:block">{displayName}</span>
            </div>

            {/* 登出 */}
            <button
              className="btn btn-ghost btn-sm gap-1"
              onClick={handleLogout}
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">登出</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}