import { create } from 'zustand';
import { AccountInfo, PublicClientApplication } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';

const SCOPES = ['User.Read', 'Files.ReadWrite.All', 'offline_access'] as const;

interface AuthState {
  account: AccountInfo | null;
  accessToken: string | null;
  msalInstance: PublicClientApplication | null;
  graphClient: Client | null;
  isLoading: boolean;
  isInitialized: boolean;
  initializeMsal: (instance: PublicClientApplication) => Promise<void>;
  setAccount: (account: AccountInfo | null) => void;
  setAccessToken: (token: string | null) => void;
  setGraphClient: (client: Client | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  acquireToken: () => Promise<string>;
}

function buildGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

function setInitialized(set: (state: Partial<AuthState>) => void, instance: PublicClientApplication, partial: Partial<AuthState>) {
  set({ ...partial, msalInstance: instance, isInitialized: true, isLoading: false });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  account: null,
  accessToken: null,
  msalInstance: null,
  graphClient: null,
  isLoading: true,
  isInitialized: false,

  initializeMsal: async (instance) => {
    try {
      await instance.initialize();

      // ── 关键：处理 redirect 回调（PKCE 流程返回 auth result）───────────────────
      // 即使使用 popup，handleRedirectPromise 也需要调用以清除 redirect 状态
      let authResult = null;
      try {
        authResult = await instance.handleRedirectPromise();
      } catch (e) {
        console.warn('[MSAL] handleRedirectPromise error (ignored):', e);
      }

      if (authResult) {
        // 从 redirect 回调获得账户
        const graphClient = buildGraphClient(authResult.accessToken);
        setInitialized(set, instance, {
          account: authResult.account,
          accessToken: authResult.accessToken,
          graphClient,
        });
        return;
      }

      // 无 redirect 结果，检查已有账户
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        const account = accounts[0];
        set({ msalInstance: instance, isInitialized: true, isLoading: false });
        try {
          const response = await instance.acquireTokenSilent({ scopes: [...SCOPES], account });
          const graphClient = buildGraphClient(response.accessToken);
          set({ account, accessToken: response.accessToken, graphClient, isLoading: false });
        } catch {
          set({ account, isLoading: false });
        }
      } else {
        // 无账户 → 显示登录页
        setInitialized(set, instance, {});
      }
    } catch (error) {
      console.error('[MSAL] initialization failed:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  setAccount: (account) => set({ account }),
  setAccessToken: (token) => set({ accessToken: token }),
  setGraphClient: (client) => set({ graphClient: client }),
  setLoading: (loading) => set({ isLoading: loading }),

  clearAuth: () =>
    set({
      account: null,
      accessToken: null,
      graphClient: null,
    }),

  login: async () => {
    const { msalInstance } = get();
    if (!msalInstance) return;
    set({ isLoading: true });
    try {
      // 使用 loginRedirect 替代 loginPopup（手机浏览器兼容性更好，不会被弹窗拦截）
      await msalInstance.loginRedirect({ scopes: [...SCOPES] });
      // loginRedirect 会触发页面跳转，这里不会执行到
    } catch (error) {
      console.error('[MSAL] login redirect failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    const { msalInstance } = get();
    if (!msalInstance) return;
    try {
      await msalInstance.logoutRedirect();
      // logoutRedirect 触发页面跳转，AuthCallback 会处理清理
    } catch (error) {
      console.error('[MSAL] logout redirect failed:', error);
    }
  },

  acquireToken: async () => {
    const { msalInstance, account } = get();
    if (!msalInstance || !account) throw new Error('Not authenticated');

    try {
      const response = await msalInstance.acquireTokenSilent({ scopes: [...SCOPES], account });
      const graphClient = buildGraphClient(response.accessToken);
      set({ accessToken: response.accessToken, graphClient });
      return response.accessToken;
    } catch {
      // 静默获取失败，尝试交互式
      try {
        const response = await msalInstance.acquireTokenPopup({ scopes: [...SCOPES] });
        const graphClient = buildGraphClient(response.accessToken);
        set({ accessToken: response.accessToken, graphClient });
        return response.accessToken;
      } catch {
        get().logout();
        throw new Error('Token acquisition failed');
      }
    }
  },
}));