# Onedrive Upload Manager — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完整的 PWA 单页应用，通过 Microsoft Graph API 管理 OneDrive 个人账户文件，支持登录认证、文件夹浏览、拖拽上传、Quick Note 编辑。

**Architecture:** 使用 Vite + React 18 + TypeScript strict mode，前端路由用 React Router v6，状态管理用 Zustand，认证用 MSAL.js，UI 用 Tailwind CSS + daisyUI，PWA 支持用 vite-plugin-pwa。

**Tech Stack:** Vite ^5.x, React 18.x, TypeScript strict, Tailwind CSS + daisyUI, React Router v6, Zustand ^4.x, @azure/msal-browser ^3.x, @microsoft/microsoft-graph-client ^3.x, @monaco-editor/react ^4.x, react-markdown, react-dropzone ^14.x, lucide-react, vite-plugin-pwa

---

## Phase 总览

| Phase | 目标 | 核心产出 | 验收标准 |
|-------|------|----------|----------|
| **Phase 1** | 脚手架 + 登录页 | 项目初始化、配置文件、LoginPage | `npm run dev` 无编译错误，显示登录页 |
| **Phase 2** | 主页 + 文件夹浏览 | HomePage、FolderGrid、FolderCard | 显示文件夹网格，点击能进入文件夹 |
| **Phase 3** | 文件上传 | DropZone、UploadService、进度显示 | 拖拽文件到文件夹页面能上传并显示进度 |
| **Phase 4** | Quick Note + PWA | Monaco编辑器、noteStore、PWA配置 | 能编辑笔记并保存，可安装到桌面 |

---

## Phase 1：脚手架 + 登录页

### 目标
完成项目初始化和基础配置，确保 `npm run dev` 能正常运行并显示登录页面。

### Task 1: 初始化 Vite + React + TypeScript 项目

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`（路由框架，导向登录页）
- Create: `src/vite-env.d.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/index.css`

**Steps:**

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "onedrive-upload-manager",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@azure/msal-browser": "^3.11.0",
    "@microsoft/microsoft-graph-client": "^3.0.7",
    "@monaco-editor/react": "^4.6.0",
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-dropzone": "^14.2.3",
    "react-markdown": "^9.0.1",
    "react-router-dom": "^6.22.0",
    "remark-gfm": "^4.0.0",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "daisyui": "^4.7.2",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.1.4",
    "vite-plugin-pwa": "^0.19.2"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Onedrive Upload Manager',
        short_name: 'OneDrive Upload',
        description: '管理你的 OneDrive 文件',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/graph\.microsoft\.com\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173
  }
});
```

- [ ] **Step 3: 创建 tsconfig.json（strict mode）**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: 创建 tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {}
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          primary: '#3b82f6',
          secondary: '#6366f1',
          accent: '#f59e0b',
          neutral: '#1f2937',
          'base-100': '#ffffff',
          'base-200': '#f3f4f6',
          'base-300': '#e5e7eb',
          info: '#0ea5e9',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444'
        },
        dark: {
          primary: '#60a5fa',
          secondary: '#818cf8',
          accent: '#fbbf24',
          neutral: '#1f2937',
          'base-100': '#111827',
          'base-200': '#1f2937',
          'base-300': '#374151',
          info: '#38bdf8',
          success: '#4ade80',
          warning: '#fbbf24',
          error: '#f87171'
        }
      }
    ]
  }
};
```

- [ ] **Step 6: 创建 postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

- [ ] **Step 7: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/icons/icon-192.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#3b82f6" />
    <title>Onedrive Upload Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: 创建 src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

body {
  @apply antialiased;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  @apply bg-base-200;
}

::-webkit-scrollbar-thumb {
  @apply bg-base-300 rounded-full;
}

/* Monaco editor container */
.monaco-editor-container {
  height: 100%;
  width: 100%;
}

/* Dropzone overlay */
.dropzone-active {
  @apply fixed inset-0 z-50 bg-blue-500/10 border-4 border-dashed border-blue-500 flex items-center justify-center;
}
```

- [ ] **Step 9: 创建 src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
```

- [ ] **Step 10: 创建 src/main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 11: 创建 src/App.tsx（Phase 1 最小路由框架）**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './services/authService';
import LoginPage from './components/auth/LoginPage';
import AuthCallback from './components/auth/AuthCallback';
import Layout from './components/layout/Layout';
import HomePage from './components/home/HomePage';
import FolderDetailPage from './components/folder/FolderDetailPage';
import ToastContainer from './components/layout/ToastContainer';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';

const msalInstance = new PublicClientApplication(msalConfig);

export default function App() {
  const initializeMsal = useAuthStore((s) => s.initializeMsal);

  useEffect(() => {
    initializeMsal(msalInstance);
  }, []);

  return (
    <MsalProvider instance={msalInstance}>
      <BrowserRouter>
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
      </BrowserRouter>
    </MsalProvider>
  );
}
```

- [ ] **Step 12: 安装依赖**

Run: `cd "c:/Claude code Project/Onedrive-sys" && npm install`
Expected: 所有依赖安装完成，无报错

- [ ] **Step 13: 创建 public/icons 占位符目录和占位图标文件**

Create: `public/icons/icon-192.png` (1x1 transparent PNG placeholder)
Create: `public/icons/icon-512.png` (1x1 transparent PNG placeholder)
Create: `public/manifest.json`

- [ ] **Step 14: 验证项目启动**

Run: `npm run dev`
Expected: 浏览器打开 http://localhost:5173，无编译错误

### Task 2: 创建全局类型定义（Phase 1 基础设施）

**Files:**
- Create: `src/types/index.ts`

**Steps:**

- [ ] **Step 1: 创建 src/types/index.ts**

```typescript
// Microsoft Graph API 类型扩展
declare module '@microsoft/microsoft-graph-client' {
  export interface Client {
    api(path: string): Request;
  }
}

// DriveItem 类型（OneDrive 文件/文件夹）
export interface DriveItem {
  id: string;
  name: string;
  size?: number;
  lastModifiedDateTime?: string;
  createdDateTime?: string;
  mimeType?: string;
  file?: {
    mimeType: string;
    hashes?: {
      quickXorHash?: string;
    };
  };
  folder?: {
    childCount: number;
  };
  webUrl?: string;
  parentReference?: {
    driveId: string;
    id: string;
    path: string;
  };
  fileSystemInfo?: {
    createdDateTime?: string;
    lastModifiedDateTime?: string;
  };
}

// 用户信息
export interface UserProfile {
  id: string;
  displayName: string;
  mail?: string;
  userPrincipalName: string;
  photoUrl?: string;
}

// Toast 类型
export type ToastType = 'success' | 'error' | 'info' | 'uploading';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  progress?: number;       // 0-100，用于上传进度
  totalBytes?: number;    // 总字节数
  uploadedBytes?: number; // 已上传字节数
  autoClose?: boolean;    // 是否自动消失
}

// 文件夹颜色映射
export type FolderColorKey = 'blue' | 'green' | 'purple' | 'orange' | 'gray';

export interface FolderColorMap {
  key: FolderColorKey;
  textColor: string;
  bgColor: string;
  borderColor: string;
  iconBgColor: string;
}

// 上传进度回调
export interface UploadProgress {
  fileName: string;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  speed?: number; // bytes/s
}

// 排序配置
export interface SortConfig {
  column: keyof DriveItem;
  direction: 'asc' | 'desc';
}
```

### Task 3: 创建工具函数（Phase 1 基础设施）

**Files:**
- Create: `src/utils/constants.ts`
- Create: `src/utils/format.ts`
- Create: `src/utils/folderColor.ts`

**Steps:**

- [ ] **Step 1: 创建 src/utils/constants.ts**

```typescript
// MSAL 配置常量
export const MSAL_CONFIG = {
  clientId: 'ae6ceb41-6cf4-4bcf-89a2-7ca49b8fb417',
  authority: 'https://login.microsoftonline.com/consumers',
  redirectUri: 'http://localhost:5173',
  postLogoutRedirectUri: 'http://localhost:5173/login',
  scopes: ['User.Read', 'Files.ReadWrite.All', 'offline_access'] as const,
};

// Graph API 配置
export const GRAPH_CONFIG = {
  baseUrl: 'https://graph.microsoft.com/v1.0',
};

// 上传配置
export const UPLOAD_CONFIG = {
  // 小文件阈值：4MB
  smallFileThreshold: 4 * 1024 * 1024,
  // 分片大小：5 MiB（必须是 320 KiB 的倍数）
  chunkSize: 5 * 1024 * 1024,
  // 320 KiB = 327,680 bytes（Graph API 分片最小倍数）
  minChunkMultiple: 327680,
  // 最大重试次数
  maxRetries: 3,
  // 初始重试延迟（ms）
  initialRetryDelay: 1000,
  // 指数退避基数
  retryBackoffBase: 2,
};

// Note 自动保存 debounce
export const NOTE_CONFIG = {
  autoSaveDelay: 800, // ms
  noteFilePath: '/upload/note.md',
};

// Toast 自动消失时间
export const TOAST_CONFIG = {
  successDuration: 5000,
  infoDuration: 5000,
  errorDuration: 0, // 不自动消失
};
```

- [ ] **Step 2: 创建 src/utils/format.ts**

```typescript
/**
 * 格式化文件大小为人类可读字符串
 * @param bytes 字节数
 * @returns 格式化后的字符串，如 "1.2 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * 格式化日期为本地可读字符串
 * @param dateString ISO 日期字符串
 * @returns 格式化后的日期，如 "2026-03-29"
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化日期+时间为本地可读字符串
 * @param dateString ISO 日期字符串
 * @returns 格式化后的日期时间，如 "2026-03-29 14:30"
 */
export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化相对时间（如"3天前"）
 * @param dateString ISO 日期字符串
 * @returns 相对时间字符串
 */
export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) return formatDate(dateString);
  if (diffDay > 0) return `${diffDay}天前`;
  if (diffHour > 0) return `${diffHour}小时前`;
  if (diffMin > 0) return `${diffMin}分钟前`;
  return '刚刚';
}

/**
 * 根据文件名获取文件类型图标
 * @param fileName 文件名
 * @returns 图标名称（lucide-react）
 */
export function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const iconMap: Record<string, string> = {
    pdf: 'FileText',
    doc: 'FileText',
    docx: 'FileText',
    xls: 'FileSpreadsheet',
    xlsx: 'FileSpreadsheet',
    ppt: 'FilePresentation',
    pptx: 'FilePresentation',
    txt: 'FileText',
    md: 'FileCode',
    jpg: 'Image',
    jpeg: 'Image',
    png: 'Image',
    gif: 'Image',
    svg: 'Image',
    webp: 'Image',
    mp4: 'Video',
    mov: 'Video',
    avi: 'Video',
    mp3: 'Music',
    wav: 'Music',
    zip: 'Archive',
    rar: 'Archive',
    '7z': 'Archive',
    js: 'FileCode',
    ts: 'FileCode',
    tsx: 'FileCode',
    jsx: 'FileCode',
    py: 'FileCode',
    java: 'FileCode',
    css: 'FileCode',
    html: 'FileCode',
    json: 'FileCode',
  };
  return iconMap[ext] ?? 'File';
}

/**
 * 根据文件名判断是否为文件夹
 */
export function isFolder(item: { folder?: unknown }): boolean {
  return !!item.folder;
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
```

- [ ] **Step 3: 创建 src/utils/folderColor.ts**

```typescript
import type { DriveItem, FolderColorKey, FolderColorMap } from '@/types';

export const FOLDER_COLORS: Record<FolderColorKey, FolderColorMap> = {
  blue: {
    key: 'blue',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconBgColor: 'bg-blue-500',
  },
  green: {
    key: 'green',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconBgColor: 'bg-green-500',
  },
  purple: {
    key: 'purple',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    iconBgColor: 'bg-purple-500',
  },
  orange: {
    key: 'orange',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconBgColor: 'bg-orange-500',
  },
  gray: {
    key: 'gray',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    iconBgColor: 'bg-gray-500',
  },
};

/**
 * 固定文件夹名称关键词到颜色的映射
 */
const FOLDER_KEYWORD_MAP: Record<string, FolderColorKey> = {
  文件存储: 'blue',
  资料备份: 'green',
  共享资源: 'purple',
  临时归类: 'orange',
};

/**
 * 根据文件夹名称返回颜色配置
 */
export function getFolderColor(folderName: string): FolderColorMap {
  for (const [keyword, colorKey] of Object.entries(FOLDER_KEYWORD_MAP)) {
    if (folderName.includes(keyword)) {
      return FOLDER_COLORS[colorKey];
    }
  }
  return FOLDER_COLORS.gray;
}

/**
 * 根据 DriveItem 返回颜色配置
 */
export function getColorForFolder(item: DriveItem): FolderColorMap {
  return getFolderColor(item.name);
}
```

### Task 4: 创建 Zustand Stores（Phase 1 基础设施）

**Files:**
- Create: `src/stores/authStore.ts`
- Create: `src/stores/uiStore.ts`
- Create: `src/stores/fileStore.ts`
- Create: `src/stores/noteStore.ts`

**Steps:**

- [ ] **Step 1: 创建 src/stores/authStore.ts**

```typescript
import { create } from 'zustand';
import { AccountInfo, PublicClientApplication } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { MSAL_CONFIG } from '@/utils/constants';

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
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        const account = accounts[0];
        set({ account, msalInstance: instance, isInitialized: true, isLoading: false });
        // 尝试静默获取 token
        try {
          const response = await instance.acquireTokenSilent({
            scopes: [...MSAL_CONFIG.scopes],
            account,
          });
          const graphClient = Client.init({
            authProvider: (done) => {
              done(null, response.accessToken);
            },
          });
          set({ accessToken: response.accessToken, graphClient, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      } else {
        set({ msalInstance: instance, isInitialized: true, isLoading: false });
      }
    } catch (error) {
      console.error('MSAL initialization failed:', error);
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
      const response = await msalInstance.loginPopup({
        scopes: [...MSAL_CONFIG.scopes],
      });
      const graphClient = Client.init({
        authProvider: (done) => {
          done(null, response.accessToken);
        },
      });
      set({
        account: response.account,
        accessToken: response.accessToken,
        graphClient,
        isLoading: false,
      });
    } catch (error) {
      console.error('Login failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    const { msalInstance } = get();
    if (!msalInstance) return;
    try {
      await msalInstance.logoutPopup();
      get().clearAuth();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },

  acquireToken: async () => {
    const { msalInstance, account } = get();
    if (!msalInstance || !account) throw new Error('Not authenticated');

    try {
      const response = await msalInstance.acquireTokenSilent({
        scopes: [...MSAL_CONFIG.scopes],
        account,
      });
      const graphClient = Client.init({
        authProvider: (done) => {
          done(null, response.accessToken);
        },
      });
      set({ accessToken: response.accessToken, graphClient });
      return response.accessToken;
    } catch (error) {
      // 静默获取失败，尝试交互式
      try {
        const response = await msalInstance.acquireTokenPopup({
          scopes: [...MSAL_CONFIG.scopes],
        });
        const graphClient = Client.init({
          authProvider: (done) => {
            done(null, response.accessToken);
          },
        });
        set({ accessToken: response.accessToken, graphClient });
        return response.accessToken;
      } catch {
        // token 获取失败，跳转登录
        get().logout();
        throw new Error('Token acquisition failed');
      }
    }
  },
}));
```

- [ ] **Step 2: 创建 src/stores/uiStore.ts**

```typescript
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
        const duration =
          toast.type === 'uploading' ? 0 : toast.type === 'error' ? TOAST_CONFIG.errorDuration : TOAST_CONFIG[toast.type as ToastType] ?? TOAST_CONFIG.infoDuration;

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
```

- [ ] **Step 3: 创建 src/stores/fileStore.ts**

```typescript
import { create } from 'zustand';
import type { DriveItem } from '@/types';

interface FileState {
  currentFolder: DriveItem | null;
  files: DriveItem[];
  folderList: DriveItem[];
  isLoading: boolean;
  error: string | null;
  setCurrentFolder: (folder: DriveItem | null) => void;
  setFiles: (files: DriveItem[]) => void;
  setFolderList: (folders: DriveItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addFile: (file: DriveItem) => void;
  removeFile: (fileId: string) => void;
  updateFile: (fileId: string, updates: Partial<DriveItem>) => void;
  clearFiles: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  currentFolder: null,
  files: [],
  folderList: [],
  isLoading: false,
  error: null,

  setCurrentFolder: (folder) => set({ currentFolder: folder }),
  setFiles: (files) => set({ files }),
  setFolderList: (folders) => set({ folderList: folders }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  addFile: (file) =>
    set((state) => ({
      files: state.files.some((f) => f.id === file.id)
        ? state.files.map((f) => (f.id === file.id ? file : f))
        : [file, ...state.files],
    })),

  removeFile: (fileId) =>
    set((state) => ({ files: state.files.filter((f) => f.id !== fileId) })),

  updateFile: (fileId, updates) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === fileId ? { ...f, ...updates } : f)),
    })),

  clearFiles: () => set({ files: [], currentFolder: null }),
}));
```

- [ ] **Step 4: 创建 src/stores/noteStore.ts**

```typescript
import { create } from 'zustand';
import { NOTE_CONFIG } from '@/utils/constants';

interface NoteState {
  content: string;
  originalContent: string;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  loadNote: (content: string) => void;
  setContent: (content: string) => void;
  setSaving: (saving: boolean) => void;
  markSaved: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  content: '',
  originalContent: '',
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  error: null,

  loadNote: (content) => {
    set({
      content,
      originalContent: content,
      isDirty: false,
      isSaving: false,
      lastSaved: new Date(),
      error: null,
    });
  },

  setContent: (content) => {
    const { originalContent } = get();
    set({
      content,
      isDirty: content !== originalContent,
    });
  },

  setSaving: (saving) => set({ isSaving: saving }),

  markSaved: () => {
    const { content } = get();
    set({
      originalContent: content,
      isDirty: false,
      isSaving: false,
      lastSaved: new Date(),
      error: null,
    });
  },

  setError: (error) => set({ error, isSaving: false }),

  reset: () =>
    set({
      content: '',
      originalContent: '',
      isDirty: false,
      isSaving: false,
      lastSaved: null,
      error: null,
    }),
}));

// 导出 debounce 延迟常量供外部使用
export { NOTE_CONFIG };
```

### Task 5: 创建服务层（Phase 1 基础设施）

**Files:**
- Create: `src/services/authService.ts`
- Create: `src/services/graphService.ts`
- Create: `src/services/uploadService.ts`

**Steps:**

- [ ] **Step 1: 创建 src/services/authService.ts**

```typescript
import { Configuration, PublicClientApplication } from '@azure/msal-browser';
import { MSAL_CONFIG } from '@/utils/constants';

export const msalConfig: Configuration = {
  auth: {
    clientId: MSAL_CONFIG.clientId,
    authority: MSAL_CONFIG.authority,
    redirectUri: MSAL_CONFIG.redirectUri,
    postLogoutRedirectUri: MSAL_CONFIG.postLogoutRedirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        console.log(`[MSAL ${level}]`, message);
      },
    },
  },
};

export { MSAL_CONFIG };
```

- [ ] **Step 2: 创建 src/services/graphService.ts**

```typescript
import { Client } from '@microsoft/microsoft-graph-client';
import type { DriveItem } from '@/types';

/**
 * 创建 Graph Client（带 authProvider）
 */
export function createGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

/**
 * 获取当前用户信息
 */
export async function getUserProfile(client: Client): Promise<DriveItem['id'] & { displayName: string; mail?: string; userPrincipalName: string; id: string }> {
  return client.api('/me').get();
}

/**
 * 获取 /upload 目录下的子文件夹列表
 */
export async function listUploadFolders(client: Client): Promise<DriveItem[]> {
  const response = await client.api('/me/drive/root:/upload:/children').filter('folder ne null').get();
  return response.value ?? [];
}

/**
 * 获取指定文件夹内的所有项目（文件+子文件夹）
 */
export async function listFolderChildren(client: Client, folderId: string): Promise<DriveItem[]> {
  const response = await client.api(`/me/drive/items/${folderId}/children`).get();
  return response.value ?? [];
}

/**
 * 获取指定路径的 DriveItem
 */
export async function getDriveItem(client: Client, path: string): Promise<DriveItem> {
  return client.api(`/me/drive/root:${path}`).get();
}

/**
 * 上传小文件（≤4MB）
 */
export async function uploadSmallFile(
  client: Client,
  parentId: string,
  fileName: string,
  content: Blob | ArrayBuffer,
  conflictBehavior: string = 'rename'
): Promise<DriveItem> {
  return client
    .api(`/me/drive/items/${parentId}:/${fileName}:/content`)
    .put(content, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      queryParameters: {
        '@microsoft.graph.conflictBehavior': conflictBehavior,
      },
    }) as Promise<DriveItem>;
}

/**
 * 更新现有文件的内容（通过 item ID，PUT /content 直接覆盖）
 * 注意：这里不使用 conflictBehavior，因为是直接更新指定 item
 */
export async function updateFileContent(
  client: Client,
  itemId: string,
  content: Blob | ArrayBuffer
): Promise<DriveItem> {
  return client
    .api(`/me/drive/items/${itemId}/content`)
    .put(content, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    }) as Promise<DriveItem>;
}

/**
 * 创建分片上传会话
 */
export async function createUploadSession(
  client: Client,
  parentId: string,
  fileName: string,
  conflictBehavior: string = 'rename'
): Promise<{ uploadUrl: string; expirationDateTime: string }> {
  const response = await client
    .api(`/me/drive/items/${parentId}:/${fileName}:/createUploadSession`)
    .post({
      item: {
        '@microsoft.graph.conflictBehavior': conflictBehavior,
      },
    });
  return {
    uploadUrl: response.uploadUrl,
    expirationDateTime: response.expirationDateTime,
  };
}

/**
 * 分片上传（直接发送到 uploadUrl）
 */
export async function uploadChunk(
  uploadUrl: string,
  content: Blob,
  startByte: number,
  endByte: number,
  totalSize: number
): Promise<Response> {
  const slice = content.slice(startByte, endByte);
  return fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(endByte - startByte),
      'Content-Range': `bytes ${startByte}-${endByte - 1}/${totalSize}`,
    },
    body: slice,
  });
}

/**
 * 删除文件或文件夹
 */
export async function deleteItem(client: Client, itemId: string): Promise<void> {
  await client.api(`/me/drive/items/${itemId}`).delete();
}

/**
 * 重命名文件或文件夹
 */
export async function renameItem(client: Client, itemId: string, newName: string): Promise<DriveItem> {
  return client.api(`/me/drive/items/${itemId}`).patch({ name: newName });
}

/**
 * 获取文件下载 URL
 */
export async function getDownloadUrl(client: Client, itemId: string): Promise<string> {
  const item = await client.api(`/me/drive/items/${itemId}`).select(['@microsoft.graph.downloadUrl']).get();
  return item['@microsoft.graph.downloadUrl'];
}

/**
 * 获取文件缩略图 URL
 */
export async function getThumbnail(client: Client, itemId: string, size: string = 'medium'): Promise<string | null> {
  try {
    const response = await client.api(`/me/drive/items/${itemId}/thumbnails`).get();
    const thumbnails = response.value as Array<{ [key: string]: { url: string } }>;
    if (thumbnails && thumbnails.length > 0) {
      return thumbnails[0][size]?.url ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 获取文件夹的子文件夹数量
 */
export async function getFolderChildCount(client: Client, folderId: string): Promise<number> {
  try {
    const response = await client.api(`/me/drive/items/${folderId}/children`).top(1).select('id').get();
    // @odata.count 在支持的情况下返回总数
    return (response as { '@odata.count'?: number }).['@odata.count'] ?? 0;
  } catch {
    return 0;
  }
}
```

- [ ] **Step 3: 创建 src/services/uploadService.ts**

```typescript
import { Client } from '@microsoft/microsoft-graph-client';
import { createUploadSession, uploadChunk, uploadSmallFile } from './graphService';
import { UPLOAD_CONFIG } from '@/utils/constants';
import type { UploadProgress } from '@/types';

type ProgressCallback = (progress: UploadProgress) => void;

/**
 * 上传单个文件，自动判断使用小文件直接上传还是分片上传
 */
export async function uploadFile(
  client: Client,
  parentId: string,
  file: File,
  onProgress?: ProgressCallback,
  conflictBehavior: string = 'rename'
): Promise<void> {
  const totalBytes = file.size;

  if (totalBytes <= UPLOAD_CONFIG.smallFileThreshold) {
    // 小文件直接上传
    await uploadSmallFileWithProgress(client, parentId, file, onProgress, conflictBehavior);
  } else {
    // 大文件分片上传
    await uploadLargeFileWithProgress(client, parentId, file, onProgress, conflictBehavior);
  }
}

/**
 * 小文件上传（带进度）
 */
async function uploadSmallFileWithProgress(
  client: Client,
  parentId: string,
  file: File,
  onProgress?: ProgressCallback,
  conflictBehavior: string = 'rename'
): Promise<void> {
  // 小文件不分片，上传完成前不报告中间进度，只报告开始和完成状态
  onProgress?.({
    fileName: file.name,
    uploadedBytes: 0,
    totalBytes: file.size,
    percentage: 0,
  });

  try {
    await uploadSmallFile(client, parentId, file.name, file, conflictBehavior);
    // 上传完成，报告 100%
    onProgress?.({
      fileName: file.name,
      uploadedBytes: file.size,
      totalBytes: file.size,
      percentage: 100,
    });
  } catch (error) {
    throw error;
  }
}

/**
 * 大文件分片上传（带进度和重试）
 */
async function uploadLargeFileWithProgress(
  client: Client,
  parentId: string,
  file: File,
  onProgress?: ProgressCallback,
  conflictBehavior: string = 'rename'
): Promise<void> {
  const totalSize = file.size;
  const chunkSize = UPLOAD_CONFIG.chunkSize;
  let uploadedBytes = 0;

  // 创建上传会话
  const { uploadUrl } = await createUploadSession(client, parentId, file.name, conflictBehavior);

  // 计算分片数
  const totalChunks = Math.ceil(totalSize / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalSize);
    const slice = file.slice(start, end);

    let retries = 0;
    let success = false;

    while (retries < UPLOAD_CONFIG.maxRetries && !success) {
      try {
        const response = await uploadChunk(uploadUrl, file, start, end, totalSize);

        if (response.ok) {
          const data = await response.json();
          // 如果服务器返回 nextExpectedRanges 或完成状态
          if (data.status === 'completed' || !data.nextExpectedRanges) {
            uploadedBytes = totalSize;
            success = true;
          } else {
            // 更新已上传字节
            uploadedBytes = end;
            success = true;
          }
        } else if (response.status === 409) {
          // 冲突
          throw new Error('File conflict: file already exists');
        } else if (response.status === 202) {
          // 接受但未完成，继续
          uploadedBytes = end;
          success = true;
        } else {
          throw new Error(`Upload failed: ${response.status}`);
        }
      } catch (error) {
        retries++;
        if (retries >= UPLOAD_CONFIG.maxRetries) {
          throw new Error(`Upload failed after ${UPLOAD_CONFIG.maxRetries} retries: ${error}`);
        }
        // 指数退避
        const delay = UPLOAD_CONFIG.initialRetryDelay * Math.pow(UPLOAD_CONFIG.retryBackoffBase, retries - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // 上报进度
    const percentage = Math.round((uploadedBytes / totalSize) * 100);
    onProgress?.({
      fileName: file.name,
      uploadedBytes,
      totalBytes: totalSize,
      percentage,
    });
  }
}

/**
 * 批量上传多个文件
 */
export async function uploadFiles(
  client: Client,
  parentId: string,
  files: File[],
  onFileProgress?: (file: File, progress: UploadProgress) => void,
  onOverallProgress?: (completed: number, total: number) => void,
  conflictBehavior: string = 'rename'
): Promise<{ succeeded: string[]; failed: { file: File; error: string }[] }> {
  const succeeded: string[] = [];
  const failed: { file: File; error: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      await uploadFile(
        client,
        parentId,
        file,
        (progress) => {
          onFileProgress?.(file, progress);
          const completed = succeeded.length + failed.length + (progress.percentage < 100 ? 0 : 1);
          onOverallProgress?.(completed, files.length);
        },
        conflictBehavior
      );
      succeeded.push(file.name);
    } catch (error) {
      failed.push({ file, error: String(error) });
    }
  }

  return { succeeded, failed };
}
```

### Task 6: 创建认证页面（Phase 1 核心产出）

**Files:**
- Create: `src/components/auth/LoginPage.tsx`
- Create: `src/components/auth/AuthCallback.tsx`

**Steps:**

- [ ] **Step 1: 创建 src/components/auth/LoginPage.tsx**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { CloudUpload } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const account = useAuthStore((s) => s.account);
  const addToast = useUIStore((s) => s.addToast);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 如果已登录，跳转主页
  if (account) {
    navigate('/', { replace: true });
    return null;
  }

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
      addToast({ type: 'success', message: '登录成功！' });
      navigate('/', { replace: true });
    } catch (error) {
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
            <CloudUpload className="w-10 h-10 text-primary" />
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
                正在跳转...
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
```

- [ ] **Step 2: 创建 src/components/auth/AuthCallback.tsx**

```typescript
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
```

### Task 7: 创建布局组件（Phase 1 基础设施）

**Files:**
- Create: `src/components/layout/TopBar.tsx`
- Create: `src/components/layout/ToastContainer.tsx`
- Create: `src/components/layout/Layout.tsx`

**Steps:**

- [ ] **Step 1: 创建 src/components/layout/TopBar.tsx**

```typescript
import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun, CloudUpload, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useEffect, useState } from 'react';

export default function TopBar() {
  const navigate = useNavigate();
  const account = useAuthStore((s) => s.account);
  const logout = useAuthStore((s) => s.logout);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
  const addToast = useUIStore((s) => s.addToast);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      addToast({ type: 'info', message: '已退出登录' });
      navigate('/login', { replace: true });
    } catch {
      addToast({ type: 'error', message: '退出失败' });
      setLoggingOut(false);
    }
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
            <CloudUpload className="w-5 h-5 text-primary" />
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
              disabled={loggingOut}
              title="退出登录"
            >
              {loggingOut ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">登出</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 src/components/layout/ToastContainer.tsx**

```typescript
import { useUIStore } from '@/stores/uiStore';
import { X, CheckCircle, AlertCircle, Info, Upload } from 'lucide-react';
import { formatFileSize } from '@/utils/format';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  uploading: Upload,
};

const colorMap = {
  success: 'alert-success',
  error: 'alert-error',
  info: 'alert-info',
  uploading: 'alert-info',
};

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast toast-end toast-bottom z-[100]">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div key={toast.id} className={`alert ${colorMap[toast.type]} shadow-lg flex-row items-start gap-3 min-w-[300px]`}>
            {/* 图标 */}
            <div className="shrink-0 mt-0.5">
              {toast.type === 'uploading' ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Icon className="w-5 h-5" />
              )}
            </div>

            {/* 内容 */}
            <div className="flex-1">
              <div className="text-sm font-medium">{toast.message}</div>

              {/* 上传进度条 */}
              {toast.type === 'uploading' && toast.progress !== undefined && (
                <div className="mt-2">
                  <progress
                    className="progress progress-info w-full"
                    value={toast.progress}
                    max="100"
                  />
                  <div className="flex justify-between text-xs mt-1 opacity-80">
                    <span>{toast.progress}%</span>
                    {toast.totalBytes && toast.uploadedBytes && (
                      <span>
                        {formatFileSize(toast.uploadedBytes)} / {formatFileSize(toast.totalBytes)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 关闭按钮 */}
            <button
              className="btn btn-ghost btn-xs btn-square shrink-0"
              onClick={() => removeToast(toast.id)}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: 创建 src/components/layout/Layout.tsx**

```typescript
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
```

### Phase 1 验收标准

- [ ] `npm run dev` 无编译错误
- [ ] 浏览器打开 http://localhost:5173 显示登录页
- [ ] 登录页包含 Microsoft 登录按钮
- [ ] 点击登录按钮能触发 MSAL 登录流程（需要 Azure AD 应用配置）
- [ ] TypeScript strict mode 无报错

---

## Phase 2：主页 + 文件夹浏览

### 目标
完成主页和文件夹浏览功能，用户登录后能看到文件夹网格并能进入文件夹查看文件列表。

### Task 8: 创建主页组件

**Files:**
- Create: `src/components/home/FolderCard.tsx`
- Create: `src/components/home/FolderGrid.tsx`
- Create: `src/components/home/QuickNote.tsx`（占位组件，Phase 4 完善）
- Create: `src/components/home/HomePage.tsx`

**Steps:**

- [ ] **Step 1: 创建 src/components/home/FolderCard.tsx**

```typescript
import { Folder } from 'lucide-react';
import type { DriveItem } from '@/types';
import { getColorForFolder } from '@/utils/folderColor';
import { formatRelativeTime } from '@/utils/format';

interface FolderCardProps {
  folder: DriveItem;
  onClick: () => void;
}

export default function FolderCard({ folder, onClick }: FolderCardProps) {
  const colors = getColorForFolder(folder);
  const childCount = folder.folder?.childCount ?? 0;

  return (
    <div
      onClick={onClick}
      className={`card bg-base-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border ${colors.borderColor}`}
    >
      <div className="card-body p-5">
        {/* 图标 */}
        <div className={`w-14 h-14 rounded-2xl ${colors.iconBgColor} flex items-center justify-center mb-4`}>
          <Folder className="w-8 h-8 text-white" />
        </div>

        {/* 文件夹名 */}
        <h3 className={`font-semibold text-base ${colors.textColor} truncate`} title={folder.name}>
          {folder.name}
        </h3>

        {/* 元信息 */}
        <div className="flex items-center gap-3 mt-2 text-xs text-base-content/50">
          <span className="flex items-center gap-1">
            <span className="font-medium">{childCount}</span> 个文件
          </span>
          {folder.lastModifiedDateTime && (
            <>
              <span>·</span>
              <span>{formatRelativeTime(folder.lastModifiedDateTime)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 src/components/home/FolderGrid.tsx**

```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderGrid, RefreshCw, Loader2 } from 'lucide-react';
import { useFileStore } from '@/stores/fileStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { listUploadFolders } from '@/services/graphService';
import FolderCard from './FolderCard';
import type { DriveItem } from '@/types';

export default function FolderGrid() {
  const navigate = useNavigate();
  const graphClient = useAuthStore((s) => s.graphClient);
  const folderList = useFileStore((s) => s.folderList);
  const setFolderList = useFileStore((s) => s.setFolderList);
  const isLoading = useFileStore((s) => s.isLoading);
  const setLoading = useFileStore((s) => s.setLoading);
  const addToast = useUIStore((s) => s.addToast);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFolders = async () => {
    if (!graphClient) return;
    setLoading(true);
    try {
      const folders = await listUploadFolders(graphClient);
      setFolderList(folders);
    } catch (error) {
      addToast({ type: 'error', message: '获取文件夹列表失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [graphClient]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFolders();
    setRefreshing(false);
  };

  const handleFolderClick = (folder: DriveItem) => {
    navigate(`/folder/${folder.id}`);
  };

  if (isLoading && folderList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-base-content/60">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderGrid className="w-5 h-5 text-base-content/60" />
          <h2 className="text-lg font-semibold">文件夹</h2>
          <span className="badge badge-ghost badge-sm">{folderList.length}</span>
        </div>
        <button
          className="btn btn-ghost btn-sm gap-1"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* 文件夹网格 */}
      {folderList.length === 0 ? (
        <div className="text-center py-12 text-base-content/50">
          <p>暂无文件夹</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {folderList.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onClick={() => handleFolderClick(folder)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 创建 src/components/home/QuickNote.tsx（占位）**

```typescript
// Phase 4 完整实现
// Phase 2/3 只需要一个基本展开/收起结构
import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';

export default function QuickNote() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card bg-base-100">
      <button
        className="card-body p-4 flex flex-row items-center gap-2 hover:bg-base-200 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-primary" />
        ) : (
          <ChevronRight className="w-5 h-5 text-primary" />
        )}
        <FileText className="w-5 h-5 text-primary" />
        <span className="font-semibold">快速笔记</span>
        <span className="text-xs text-base-content/50 ml-auto">Phase 4 可用</span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 text-base-content/60 text-sm">
          笔记编辑器将在 Phase 4 实现
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 创建 src/components/home/HomePage.tsx**

```typescript
import FolderGrid from './FolderGrid';
import QuickNote from './QuickNote';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <FolderGrid />
      <QuickNote />
    </div>
  );
}
```

### Task 9: 创建文件夹详情页组件

**Files:**
- Create: `src/components/folder/Breadcrumb.tsx`
- Create: `src/components/folder/FileTable.tsx`（简化版，Phase 3 完善）
- Create: `src/components/folder/FileRow.tsx`
- Create: `src/components/folder/FolderDetailPage.tsx`

**Steps:**

- [ ] **Step 1: 创建 src/components/folder/Breadcrumb.tsx**

```typescript
import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  id?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link
        to="/"
        className="flex items-center gap-1 text-base-content/60 hover:text-primary transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>主页</span>
      </Link>

      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-base-content/30" />
          {item.id ? (
            <span className="text-base-content font-medium">{item.name}</span>
          ) : (
            <span className="text-base-content/60">{item.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: 创建 src/components/folder/FileRow.tsx**

```typescript
import { File, Folder } from 'lucide-react';
import type { DriveItem } from '@/types';
import { formatFileSize, formatDate, isFolder } from '@/utils/format';

interface FileRowProps {
  item: DriveItem;
  onClick: () => void;
  selected: boolean;
  onSelect: (selected: boolean) => void;
}

export default function FileRow({ item, onClick, selected, onSelect }: FileRowProps) {
  const folder = isFolder(item);

  return (
    <tr
      className="hover:bg-base-200 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td>
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(!selected);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </td>
      <td>
        {folder ? (
          <Folder className="w-5 h-5 text-primary" />
        ) : (
          <File className="w-5 h-5 text-base-content/50" />
        )}
      </td>
      <td className="font-medium">{item.name}</td>
      <td className="text-base-content/60">
        {folder ? '文件夹' : item.file?.mimeType ?? '-'}
      </td>
      <td className="text-base-content/60">
        {item.lastModifiedDateTime ? formatDate(item.lastModifiedDateTime) : '-'}
      </td>
      <td className="text-base-content/60">
        {item.size !== undefined ? formatFileSize(item.size) : '-'}
      </td>
    </tr>
  );
}
```

- [ ] **Step 3: 创建 src/components/folder/FileTable.tsx**

```typescript
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useFileStore } from '@/stores/fileStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { listFolderChildren } from '@/services/graphService';
import type { DriveItem } from '@/types';
import FileRow from './FileRow';

interface FileTableProps {
  folderId: string;
  onFolderClick: (folder: DriveItem) => void;
}

export default function FileTable({ folderId, onFolderClick }: FileTableProps) {
  const graphClient = useAuthStore((s) => s.graphClient);
  const files = useFileStore((s) => s.files);
  const setFiles = useFileStore((s) => s.setFiles);
  const isLoading = useFileStore((s) => s.isLoading);
  const setLoading = useFileStore((s) => s.setLoading);
  const addToast = useUIStore((s) => s.addToast);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchFiles = async () => {
    if (!graphClient) return;
    setLoading(true);
    try {
      const items = await listFolderChildren(graphClient, folderId);
      setFiles(items);
    } catch (error) {
      addToast({ type: 'error', message: '获取文件列表失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [folderId, graphClient]);

  const handleSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleRowClick = (item: DriveItem) => {
    if (item.folder) {
      onFolderClick(item);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}></th>
            <th style={{ width: '40px' }}></th>
            <th>文件名</th>
            <th>类型</th>
            <th>修改时间</th>
            <th>大小</th>
          </tr>
        </thead>
        <tbody>
          {files.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-base-content/50">
                此文件夹为空
              </td>
            </tr>
          ) : (
            files.map((item) => (
              <FileRow
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onSelect={(s) => handleSelect(item.id, s)}
                onClick={() => handleRowClick(item)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: 创建 src/components/folder/FolderDetailPage.tsx**

```typescript
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFileStore } from '@/stores/fileStore';
import { useAuthStore } from '@/stores/authStore';
import { getDriveItem } from '@/services/graphService';
import Breadcrumb from './Breadcrumb';
import FileTable from './FileTable';
import type { DriveItem } from '@/types';

export default function FolderDetailPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const graphClient = useAuthStore((s) => s.graphClient);
  const currentFolder = useFileStore((s) => s.currentFolder);
  const setCurrentFolder = useFileStore((s) => s.setCurrentFolder);

  useEffect(() => {
    if (!folderId || !graphClient) return;

    const loadFolder = async () => {
      try {
        const folder = await getDriveItem(graphClient, `/me/drive/items/${folderId}`);
        setCurrentFolder(folder);
      } catch (error) {
        console.error('Failed to load folder:', error);
      }
    };

    loadFolder();

    return () => {
      setCurrentFolder(null);
    };
  }, [folderId, graphClient]);

  const handleFolderClick = (folder: DriveItem) => {
    navigate(`/folder/${folder.id}`);
  };

  const breadcrumbItems = currentFolder
    ? [{ name: currentFolder.name }]
    : [];

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      {/* 面包屑 */}
      <Breadcrumb items={breadcrumbItems} />

      {/* 文件列表 */}
      {folderId && <FileTable folderId={folderId} onFolderClick={handleFolderClick} />}
    </div>
  );
}
```

### Phase 2 验收标准

- [ ] 登录后显示主页，显示 /upload 下的子文件夹网格
- [ ] 点击文件夹卡片能进入文件夹详情页
- [ ] 文件夹详情页显示面包屑导航
- [ ] 文件夹详情页显示文件列表（表格形式）
- [ ] 能在文件夹之间导航

---

## Phase 3：文件上传

### 目标
完成拖拽上传功能，支持多文件上传，显示上传进度。

### Task 10: 创建上传组件

**Files:**
- Create: `src/components/folder/DropZoneOverlay.tsx`
- Create: `src/components/folder/BatchToolbar.tsx`
- Modify: `src/components/folder/FolderDetailPage.tsx`（集成 DropZone）

**Steps:**

- [ ] **Step 1: 创建 src/components/folder/DropZoneOverlay.tsx**

```typescript
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface DropZoneOverlayProps {
  folderName: string;
  onFilesDropped: (files: File[]) => void;
  onClose: () => void;
}

export default function DropZoneOverlay({ folderName, onFilesDropped, onClose }: DropZoneOverlayProps) {
  const addToast = useUIStore((s) => s.addToast);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesDropped(acceptedFiles);
        onClose();
      }
    },
    [onFilesDropped, onClose]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  return (
    <div
      {...getRootProps()}
      className="fixed inset-0 z-50 bg-blue-500/10 border-4 border-dashed border-blue-500 flex items-center justify-center"
    >
      <input {...getInputProps()} />

      <div className="bg-base-100 rounded-2xl shadow-2xl p-8 text-center max-w-md mx-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          {isDragActive ? (
            <Upload className="w-8 h-8 text-primary animate-bounce" />
          ) : (
            <Upload className="w-8 h-8 text-primary" />
          )}
        </div>

        <h3 className="text-xl font-semibold mb-2">
          {isDragActive ? '释放以上传' : '拖拽文件到这里'}
        </h3>
        <p className="text-base-content/60 mb-4">
          上传到 <span className="font-medium text-base-content">{folderName}</span>
        </p>

        <button
          className="btn btn-ghost btn-sm gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="w-4 h-4" />
          取消
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 src/components/folder/BatchToolbar.tsx**

```typescript
import { Download, Trash2, X } from 'lucide-react';

interface BatchToolbarProps {
  selectedCount: number;
  onDownload: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export default function BatchToolbar({
  selectedCount,
  onDownload,
  onDelete,
  onClear,
}: BatchToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary text-primary-content rounded-lg p-3 flex items-center gap-4">
      <span className="font-medium">
        已选择 <span className="badge badge-outline badge-sm ml-1">{selectedCount}</span> 项
      </span>

      <div className="flex-1" />

      <button className="btn btn-ghost btn-sm gap-1 text-primary-content hover:bg-primary-focus" onClick={onDownload}>
        <Download className="w-4 h-4" />
        批量下载
      </button>

      <button className="btn btn-ghost btn-sm gap-1 text-primary-content hover:bg-primary-focus" onClick={onDelete}>
        <Trash2 className="w-4 h-4" />
        批量删除
      </button>

      <button className="btn btn-ghost btn-sm btn-square" onClick={onClear}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: 修改 FolderDetailPage.tsx 集成 DropZone 和上传逻辑**

（更新后的完整代码）

```typescript
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFileStore } from '@/stores/fileStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { getDriveItem, deleteItem } from '@/services/graphService';
import { uploadFile } from '@/services/uploadService';
import Breadcrumb from './Breadcrumb';
import FileTable from './FileTable';
import DropZoneOverlay from './DropZoneOverlay';
import BatchToolbar from './BatchToolbar';
import type { DriveItem } from '@/types';

export default function FolderDetailPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const graphClient = useAuthStore((s) => s.graphClient);
  const currentFolder = useFileStore((s) => s.currentFolder);
  const setCurrentFolder = useFileStore((s) => s.setCurrentFolder);
  const files = useFileStore((s) => s.files);
  const addFile = useFileStore((s) => s.addFile);
  const removeFile = useFileStore((s) => s.removeFile);
  const addToast = useUIStore((s) => s.addToast);
  const updateToast = useUIStore((s) => s.updateToast);

  const [showDropZone, setShowDropZone] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 监控拖拽事件
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.types.includes('Files')) {
        setShowDropZone(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.relatedTarget === null) {
        setShowDropZone(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowDropZone(false);
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  useEffect(() => {
    if (!folderId || !graphClient) return;

    const loadFolder = async () => {
      try {
        const folder = await getDriveItem(graphClient, `/me/drive/items/${folderId}`);
        setCurrentFolder(folder);
      } catch (error) {
        console.error('Failed to load folder:', error);
      }
    };

    loadFolder();

    return () => {
      setCurrentFolder(null);
    };
  }, [folderId, graphClient]);

  const handleFolderClick = (folder: DriveItem) => {
    navigate(`/folder/${folder.id}`);
  };

  const handleFilesDropped = useCallback(
    async (droppedFiles: File[]) => {
      if (!graphClient || !folderId) return;

      for (const file of droppedFiles) {
        const toastId = addToast({
          type: 'uploading',
          message: `上传中: ${file.name}`,
          progress: 0,
          totalBytes: file.size,
          uploadedBytes: 0,
        });

        try {
          await uploadFile(graphClient, folderId, file, (progress) => {
            updateToast(toastId, {
              progress: progress.percentage,
              uploadedBytes: progress.uploadedBytes,
              message: `${file.name} - ${progress.percentage}%`,
            });
          });
          addToast({ type: 'success', message: `${file.name} 上传成功` });
          // 刷新文件列表
          removeFile(file.name); // 触发重新获取
        } catch (error) {
          updateToast(toastId, { type: 'error', message: `${file.name} 上传失败` });
        }
      }
    },
    [graphClient, folderId, addToast, updateToast, removeFile]
  );

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    if (!graphClient) return;
    if (!window.confirm(`确定删除 ${selectedIds.size} 个文件吗？`)) return;

    for (const id of selectedIds) {
      try {
        await deleteItem(graphClient, id);
        removeFile(id);
        addToast({ type: 'success', message: '删除成功' });
      } catch (error) {
        addToast({ type: 'error', message: '删除失败' });
      }
    }
    setSelectedIds(new Set());
  };

  const breadcrumbItems = currentFolder
    ? [{ name: currentFolder.name }]
    : [];

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      {/* 面包屑 */}
      <Breadcrumb items={breadcrumbItems} />

      {/* 批量操作栏 */}
      <BatchToolbar
        selectedCount={selectedIds.size}
        onDownload={() => {}}
        onDelete={handleBatchDelete}
        onClear={handleClearSelection}
      />

      {/* 文件列表 */}
      {folderId && (
        <FileTable
          folderId={folderId}
          onFolderClick={handleFolderClick}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}

      {/* 拖拽上传遮罩 */}
      {showDropZone && folderId && (
        <DropZoneOverlay
          folderName={currentFolder?.name ?? '当前文件夹'}
          onFilesDropped={handleFilesDropped}
          onClose={() => setShowDropZone(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: 更新 FileTable.tsx 支持 selectedIds**

```typescript
// 在 FileTableProps 中添加 selectedIds 和 onSelectionChange
interface FileTableProps {
  folderId: string;
  onFolderClick: (folder: DriveItem) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}
```

### Phase 3 验收标准

- [ ] 在文件夹详情页拖入文件能触发上传
- [ ] 上传过程中显示进度 Toast
- [ ] 上传完成后显示成功/失败提示
- [ ] 支持多文件同时上传

---

## Phase 4：Quick Note + PWA

### 目标
完成 Quick Note 编辑器和 PWA 配置。

### Task 11: 完善 QuickNote 组件

**Files:**
- Create: `src/hooks/useNote.ts`
- Modify: `src/components/home/QuickNote.tsx`

**Steps:**

- [ ] **Step 1: 创建 src/hooks/useNote.ts**

```typescript
import { useCallback, useEffect, useRef } from 'react';
import { useNoteStore } from '@/stores/noteStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { getDriveItem, updateFileContent } from '@/services/graphService';
import { NOTE_CONFIG } from '@/utils/constants';

export function useNote() {
  const graphClient = useAuthStore((s) => s.graphClient);
  const content = useNoteStore((s) => s.content);
  const isDirty = useNoteStore((s) => s.isDirty);
  const isSaving = useNoteStore((s) => s.isSaving);
  const lastSaved = useNoteStore((s) => s.lastSaved);
  const error = useNoteStore((s) => s.error);
  const loadNote = useNoteStore((s) => s.loadNote);
  const setContent = useNoteStore((s) => s.setContent);
  const setSaving = useNoteStore((s) => s.setSaving);
  const markSaved = useNoteStore((s) => s.markSaved);
  const setError = useNoteStore((s) => s.setError);

  const saveTimeoutRef = useRef<number | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  // 加载笔记
  const fetchNote = useCallback(async () => {
    if (!graphClient) return;

    try {
      const notePath = NOTE_CONFIG.noteFilePath;
      const item = await getDriveItem(graphClient, notePath);
      // 下载内容
      const response = await fetch(item['@microsoft.graph.downloadUrl']);
      const text = await response.text();
      loadNote(text);
    } catch (error) {
      // 文件不存在，先创建一个空文件
      loadNote('# 快速笔记\n\n从这里开始书写...');
    }
  }, [graphClient, loadNote]);

  // 保存笔记
  const saveNote = useCallback(async () => {
    if (!graphClient || !isDirty) return;

    setSaving(true);
    try {
      const notePath = NOTE_CONFIG.noteFilePath;
      let item;
      try {
        item = await getDriveItem(graphClient, notePath);
      } catch {
        // 文件不存在，需要先创建
        addToast({ type: 'info', message: '正在创建笔记文件...' });
      }

      if (item) {
        // 更新现有文件
        const blob = new Blob([content], { type: 'text/markdown' });
        await updateFileContent(graphClient, item.id, blob);
      }
      markSaved();
      addToast({ type: 'success', message: '笔记已保存' });
    } catch (error) {
      setError(String(error));
      addToast({ type: 'error', message: '保存失败' });
    }
  }, [graphClient, content, isDirty, setSaving, markSaved, setError, addToast]);

  // 自动保存（debounce）
  useEffect(() => {
    if (isDirty) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = window.setTimeout(() => {
        saveNote();
      }, NOTE_CONFIG.autoSaveDelay);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, saveNote]);

  return {
    content,
    setContent,
    isDirty,
    isSaving,
    lastSaved,
    error,
    fetchNote,
    saveNote,
  };
}
```

- [ ] **Step 2: 完善 QuickNote.tsx**

```typescript
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Save } from 'lucide-react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNote } from '@/hooks/useNote';
import { useUIStore } from '@/stores/uiStore';

export default function QuickNote() {
  const [isOpen, setIsOpen] = useState(false);
  const { content, setContent, isDirty, isSaving, lastSaved, fetchNote, saveNote } = useNote();
  const darkMode = useUIStore((s) => s.darkMode);

  useEffect(() => {
    if (isOpen) {
      fetchNote();
    }
  }, [isOpen, fetchNote]);

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    return lastSaved.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="card bg-base-100">
      <button
        className="card-body p-4 flex flex-row items-center gap-2 hover:bg-base-200 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-primary" />
        ) : (
          <ChevronRight className="w-5 h-5 text-primary" />
        )}
        <FileText className="w-5 h-5 text-primary" />
        <span className="font-semibold">快速笔记</span>
        {isDirty && <span className="badge badge-warning badge-xs">未保存</span>}
        {lastSaved && !isDirty && (
          <span className="text-xs text-base-content/50 ml-auto">
            已保存 {formatLastSaved()}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {/* 编辑器/预览分栏 */}
          <div className="grid grid-cols-2 gap-2 h-[400px]">
            {/* Monaco Editor */}
            <div className="border border-base-300 rounded-lg overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="markdown"
                value={content}
                onChange={(value) => setContent(value ?? '')}
                theme={darkMode ? 'vs-dark' : 'vs'}
                options={{
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  lineNumbers: 'off',
                  folding: false,
                  fontSize: 14,
                }}
              />
            </div>

            {/* Markdown 预览 */}
            <div className="border border-base-300 rounded-lg p-4 overflow-auto prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </div>

          {/* 保存栏 */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-base-content/50">
              {isSaving ? '保存中...' : isDirty ? '有未保存的更改' : '所有更改已保存'}
            </span>
            <button
              className="btn btn-primary btn-sm gap-1"
              onClick={saveNote}
              disabled={!isDirty || isSaving}
            >
              <Save className="w-4 h-4" />
              保存到 OneDrive
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Task 12: PWA 配置完善

**Files:**
- Create: `public/icons/icon-192.png`（真实图标）
- Create: `public/icons/icon-512.png`（真实图标）
- Update: `vite.config.ts`（如有需要）

**Steps:**

- [ ] **Step 1: 确保 PWA 图标文件存在**
  - 如果没有现成的图标，使用占位符或让用户后续替换

### Phase 4 验收标准

- [ ] Quick Note 能编辑 Markdown 并实时预览
- [ ] 笔记内容能保存到 OneDrive `/upload/note.md`
- [ ] PWA 可以安装到桌面/手机
- [ ] 离线时 UI 可用

---

## 里程碑概览

| 里程碑 | Task | Phase | 核心产出 |
|---|---|---|---|
| 1. 脚手架 | 1 | Phase 1 | Vite 项目、配置、Tailwind + DaisyUI |
| 2. 类型与工具 | 2-3 | Phase 1 | types/index.ts, utils/ |
| 3. 状态管理 | 4 | Phase 1 | 4个 Zustand Store |
| 4. 服务层 | 5 | Phase 1 | authService, graphService, uploadService |
| 5. 认证页 | 6 | Phase 1 | LoginPage, AuthCallback |
| 6. 布局组件 | 7 | Phase 1 | TopBar, ToastContainer, Layout |
| 7. 主页组件 | 8 | Phase 2 | FolderCard, FolderGrid, HomePage |
| 8. 文件夹页 | 9 | Phase 2 | Breadcrumb, FileTable, FolderDetailPage |
| 9. 上传组件 | 10 | Phase 3 | DropZone, BatchToolbar, 上传逻辑 |
| 10. QuickNote | 11 | Phase 4 | Monaco + 预览 + useNote hook |
| 11. PWA 收尾 | 12 | Phase 4 | 图标、manifest |

**总任务数：12 个 Task**

---

## 附录：已知限制

1. **Azure AD 应用配置**：需要用户在 Azure Portal 创建 PWA 应用并配置 redirect URI 和权限
2. **图标**：Phase 4 需要替换占位图标为真实图标
3. **客户端 ID**：当前 constants.ts 中的 clientId 是占位符，需要替换为真实应用 ID

---

*本文档由 Superpowers writing-plans 工作流生成，基于 Design Document v1.0*

---

## 文件结构映射

| 文件夹 | 职责 | 核心文件 |
|---|---|---|
| `src/stores/` | Zustand 全局状态 | authStore, fileStore, uiStore, noteStore |
| `src/services/` | Graph API 封装 | authService, graphService, uploadService |
| `src/components/layout/` | 布局组件 | TopBar, ToastContainer, Layout |
| `src/components/auth/` | 认证组件 | LoginPage, AuthCallback |
| `src/components/home/` | 主页组件 | HomePage, FolderGrid, FolderCard, QuickNote |
| `src/components/folder/` | 文件夹组件 | FolderDetailPage, Breadcrumb, FileTable, FileRow, FileActions, BatchToolbar, DropZoneOverlay |
| `src/hooks/` | 业务 Hooks | useAuth, useFiles, useNote, useDropzone, useUpload, useToast |
| `src/utils/` | 工具函数 | format, folderColor, constants |
| `src/types/` | TypeScript 类型 | index.ts |
| `public/` | 静态资源 | manifest.json, icons/ |

---

## 里程碑 1：项目脚手架（环境初始化）

### Task 1: 初始化 Vite + React + TypeScript 项目

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/index.css`

**Steps:**

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "onedrive-upload-manager",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@azure/msal-browser": "^3.11.0",
    "@microsoft/microsoft-graph-client": "^3.0.7",
    "@monaco-editor/react": "^4.6.0",
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-dropzone": "^14.2.3",
    "react-markdown": "^9.0.1",
    "react-router-dom": "^6.22.0",
    "remark-gfm": "^4.0.0",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "daisyui": "^4.7.2",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.1.4",
    "vite-plugin-pwa": "^0.19.2"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Onedrive Upload Manager',
        short_name: 'OneDrive Upload',
        description: '管理你的 OneDrive 文件',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/graph\.microsoft\.com\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173
  }
});
```

- [ ] **Step 3: 创建 tsconfig.json（strict mode）**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: 创建 tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {}
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          primary: '#3b82f6',
          secondary: '#6366f1',
          accent: '#f59e0b',
          neutral: '#1f2937',
          'base-100': '#ffffff',
          'base-200': '#f3f4f6',
          'base-300': '#e5e7eb',
          info: '#0ea5e9',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444'
        },
        dark: {
          primary: '#60a5fa',
          secondary: '#818cf8',
          accent: '#fbbf24',
          neutral: '#1f2937',
          'base-100': '#111827',
          'base-200': '#1f2937',
          'base-300': '#374151',
          info: '#38bdf8',
          success: '#4ade80',
          warning: '#fbbf24',
          error: '#f87171'
        }
      }
    ]
  }
};
```

- [ ] **Step 6: 创建 postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

- [ ] **Step 7: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/icons/icon-192.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#3b82f6" />
    <title>Onedrive Upload Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: 创建 src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

body {
  @apply antialiased;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  @apply bg-base-200;
}

::-webkit-scrollbar-thumb {
  @apply bg-base-300 rounded-full;
}

/* Monaco editor container */
.monaco-editor-container {
  height: 100%;
  width: 100%;
}

/* Dropzone overlay */
.dropzone-active {
  @apply fixed inset-0 z-50 bg-blue-500/10 border-4 border-dashed border-blue-500 flex items-center justify-center;
}
```

- [ ] **Step 9: 创建 src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
```

- [ ] **Step 10: 创建 src/main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 11: 创建 src/App.tsx（路由框架）**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './services/authService';
import LoginPage from './components/auth/LoginPage';
import AuthCallback from './components/auth/AuthCallback';
import Layout from './components/layout/Layout';
import HomePage from './components/home/HomePage';
import FolderDetailPage from './components/folder/FolderDetailPage';
import ToastContainer from './components/layout/ToastContainer';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';

const msalInstance = new PublicClientApplication(msalConfig);

export default function App() {
  const initializeMsal = useAuthStore((s) => s.initializeMsal);

  useEffect(() => {
    initializeMsal(msalInstance);
  }, []);

  return (
    <MsalProvider instance={msalInstance}>
      <BrowserRouter>
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
      </BrowserRouter>
    </MsalProvider>
  );
}
```

- [ ] **Step 12: 安装依赖**

Run: `cd "c:/Claude code Project/Onedrive-sys" && npm install`
Expected: 所有依赖安装完成，无报错

- [ ] **Step 13: 创建 public/icons 占位符目录和占位图标文件**

Create: `public/icons/icon-192.png` (1x1 transparent PNG placeholder)
Create: `public/icons/icon-512.png` (1x1 transparent PNG placeholder)
Create: `public/manifest.json`

- [ ] **Step 14: 验证项目启动**

Run: `npm run dev`
Expected: 浏览器打开 http://localhost:5173，无编译错误

---

## 里程碑 2：类型定义与工具函数

### Task 2: 创建全局类型定义

**Files:**
- Create: `src/types/index.ts`

**Steps:**

- [ ] **Step 1: 创建 src/types/index.ts**

```typescript
// Microsoft Graph API 类型扩展
declare module '@microsoft/microsoft-graph-client' {
  export interface Client {
    api(path: string): Request;
  }
}

// DriveItem 类型（OneDrive 文件/文件夹）
export interface DriveItem {
  id: string;
  name: string;
  size?: number;
  lastModifiedDateTime?: string;
  createdDateTime?: string;
  mimeType?: string;
  file?: {
    mimeType: string;
    hashes?: {
      quickXorHash?: string;
    };
  };
  folder?: {
    childCount: number;
  };
  webUrl?: string;
  parentReference?: {
    driveId: string;
    id: string;
    path: string;
  };
  fileSystemInfo?: {
    createdDateTime?: string;
    lastModifiedDateTime?: string;
  };
}

// 用户信息
export interface UserProfile {
  id: string;
  displayName: string;
  mail?: string;
  userPrincipalName: string;
  photoUrl?: string;
}

// Toast 类型
export type ToastType = 'success' | 'error' | 'info' | 'uploading';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  progress?: number;       // 0-100，用于上传进度
  totalBytes?: number;    // 总字节数
  uploadedBytes?: number; // 已上传字节数
  autoClose?: boolean;    // 是否自动消失
}

// 文件夹颜色映射
export type FolderColorKey = 'blue' | 'green' | 'purple' | 'orange' | 'gray';

export interface FolderColorMap {
  key: FolderColorKey;
  textColor: string;
  bgColor: string;
  borderColor: string;
  iconBgColor: string;
}

// 上传进度回调
export interface UploadProgress {
  fileName: string;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  speed?: number; // bytes/s
}

// 排序配置
export interface SortConfig {
  column: keyof DriveItem;
  direction: 'asc' | 'desc';
}
```

---

### Task 3: 创建工具函数

**Files:**
- Create: `src/utils/constants.ts`
- Create: `src/utils/format.ts`
- Create: `src/utils/folderColor.ts`

**Steps:**

- [ ] **Step 1: 创建 src/utils/constants.ts**

```typescript
// MSAL 配置常量
export const MSAL_CONFIG = {
  clientId: 'ae6ceb41-6cf4-4bcf-89a2-7ca49b8fb417',
  authority: 'https://login.microsoftonline.com/consumers',
  redirectUri: 'http://localhost:5173',
  postLogoutRedirectUri: 'http://localhost:5173/login',
  scopes: ['User.Read', 'Files.ReadWrite.All', 'offline_access'] as const,
};

// Graph API 配置
export const GRAPH_CONFIG = {
  baseUrl: 'https://graph.microsoft.com/v1.0',
};

// 上传配置
export const UPLOAD_CONFIG = {
  // 小文件阈值：4MB
  smallFileThreshold: 4 * 1024 * 1024,
  // 分片大小：5 MiB（必须是 320 KiB 的倍数）
  chunkSize: 5 * 1024 * 1024,
  // 320 KiB = 327,680 bytes（Graph API 分片最小倍数）
  minChunkMultiple: 327680,
  // 最大重试次数
  maxRetries: 3,
  // 初始重试延迟（ms）
  initialRetryDelay: 1000,
  // 指数退避基数
  retryBackoffBase: 2,
};

// Note 自动保存 debounce
export const NOTE_CONFIG = {
  autoSaveDelay: 800, // ms
  noteFilePath: '/upload/note.md',
};

// Toast 自动消失时间
export const TOAST_CONFIG = {
  successDuration: 5000,
  infoDuration: 5000,
  errorDuration: 0, // 不自动消失
};
```

- [ ] **Step 2: 创建 src/utils/format.ts**

```typescript
/**
 * 格式化文件大小为人类可读字符串
 * @param bytes 字节数
 * @returns 格式化后的字符串，如 "1.2 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * 格式化日期为本地可读字符串
 * @param dateString ISO 日期字符串
 * @returns 格式化后的日期，如 "2026-03-29"
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化日期+时间为本地可读字符串
 * @param dateString ISO 日期字符串
 * @returns 格式化后的日期时间，如 "2026-03-29 14:30"
 */
export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化相对时间（如"3天前"）
 * @param dateString ISO 日期字符串
 * @returns 相对时间字符串
 */
export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) return formatDate(dateString);
  if (diffDay > 0) return `${diffDay}天前`;
  if (diffHour > 0) return `${diffHour}小时前`;
  if (diffMin > 0) return `${diffMin}分钟前`;
  return '刚刚';
}

/**
 * 根据文件名获取文件类型图标
 * @param fileName 文件名
 * @returns 图标名称（lucide-react）
 */
export function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const iconMap: Record<string, string> = {
    pdf: 'FileText',
    doc: 'FileText',
    docx: 'FileText',
    xls: 'FileSpreadsheet',
    xlsx: 'FileSpreadsheet',
    ppt: 'FilePresentation',
    pptx: 'FilePresentation',
    txt: 'FileText',
    md: 'FileCode',
    jpg: 'Image',
    jpeg: 'Image',
    png: 'Image',
    gif: 'Image',
    svg: 'Image',
    webp: 'Image',
    mp4: 'Video',
    mov: 'Video',
    avi: 'Video',
    mp3: 'Music',
    wav: 'Music',
    zip: 'Archive',
    rar: 'Archive',
    '7z': 'Archive',
    js: 'FileCode',
    ts: 'FileCode',
    tsx: 'FileCode',
    jsx: 'FileCode',
    py: 'FileCode',
    java: 'FileCode',
    css: 'FileCode',
    html: 'FileCode',
    json: 'FileCode',
  };
  return iconMap[ext] ?? 'File';
}

/**
 * 根据文件名判断是否为文件夹
 */
export function isFolder(item: { folder?: unknown }): boolean {
  return !!item.folder;
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
```

- [ ] **Step 3: 创建 src/utils/folderColor.ts**

```typescript
import type { DriveItem, FolderColorKey, FolderColorMap } from '@/types';

export const FOLDER_COLORS: Record<FolderColorKey, FolderColorMap> = {
  blue: {
    key: 'blue',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconBgColor: 'bg-blue-500',
  },
  green: {
    key: 'green',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconBgColor: 'bg-green-500',
  },
  purple: {
    key: 'purple',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    iconBgColor: 'bg-purple-500',
  },
  orange: {
    key: 'orange',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconBgColor: 'bg-orange-500',
  },
  gray: {
    key: 'gray',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    iconBgColor: 'bg-gray-500',
  },
};

/**
 * 固定文件夹名称关键词到颜色的映射
 */
const FOLDER_KEYWORD_MAP: Record<string, FolderColorKey> = {
  文件存储: 'blue',
  资料备份: 'green',
  共享资源: 'purple',
  临时归类: 'orange',
};

/**
 * 根据文件夹名称返回颜色配置
 */
export function getFolderColor(folderName: string): FolderColorMap {
  for (const [keyword, colorKey] of Object.entries(FOLDER_KEYWORD_MAP)) {
    if (folderName.includes(keyword)) {
      return FOLDER_COLORS[colorKey];
    }
  }
  return FOLDER_COLORS.gray;
}

/**
 * 根据 DriveItem 返回颜色配置
 */
export function getColorForFolder(item: DriveItem): FolderColorMap {
  return getFolderColor(item.name);
}
```

---

## 里程碑 3：Zustand 状态管理

### Task 4: 创建 Zustand Stores

**Files:**
- Create: `src/stores/authStore.ts`
- Create: `src/stores/fileStore.ts`
- Create: `src/stores/uiStore.ts`
- Create: `src/stores/noteStore.ts`

**Steps:**

- [ ] **Step 1: 创建 src/stores/authStore.ts**

```typescript
import { create } from 'zustand';
import { AccountInfo, PublicClientApplication } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { MSAL_CONFIG } from '@/utils/constants';

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
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        const account = accounts[0];
        set({ account, msalInstance: instance, isInitialized: true, isLoading: false });
        // 尝试静默获取 token
        try {
          const response = await instance.acquireTokenSilent({
            scopes: [...MSAL_CONFIG.scopes],
            account,
          });
          const graphClient = Client.init({
            authProvider: (done) => {
              done(null, response.accessToken);
            },
          });
          set({ accessToken: response.accessToken, graphClient, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      } else {
        set({ msalInstance: instance, isInitialized: true, isLoading: false });
      }
    } catch (error) {
      console.error('MSAL initialization failed:', error);
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
      const response = await msalInstance.loginPopup({
        scopes: [...MSAL_CONFIG.scopes],
      });
      const graphClient = Client.init({
        authProvider: (done) => {
          done(null, response.accessToken);
        },
      });
      set({
        account: response.account,
        accessToken: response.accessToken,
        graphClient,
        isLoading: false,
      });
    } catch (error) {
      console.error('Login failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    const { msalInstance } = get();
    if (!msalInstance) return;
    try {
      await msalInstance.logoutPopup();
      get().clearAuth();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },

  acquireToken: async () => {
    const { msalInstance, account } = get();
    if (!msalInstance || !account) throw new Error('Not authenticated');

    try {
      const response = await msalInstance.acquireTokenSilent({
        scopes: [...MSAL_CONFIG.scopes],
        account,
      });
      const graphClient = Client.init({
        authProvider: (done) => {
          done(null, response.accessToken);
        },
      });
      set({ accessToken: response.accessToken, graphClient });
      return response.accessToken;
    } catch (error) {
      // 静默获取失败，尝试交互式
      try {
        const response = await msalInstance.acquireTokenPopup({
          scopes: [...MSAL_CONFIG.scopes],
        });
        const graphClient = Client.init({
          authProvider: (done) => {
            done(null, response.accessToken);
          },
        });
        set({ accessToken: response.accessToken, graphClient });
        return response.accessToken;
      } catch {
        // token 获取失败，跳转登录
        get().logout();
        throw new Error('Token acquisition failed');
      }
    }
  },
}));
```

- [ ] **Step 2: 创建 src/stores/uiStore.ts**

```typescript
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
        const duration =
          toast.type === 'uploading' ? 0 : toast.type === 'error' ? TOAST_CONFIG.errorDuration : TOAST_CONFIG[toast.type as ToastType] ?? TOAST_CONFIG.infoDuration;

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
```

- [ ] **Step 3: 创建 src/stores/fileStore.ts**

```typescript
import { create } from 'zustand';
import type { DriveItem } from '@/types';

interface FileState {
  currentFolder: DriveItem | null;
  files: DriveItem[];
  folderList: DriveItem[];
  isLoading: boolean;
  error: string | null;
  setCurrentFolder: (folder: DriveItem | null) => void;
  setFiles: (files: DriveItem[]) => void;
  setFolderList: (folders: DriveItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addFile: (file: DriveItem) => void;
  removeFile: (fileId: string) => void;
  updateFile: (fileId: string, updates: Partial<DriveItem>) => void;
  clearFiles: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  currentFolder: null,
  files: [],
  folderList: [],
  isLoading: false,
  error: null,

  setCurrentFolder: (folder) => set({ currentFolder: folder }),
  setFiles: (files) => set({ files }),
  setFolderList: (folders) => set({ folderList: folders }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  addFile: (file) =>
    set((state) => ({
      files: state.files.some((f) => f.id === file.id)
        ? state.files.map((f) => (f.id === file.id ? file : f))
        : [file, ...state.files],
    })),

  removeFile: (fileId) =>
    set((state) => ({ files: state.files.filter((f) => f.id !== fileId) })),

  updateFile: (fileId, updates) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === fileId ? { ...f, ...updates } : f)),
    })),

  clearFiles: () => set({ files: [], currentFolder: null }),
}));
```

- [ ] **Step 4: 创建 src/stores/noteStore.ts**

```typescript
import { create } from 'zustand';
import { NOTE_CONFIG } from '@/utils/constants';

interface NoteState {
  content: string;
  originalContent: string;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  loadNote: (content: string) => void;
  setContent: (content: string) => void;
  setSaving: (saving: boolean) => void;
  markSaved: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  content: '',
  originalContent: '',
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  error: null,

  loadNote: (content) => {
    set({
      content,
      originalContent: content,
      isDirty: false,
      isSaving: false,
      lastSaved: new Date(),
      error: null,
    });
  },

  setContent: (content) => {
    const { originalContent } = get();
    set({
      content,
      isDirty: content !== originalContent,
    });
  },

  setSaving: (saving) => set({ isSaving: saving }),

  markSaved: () => {
    const { content } = get();
    set({
      originalContent: content,
      isDirty: false,
      isSaving: false,
      lastSaved: new Date(),
      error: null,
    });
  },

  setError: (error) => set({ error, isSaving: false }),

  reset: () =>
    set({
      content: '',
      originalContent: '',
      isDirty: false,
      isSaving: false,
      lastSaved: null,
      error: null,
    }),
}));

// 导出 debounce 延迟常量供外部使用
export { NOTE_CONFIG };
```

---

## 里程碑 4：服务层

### Task 5: 创建 authService 和 MSAL 配置

**Files:**
- Create: `src/services/authService.ts`
- Modify: `src/utils/constants.ts`（引用 MSAL_CONFIG）

**Steps:**

- [ ] **Step 1: 创建 src/services/authService.ts**

```typescript
import { Configuration, PublicClientApplication } from '@azure/msal-browser';
import { MSAL_CONFIG } from '@/utils/constants';

export const msalConfig: Configuration = {
  auth: {
    clientId: MSAL_CONFIG.clientId,
    authority: MSAL_CONFIG.authority,
    redirectUri: MSAL_CONFIG.redirectUri,
    postLogoutRedirectUri: MSAL_CONFIG.postLogoutRedirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        console.log(`[MSAL ${level}]`, message);
      },
    },
  },
};

export { MSAL_CONFIG };
```

---

### Task 6: 创建 graphService（Graph API 封装）

**Files:**
- Create: `src/services/graphService.ts`

**Steps:**

- [ ] **Step 1: 创建 src/services/graphService.ts**

```typescript
import { Client } from '@microsoft/microsoft-graph-client';
import type { DriveItem } from '@/types';

/**
 * 创建 Graph Client（带 authProvider）
 */
export function createGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

/**
 * 获取当前用户信息
 */
export async function getUserProfile(client: Client): Promise<DriveItem['id'] & { displayName: string; mail?: string; userPrincipalName: string; id: string }> {
  return client.api('/me').get();
}

/**
 * 获取 /upload 目录下的子文件夹列表
 */
export async function listUploadFolders(client: Client): Promise<DriveItem[]> {
  const response = await client.api('/me/drive/root:/upload:/children').filter('folder ne null').get();
  return response.value ?? [];
}

/**
 * 获取指定文件夹内的所有项目（文件+子文件夹）
 */
export async function listFolderChildren(client: Client, folderId: string): Promise<DriveItem[]> {
  const response = await client.api(`/me/drive/items/${folderId}/children`).get();
  return response.value ?? [];
}

/**
 * 获取指定路径的 DriveItem
 */
export async function getDriveItem(client: Client, path: string): Promise<DriveItem> {
  return client.api(`/me/drive/root:${path}`).get();
}

/**
 * 上传小文件（≤4MB）
 */
export async function uploadSmallFile(
  client: Client,
  parentId: string,
  fileName: string,
  content: Blob | ArrayBuffer,
  conflictBehavior: string = 'rename'
): Promise<DriveItem> {
  return client
    .api(`/me/drive/items/${parentId}:/${fileName}:/content`)
    .put(content, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      queryParameters: {
        '@microsoft.graph.conflictBehavior': conflictBehavior,
      },
    }) as Promise<DriveItem>;
}

/**
 * 更新现有文件的内容（通过 item ID，PUT /content 直接覆盖）
 * 注意：这里不使用 conflictBehavior，因为是直接更新指定 item
 */
export async function updateFileContent(
  client: Client,
  itemId: string,
  content: Blob | ArrayBuffer
): Promise<DriveItem> {
  return client
    .api(`/me/drive/items/${itemId}/content`)
    .put(content, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    }) as Promise<DriveItem>;
}

/**
 * 创建分片上传会话
 */
export async function createUploadSession(
  client: Client,
  parentId: string,
  fileName: string,
  conflictBehavior: string = 'rename'
): Promise<{ uploadUrl: string; expirationDateTime: string }> {
  const response = await client
    .api(`/me/drive/items/${parentId}:/${fileName}:/createUploadSession`)
    .post({
      item: {
        '@microsoft.graph.conflictBehavior': conflictBehavior,
      },
    });
  return {
    uploadUrl: response.uploadUrl,
    expirationDateTime: response.expirationDateTime,
  };
}

/**
 * 分片上传（直接发送到 uploadUrl）
 */
export async function uploadChunk(
  uploadUrl: string,
  content: Blob,
  startByte: number,
  endByte: number,
  totalSize: number
): Promise<Response> {
  const slice = content.slice(startByte, endByte);
  return fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(endByte - startByte),
      'Content-Range': `bytes ${startByte}-${endByte - 1}/${totalSize}`,
    },
    body: slice,
  });
}

/**
 * 删除文件或文件夹
 */
export async function deleteItem(client: Client, itemId: string): Promise<void> {
  await client.api(`/me/drive/items/${itemId}`).delete();
}

/**
 * 重命名文件或文件夹
 */
export async function renameItem(client: Client, itemId: string, newName: string): Promise<DriveItem> {
  return client.api(`/me/drive/items/${itemId}`).patch({ name: newName });
}

/**
 * 获取文件下载 URL
 */
export async function getDownloadUrl(client: Client, itemId: string): Promise<string> {
  const item = await client.api(`/me/drive/items/${itemId}`).select(['@microsoft.graph.downloadUrl']).get();
  return item['@microsoft.graph.downloadUrl'];
}

/**
 * 获取文件缩略图 URL
 */
export async function getThumbnail(client: Client, itemId: string, size: string = 'medium'): Promise<string | null> {
  try {
    const response = await client.api(`/me/drive/items/${itemId}/thumbnails`).get();
    const thumbnails = response.value as Array<{ [key: string]: { url: string } }>;
    if (thumbnails && thumbnails.length > 0) {
      return thumbnails[0][size]?.url ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 获取文件夹的子文件夹数量
 */
export async function getFolderChildCount(client: Client, folderId: string): Promise<number> {
  try {
    const response = await client.api(`/me/drive/items/${folderId}/children`).top(1).select('id').get();
    // @odata.count 在支持的情况下返回总数
    return (response as { '@odata.count'?: number }).['@odata.count'] ?? 0;
  } catch {
    return 0;
  }
}
```

---

### Task 7: 创建 uploadService（上传逻辑封装）

**Files:**
- Create: `src/services/uploadService.ts`

**Steps:**

- [ ] **Step 1: 创建 src/services/uploadService.ts**

```typescript
import { Client } from '@microsoft/microsoft-graph-client';
import { createUploadSession, uploadChunk, uploadSmallFile } from './graphService';
import { UPLOAD_CONFIG } from '@/utils/constants';
import type { UploadProgress } from '@/types';

type ProgressCallback = (progress: UploadProgress) => void;

/**
 * 上传单个文件，自动判断使用小文件直接上传还是分片上传
 */
export async function uploadFile(
  client: Client,
  parentId: string,
  file: File,
  onProgress?: ProgressCallback,
  conflictBehavior: string = 'rename'
): Promise<void> {
  const totalBytes = file.size;

  if (totalBytes <= UPLOAD_CONFIG.smallFileThreshold) {
    // 小文件直接上传
    await uploadSmallFileWithProgress(client, parentId, file, onProgress, conflictBehavior);
  } else {
    // 大文件分片上传
    await uploadLargeFileWithProgress(client, parentId, file, onProgress, conflictBehavior);
  }
}

/**
 * 小文件上传（带进度）
 */
async function uploadSmallFileWithProgress(
  client: Client,
  parentId: string,
  file: File,
  onProgress?: ProgressCallback,
  conflictBehavior: string = 'rename'
): Promise<void> {
  // 小文件不分片，上传完成前不报告中间进度，只报告开始和完成状态
  onProgress?.({
    fileName: file.name,
    uploadedBytes: 0,
    totalBytes: file.size,
    percentage: 0,
  });

  try {
    await uploadSmallFile(client, parentId, file.name, file, conflictBehavior);
    // 上传完成，报告 100%
    onProgress?.({
      fileName: file.name,
      uploadedBytes: file.size,
      totalBytes: file.size,
      percentage: 100,
    });
  } catch (error) {
    throw error;
  }
}

/**
 * 大文件分片上传（带进度和重试）
 */
async function uploadLargeFileWithProgress(
  client: Client,
  parentId: string,
  file: File,
  onProgress?: ProgressCallback,
  conflictBehavior: string = 'rename'
): Promise<void> {
  const totalSize = file.size;
  const chunkSize = UPLOAD_CONFIG.chunkSize;
  let uploadedBytes = 0;

  // 创建上传会话
  const { uploadUrl } = await createUploadSession(client, parentId, file.name, conflictBehavior);

  // 计算分片数
  const totalChunks = Math.ceil(totalSize / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalSize);
    const slice = file.slice(start, end);

    let retries = 0;
    let success = false;

    while (retries < UPLOAD_CONFIG.maxRetries && !success) {
      try {
        const response = await uploadChunk(uploadUrl, file, start, end, totalSize);

        if (response.ok) {
          const data = await response.json();
          // 如果服务器返回 nextExpectedRanges 或完成状态
          if (data.status === 'completed' || !data.nextExpectedRanges) {
            uploadedBytes = totalSize;
            success = true;
          } else {
            // 更新已上传字节
            uploadedBytes = end;
            success = true;
          }
        } else if (response.status === 409) {
          // 冲突
          throw new Error('File conflict: file already exists');
        } else if (response.status === 202) {
          // 接受但未完成，继续
          uploadedBytes = end;
          success = true;
        } else {
          throw new Error(`Upload failed: ${response.status}`);
        }
      } catch (error) {
        retries++;
        if (retries >= UPLOAD_CONFIG.maxRetries) {
          throw new Error(`Upload failed after ${UPLOAD_CONFIG.maxRetries} retries: ${error}`);
        }
        // 指数退避
        const delay = UPLOAD_CONFIG.initialRetryDelay * Math.pow(UPLOAD_CONFIG.retryBackoffBase, retries - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // 上报进度
    const percentage = Math.round((uploadedBytes / totalSize) * 100);
    onProgress?.({
      fileName: file.name,
      uploadedBytes,
      totalBytes: totalSize,
      percentage,
    });
  }
}

/**
 * 批量上传多个文件
 */
export async function uploadFiles(
  client: Client,
  parentId: string,
  files: File[],
  onFileProgress?: (file: File, progress: UploadProgress) => void,
  onOverallProgress?: (completed: number, total: number) => void,
  conflictBehavior: string = 'rename'
): Promise<{ succeeded: string[]; failed: { file: File; error: string }[] }> {
  const succeeded: string[] = [];
  const failed: { file: File; error: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      await uploadFile(
        client,
        parentId,
        file,
        (progress) => {
          onFileProgress?.(file, progress);
          const completed = succeeded.length + failed.length + (progress.percentage < 100 ? 0 : 1);
          onOverallProgress?.(completed, files.length);
        },
        conflictBehavior
      );
      succeeded.push(file.name);
    } catch (error) {
      failed.push({ file, error: String(error) });
    }
  }

  return { succeeded, failed };
}
```

---

## 里程碑 5：认证页面

### Task 8: 创建认证组件

**Files:**
- Create: `src/components/auth/LoginPage.tsx`
- Create: `src/components/auth/AuthCallback.tsx`

**Steps:**

- [ ] **Step 1: 创建 src/components/auth/LoginPage.tsx**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { CloudUpload } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const account = useAuthStore((s) => s.account);
  const addToast = useUIStore((s) => s.addToast);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 如果已登录，跳转主页
  if (account) {
    navigate('/', { replace: true });
    return null;
  }

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
      addToast({ type: 'success', message: '登录成功！' });
      navigate('/', { replace: true });
    } catch (error) {
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
            <CloudUpload className="w-10 h-10 text-primary" />
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
                正在跳转...
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
```

- [ ] **Step 2: 创建 src/components/auth/AuthCallback.tsx**

```typescript
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
```

---

## 里程碑 6：布局与 Toast 组件

### Task 9: 创建布局组件

**Files:**
- Create: `src/components/layout/TopBar.tsx`
- Create: `src/components/layout/ToastContainer.tsx`
- Create: `src/components/layout/Layout.tsx`

**Steps:**

- [ ] **Step 1: 创建 src/components/layout/TopBar.tsx**

```typescript
import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun, CloudUpload, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useEffect, useState } from 'react';

export default function TopBar() {
  const navigate = useNavigate();
  const account = useAuthStore((s) => s.account);
  const logout = useAuthStore((s) => s.logout);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
  const addToast = useUIStore((s) => s.addToast);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      addToast({ type: 'info', message: '已退出登录' });
      navigate('/login', { replace: true });
    } catch {
      addToast({ type: 'error', message: '退出失败' });
      setLoggingOut(false);
    }
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
            <CloudUpload className="w-5 h-5 text-primary" />
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
              disabled={loggingOut}
              title="退出登录"
            >
              {loggingOut ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">登出</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 src/components/layout/ToastContainer.tsx**

```typescript
import { useUIStore } from '@/stores/uiStore';
import { X, CheckCircle, AlertCircle, Info, Upload } from 'lucide-react';
import { formatFileSize } from '@/utils/format';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  uploading: Upload,
};

const colorMap = {
  success: 'alert-success',
  error: 'alert-error',
  info: 'alert-info',
  uploading: 'alert-info',
};

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast toast-end toast-bottom z-[100]">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div key={toast.id} className={`alert ${colorMap[toast.type]} shadow-lg flex-row items-start gap-3 min-w-[300px]`}>
            {/* 图标 */}
            <div className="shrink-0 mt-0.5">
              {toast.type === 'uploading' ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Icon className="w-5 h-5" />
              )}
            </div>

            {/* 内容 */}
            <div className="flex-1">
              <div className="text-sm font-medium">{toast.message}</div>

              {/* 上传进度条 */}
              {toast.type === 'uploading' && toast.progress !== undefined && (
                <div className="mt-2">
                  <progress
                    className="progress progress-info w-full"
                    value={toast.progress}
                    max="100"
                  />
                  <div className="flex justify-between text-xs mt-1 opacity-80">
                    <span>{toast.progress}%</span>
                    {toast.totalBytes && toast.uploadedBytes && (
                      <span>
                        {formatFileSize(toast.uploadedBytes)} / {formatFileSize(toast.totalBytes)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 关闭按钮 */}
            <button
              className="btn btn-ghost btn-xs btn-square shrink-0"
              onClick={() => removeToast(toast.id)}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: 创建 src/components/layout/Layout.tsx**

```typescript
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
```

---

## 里程碑 7：主页组件

### Task 10: 创建主页组件

**Files:**
- Create: `src/components/home/FolderCard.tsx`
- Create: `src/components/home/FolderGrid.tsx`
- Create: `src/components/home/QuickNote.tsx`
- Create: `src/components/home/HomePage.tsx`

**Steps:**

- [ ] **Step 1: 创建 src/components/home/FolderCard.tsx**

```typescript
import { Folder } from 'lucide-react';
import type { DriveItem } from '@/types';
import { getColorForFolder } from '@/utils/folderColor';
import { formatRelativeTime } from '@/utils/format';

interface FolderCardProps {
  folder: DriveItem;
  onClick: () => void;
}

export default function FolderCard({ folder, onClick }: FolderCardProps) {
  const colors = getColorForFolder(folder);
  const childCount = folder.folder?.childCount ?? 0;

  return (
    <div
      onClick={onClick}
      className={`card bg-base-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border ${colors.borderColor}`}
    >
      <div className="card-body p-5">
        {/* 图标 */}
        <div className={`w-14 h-14 rounded-2xl ${colors.iconBgColor} flex items-center justify-center mb-4`}>
          <Folder className="w-8 h-8 text-white" />
        </div>

        {/* 文件夹名 */}
        <h3 className={`font-semibold text-base ${colors.textColor} truncate`} title={folder.name}>
          {folder.name}
        </h3>

        {/* 元信息 */}
        <div className="flex items-center gap-3 mt-2 text-xs text-base-content/50">
          <span className="flex items-center gap-1">
            <span className="font-medium">{childCount}</span> 个文件
          </span>
          {folder.lastModifiedDateTime && (
            <>
              <span>·</span>
              <span>{formatRelativeTime(folder.lastModifiedDateTime)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 src/components/home/FolderGrid.tsx**

```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderGrid, RefreshCw, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useFileStore } from '@/stores/fileStore';
import { useUIStore } from '@/stores/uiStore';
import { listUploadFolders } from '@/services/graphService';
import FolderCard from './FolderCard';

export default function FolderGrid() {
  const navigate = useNavigate();
  const graphClient = useAuthStore((s) => s.graphClient);
  const { folderList, setFolderList, isLoading, setLoading, setError } = useFileStore();
  const addToast = useUIStore((s) => s.addToast);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFolders = async () => {
    if (!graphClient) return;
    setLoading(true);
    try {
      const folders = await listUploadFolders(graphClient);
      setFolderList(folders);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
      setError('加载文件夹失败');
      addToast({ type: 'error', message: '加载文件夹失败，请刷新重试' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (graphClient) {
      fetchFolders();
    }
  }, [graphClient]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFolders();
    setRefreshing(false);
  };

  const handleFolderClick = (folderId: string) => {
    navigate(`/folder/${folderId}`);
  };

  if (isLoading && folderList.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-base-content/60">加载中...</p>
        </div>
      </div>
    );
  }

  if (folderList.length === 0 && !isLoading) {
    return (
      <div className="text-center py-20">
        <FolderGrid className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-base-content/60 mb-2">暂无文件夹</h3>
        <p className="text-sm text-base-content/40 mb-6">
          请在 OneDrive 中创建 /upload 目录
        </p>
        <button className="btn btn-primary btn-sm" onClick={handleRefresh}>
          刷新
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">文件夹</h2>
        <button
          className="btn btn-ghost btn-sm gap-1"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* 网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {folderList.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            onClick={() => handleFolderClick(folder.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建 src/components/home/QuickNote.tsx**

```typescript
import { useEffect, useRef, useCallback, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Markdown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNoteStore, NOTE_CONFIG } from '@/stores/noteStore';
import { useUIStore } from '@/stores/uiStore';
import { getDriveItem, uploadSmallFile, updateFileContent } from '@/services/graphService';
import { formatDateTime } from '@/utils/format';

export default function QuickNote() {
  const graphClient = useAuthStore((s) => s.graphClient);
  const { content, isDirty, isSaving, lastSaved, loadNote, setContent, setSaving, markSaved, setError } = useNoteStore();
  const addToast = useUIStore((s) => s.addToast);
  const updateToast = useUIStore((s) => s.updateToast);
  const removeToast = useUIStore((s) => s.removeToast);
  const darkMode = useUIStore((s) => s.darkMode);
  const [isExpanded, setIsExpanded] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [uploadToastId, setUploadToastId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const editorRef = useRef<unknown>();

  // 加载 /upload 文件夹 ID（note 的父文件夹）
  useEffect(() => {
    if (!graphClient) return;
    const loadFolder = async () => {
      try {
        const folder = await getDriveItem(graphClient, '/upload');
        setUploadFolderId(folder.id);
      } catch {
        console.warn('Could not get /upload folder ID');
      }
    };
    loadFolder();
  }, [graphClient]);

  // 加载 note.md
  useEffect(() => {
    if (!graphClient) return;
    const load = async () => {
      try {
        const item = await getDriveItem(graphClient, NOTE_CONFIG.noteFilePath);
        setNoteId(item.id);
        // 下载内容
        const url = item['@microsoft.graph.downloadUrl'] as string;
        const resp = await fetch(url);
        const text = await resp.text();
        loadNote(text);
      } catch {
        // 文件不存在，使用空内容
        loadNote('# 快速笔记\n\n在这里记录你的想法...\n');
      }
    };
    load();
  }, [graphClient]);

  // 自动保存（debounce）
  // 注意：noteId 和 noteId 不直接在此函数体引用，
  // 而是通过 saveNoteInternal 间接引用，saveNoteInternal 每次渲染都是新引用
  const autoSave = useCallback(async () => {
    if (!graphClient || !isDirty || isSaving) return;
    await saveNoteInternal();
  }, [graphClient, isDirty, isSaving]);

  // 编辑器内容变化
  const handleEditorChange = (value: string | undefined) => {
    const newContent = value ?? '';
    setContent(newContent);

    // 重置 debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      autoSave();
    }, NOTE_CONFIG.autoSaveDelay);
  };

  // 手动保存
  const handleSave = async () => {
    if (!graphClient || !isDirty || isSaving) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    await saveNoteInternal();
  };

  const saveNoteInternal = async () => {
    if (!graphClient) return;
    setSaving(true);

    // 显示上传进度 toast
    const toastId = addToast({
      type: 'uploading',
      message: '正在保存笔记...',
      progress: 0,
    });

    try {
      const blob = new Blob([content], { type: 'text/markdown' });
      const file = new File([blob], 'note.md', { type: 'text/markdown' });

      if (noteId) {
        // 更新现有文件：直接 PUT /content 覆盖内容
        await updateFileContent(graphClient, noteId, file);
      } else {
        // 首次创建：使用 /upload 文件夹 ID 作为父目录
        if (!uploadFolderId) throw new Error('upload folder not found');
        await uploadSmallFile(graphClient, uploadFolderId, 'note.md', file, 'rename');
        // 重新获取 note.md 的 ID 以便后续更新
        const item = await getDriveItem(graphClient, NOTE_CONFIG.noteFilePath);
        setNoteId(item.id);
      }

      markSaved();
      removeToast(toastId);
      addToast({ type: 'success', message: '笔记已保存' });
    } catch (error) {
      removeToast(toastId);
      setError('保存失败');
      addToast({ type: 'error', message: '保存笔记失败，请重试' });
    }
  };

  // 失焦保存
  const handleEditorBlur = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    autoSave();
  };

  // Monaco 主题响应式切换：darkMode 变化时通过 editor 实例手动更新
  useEffect(() => {
    if (editorRef.current) {
      (editorRef.current as { updateOptions: (opts: { theme: string }) => void }).updateOptions({
        theme: darkMode ? 'vs-dark' : 'vs',
      });
    }
  }, [darkMode]);

  return (
    <div className="card bg-base-100 mt-6">
      {/* 收起/展开头 */}
      <button
        className="w-full card-body p-4 flex flex-row items-center justify-between hover:bg-base-200/50 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Markdown className="w-5 h-5 text-primary" />
          <span className="font-semibold">快速笔记</span>
          {isDirty && (
            <span className="badge badge-sm badge-warning">未保存</span>
          )}
          {!isDirty && lastSaved && (
            <span className="text-xs text-base-content/40">
              已保存 {formatDateTime(lastSaved.toISOString())}
            </span>
          )}
        </div>
        <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-base-300 rounded-lg overflow-hidden min-h-[400px]">
            {/* Monaco Editor */}
            <div className="border-b lg:border-b-0 lg:border-r border-base-300">
              <Editor
                height="400px"
                defaultLanguage="markdown"
                value={content}
                onChange={handleEditorChange}
                onMount={(editor) => {
                  editorRef.current = editor;
                  editor.onDidBlurEditorWidget(() => handleEditorBlur());
                }}
                theme={darkMode ? 'vs-dark' : 'vs'}
                options={{
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  lineNumbers: 'off',
                  fontSize: 14,
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                }}
              />
            </div>

            {/* 预览 */}
            <div className="p-4 overflow-auto bg-base-200/30" style={{ height: '400px' }}>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MarkdownPreview content={content} />
              </div>
            </div>
          </div>

          {/* 保存栏 */}
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-base-content/40">
              {isSaving ? (
                <span className="flex items-center gap-1">
                  <span className="loading loading-spinner loading-xs" />
                  保存中...
                </span>
              ) : isDirty ? (
                '有未保存的更改'
              ) : (
                '所有更改已保存'
              )}
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? <span className="loading loading-spinner loading-xs" /> : null}
              保存到 OneDrive
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Markdown 预览组件（内联，避免多文件）
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function MarkdownPreview({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
}
```

- [ ] **Step 4: 创建 src/components/home/HomePage.tsx**

```typescript
import FolderGrid from './FolderGrid';
import QuickNote from './QuickNote';

export default function HomePage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <FolderGrid />
      <QuickNote />
    </div>
  );
}
```

---

## 里程碑 8：文件夹详情页

### Task 11: 创建面包屑组件

**Files:**
- Create: `src/components/folder/Breadcrumb.tsx`

**Steps:**

- [ ] **Step 1: 创建 src/components/folder/Breadcrumb.tsx**

```typescript
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm mb-4">
      {/* 首页 */}
      <Link
        to="/"
        className="flex items-center gap-1 text-base-content/60 hover:text-primary transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">主页</span>
      </Link>

      {/* 路径 */}
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-base-content/30" />
          {item.href ? (
            <Link
              to={item.href}
              className="text-base-content/60 hover:text-primary transition-colors max-w-[200px] truncate"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-base-content font-medium max-w-[200px] truncate">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: 创建 src/components/folder/BatchToolbar.tsx**

```typescript
import { Download, Trash2, X } from 'lucide-react';

interface BatchToolbarProps {
  selectedCount: number;
  onBatchDownload: () => void;
  onBatchDelete: () => void;
  onClearSelection: () => void;
}

export default function BatchToolbar({
  selectedCount,
  onBatchDownload,
  onBatchDelete,
  onClearSelection,
}: BatchToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 flex items-center gap-3 mb-4 flex-wrap">
      <span className="text-sm font-medium text-primary">
        已选择 <strong>{selectedCount}</strong> 项
      </span>
      <div className="flex-1" />
      <button className="btn btn-sm btn-primary gap-1" onClick={onBatchDownload}>
        <Download className="w-3.5 h-3.5" />
        批量下载
      </button>
      <button className="btn btn-sm btn-error gap-1" onClick={onBatchDelete}>
        <Trash2 className="w-3.5 h-3.5" />
        批量删除
      </button>
      <button className="btn btn-sm btn-ghost gap-1" onClick={onClearSelection}>
        <X className="w-3.5 h-3.5" />
        取消
      </button>
    </div>
  );
}
```

- [ ] **Step 3: 创建 src/components/folder/FileActions.tsx**

```typescript
import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Download, Trash2, Edit3, Eye, X, Check } from 'lucide-react';
import type { DriveItem } from '@/types';
import { isFolder } from '@/utils/format';

interface FileActionsProps {
  item: DriveItem;
  onDownload: (item: DriveItem) => void;
  onDelete: (item: DriveItem) => void;
  onRename: (item: DriveItem, newName: string) => void;
  onPreview: (item: DriveItem) => void;
}

export default function FileActions({
  item,
  onDownload,
  onDelete,
  onRename,
  onPreview,
}: FileActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // 重命名时自动聚焦
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    if (newName.trim() && newName !== item.name) {
      onRename(item, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setNewName(item.name);
      setIsRenaming(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {isRenaming ? (
        // 行内重命名输入框
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameSubmit}
            className="input input-bordered input-xs w-32"
          />
          <button className="btn btn-ghost btn-xs btn-square" onClick={handleRenameSubmit}>
            <Check className="w-3 h-3 text-success" />
          </button>
          <button
            className="btn btn-ghost btn-xs btn-square"
            onClick={() => {
              setNewName(item.name);
              setIsRenaming(false);
            }}
          >
            <X className="w-3 h-3 text-error" />
          </button>
        </div>
      ) : (
        <>
          <button
            className="btn btn-ghost btn-xs btn-square"
            onClick={() => setIsOpen(!isOpen)}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isOpen && (
            <div className="dropdown-content z-10 menu menu-sm p-2 shadow-lg bg-base-100 rounded-box w-40 border border-base-300 absolute right-0 top-full mt-1">
              {/* 预览（仅文件） */}
              {!isFolder(item) && (
                <li>
                  <button
                    onClick={() => {
                      onPreview(item);
                      setIsOpen(false);
                    }}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    预览
                  </button>
                </li>
              )}

              {/* 下载 */}
              <li>
                <button
                  onClick={() => {
                    onDownload(item);
                    setIsOpen(false);
                  }}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载
                </button>
              </li>

              {/* 重命名 */}
              <li>
                <button
                  onClick={() => {
                    setIsRenaming(true);
                    setIsOpen(false);
                  }}
                  className="gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  重命名
                </button>
              </li>

              {/* 删除 */}
              <li className="border-t border-base-300 mt-1 pt-1">
                <button
                  onClick={() => {
                    onDelete(item);
                    setIsOpen(false);
                  }}
                  className="gap-2 text-error"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </li>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 创建 src/components/folder/DropZoneOverlay.tsx**

```typescript
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import type { UploadProgress } from '@/types';

interface DropZoneOverlayProps {
  folderName: string;
  isActive: boolean;
  onDrop: (files: File[]) => void;
  onClose: () => void;
  uploadProgress?: UploadProgress[];
  isUploading?: boolean;
}

export default function DropZoneOverlay({
  folderName,
  isActive,
  onDrop,
  onClose,
  uploadProgress = [],
  isUploading = false,
}: DropZoneOverlayProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading,
  });

  if (!isActive && !isDragActive && uploadProgress.length === 0) return null;

  return (
    <div
      {...getRootProps()}
      className={`fixed inset-0 z-50 transition-all duration-200 ${
        isDragActive || isActive
          ? 'bg-blue-500/10 border-4 border-dashed border-blue-500 flex flex-col items-center justify-center'
          : 'bg-base-300/80 backdrop-blur-sm flex flex-col items-center justify-center'
      }`}
    >
      <input {...getInputProps()} />

      {isUploading && uploadProgress.length > 0 ? (
        // 上传进度
        <div className="bg-base-100 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary animate-pulse" />
              <span className="font-medium">正在上传...</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-square" onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {uploadProgress.map((p) => (
            <div key={p.fileName} className="mb-3 last:mb-0">
              <div className="flex justify-between text-sm mb-1">
                <span className="truncate max-w-[200px]">{p.fileName}</span>
                <span>{p.percentage}%</span>
              </div>
              <progress
                className="progress progress-primary w-full"
                value={p.percentage}
                max="100"
              />
            </div>
          ))}

          <div className="mt-3 text-xs text-center text-base-content/50">
            {uploadProgress.filter((p) => p.percentage === 100).length} / {uploadProgress.length} 已完成
          </div>
        </div>
      ) : isDragActive ? (
        // 拖拽激活态
        <div className="text-center pointer-events-none">
          <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-12 h-12 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-blue-600 mb-2">
            释放以上传到
          </h3>
          <p className="text-blue-500/80 text-lg">{folderName}</p>
        </div>
      ) : (
        // 默认覆盖层
        <div className="text-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-base-100 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Upload className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">拖拽文件到此处上传</h3>
          <p className="text-base-content/60">上传到 {folderName}</p>
          <button
            className="btn btn-sm btn-ghost mt-4 pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: 创建 src/components/folder/FileRow.tsx**

```typescript
import type { DriveItem } from '@/types';
import { formatFileSize, formatDateTime, isFolder } from '@/utils/format';
import { getFileIcon } from '@/utils/format';
import {
  File,
  Folder,
  Image,
  Video,
  Music,
  FileText,
  FileCode,
  FileSpreadsheet,
  Archive,
  FilePresentation,
} from 'lucide-react';
import FileActions from './FileActions';

const iconComponentMap: Record<string, typeof File> = {
  File,
  Image,
  Video,
  Music,
  FileText,
  FileCode,
  FileSpreadsheet,
  FilePresentation,
  Archive,
};

function getFileIconComponent(fileName: string): typeof File {
  const iconName = getFileIcon(fileName);
  return iconComponentMap[iconName] ?? File;
}

interface FileRowProps {
  item: DriveItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDownload: (item: DriveItem) => void;
  onDelete: (item: DriveItem) => void;
  onRename: (item: DriveItem, newName: string) => void;
  onPreview: (item: DriveItem) => void;
}

export default function FileRow({
  item,
  isSelected,
  onSelect,
  onDownload,
  onDelete,
  onRename,
  onPreview,
}: FileRowProps) {
  const IconComponent = isFolder(item) ? Folder : getFileIconComponent(item.name);
  const isFolderItem = isFolder(item);

  const handleClick = () => {
    onSelect(item.id);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(item.id);
  };

  return (
    <tr
      className={`hover:bg-base-200/50 transition-colors cursor-pointer ${
        isSelected ? 'bg-primary/5' : ''
      }`}
      onClick={handleClick}
    >
      {/* 复选框 */}
      <td onClick={handleCheckboxClick}>
        <label className="cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-sm checkbox-primary"
            checked={isSelected}
            onChange={() => {}}
          />
        </label>
      </td>

      {/* 图标 */}
      <td>
        <div className="flex items-center gap-2">
          <IconComponent
            className={`w-5 h-5 ${
              isFolderItem ? 'text-amber-500' : 'text-base-content/60'
            }`}
          />
        </div>
      </td>

      {/* 文件名 */}
      <td>
        <span className="font-medium truncate max-w-[200px] sm:max-w-[300px] block">
          {item.name}
        </span>
      </td>

      {/* 类型 */}
      <td className="text-base-content/60 text-sm hidden md:table-cell">
        {isFolderItem ? '文件夹' : (item.file?.mimeType ?? '-')}
      </td>

      {/* 修改时间 */}
      <td className="text-base-content/60 text-sm hidden lg:table-cell">
        {formatDateTime(item.lastModifiedDateTime)}
      </td>

      {/* 大小 */}
      <td className="text-base-content/60 text-sm hidden sm:table-cell">
        {isFolderItem ? '-' : formatFileSize(item.size ?? 0)}
      </td>

      {/* 操作 */}
      <td>
        <FileActions
          item={item}
          onDownload={onDownload}
          onDelete={onDelete}
          onRename={onRename}
          onPreview={onPreview}
        />
      </td>
    </tr>
  );
}

// Mobile 卡片版本
export function FileCard({
  item,
  isSelected,
  onSelect,
  onDownload,
  onDelete,
  onRename,
  onPreview,
}: FileRowProps) {
  const IconComponent = isFolder(item) ? Folder : getFileIconComponent(item.name);
  const isFolderItem = isFolder(item);

  return (
    <div
      className={`card bg-base-100 border ${
        isSelected ? 'border-primary' : 'border-base-300'
      }`}
    >
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          {/* 复选框 */}
          <input
            type="checkbox"
            className="checkbox checkbox-primary mt-1"
            checked={isSelected}
            onChange={() => onSelect(item.id)}
          />

          {/* 图标 */}
          <IconComponent
            className={`w-8 h-8 ${
              isFolderItem ? 'text-amber-500' : 'text-base-content/60'
            }`}
          />

          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{item.name}</h4>
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-base-content/50">
              <span>{formatFileSize(item.size ?? 0)}</span>
              <span>{formatDateTime(item.lastModifiedDateTime)}</span>
            </div>
          </div>

          {/* 操作 */}
          <div className="flex gap-1">
            <button
              className="btn btn-ghost btn-xs btn-square"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(item);
              }}
            >
              ↓
            </button>
            <button
              className="btn btn-ghost btn-xs btn-square text-error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 创建 src/components/folder/FileTable.tsx**

```typescript
import { useState, useMemo } from 'react';
import type { DriveItem, SortConfig } from '@/types';
import { FileRow, FileCard } from './FileRow';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface FileTableProps {
  files: DriveItem[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onDownload: (item: DriveItem) => void;
  onDelete: (item: DriveItem) => void;
  onRename: (item: DriveItem, newName: string) => void;
  onPreview: (item: DriveItem) => void;
}

export default function FileTable({
  files,
  selectedIds,
  onSelect,
  onSelectAll,
  onDownload,
  onDelete,
  onRename,
  onPreview,
}: FileTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'name',
    direction: 'asc',
  });

  // 过滤
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, searchQuery]);

  // 排序
  const sortedFiles = useMemo(() => {
    const sorted = [...filteredFiles].sort((a, b) => {
      const aVal = a[sortConfig.column] ?? '';
      const bVal = b[sortConfig.column] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredFiles, sortConfig]);

  // 切换排序
  const toggleSort = (column: SortConfig['column']) => {
    setSortConfig((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' }
    );
  };

  const SortIcon = ({ column }: { column: SortConfig['column'] }) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5" />
    );
  };

  const allSelected = sortedFiles.length > 0 && sortedFiles.every((f) => selectedIds.has(f.id));
  const someSelected = sortedFiles.some((f) => selectedIds.has(f.id));

  if (files.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-base-content/50">文件夹为空</p>
      </div>
    );
  }

  return (
    <div>
      {/* 搜索栏 */}
      <div className="mb-4">
        <div className="join w-full sm:w-auto">
          <div className="join-item flex items-center px-3 bg-base-100 border border-base-300 rounded-l-lg">
            <Search className="w-4 h-4 text-base-content/40" />
          </div>
          <input
            type="text"
            placeholder="搜索文件..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered join-item flex-1 rounded-l-none"
          />
        </div>
      </div>

      {/* 桌面端表格 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr className="border-base-300">
              <th className="w-10">
                <label>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={(e) => onSelectAll(e.target.checked)}
                  />
                </label>
              </th>
              <th className="w-8" />
              <th className="min-w-[200px]">
                <button
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={() => toggleSort('name')}
                >
                  文件名
                  <SortIcon column="name" />
                </button>
              </th>
              <th className="min-w-[100px]">
                <button
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={() => toggleSort('mimeType')}
                >
                  类型
                  <SortIcon column="mimeType" />
                </button>
              </th>
              <th className="min-w-[150px] hidden lg:table-cell">
                <button
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={() => toggleSort('lastModifiedDateTime')}
                >
                  修改时间
                  <SortIcon column="lastModifiedDateTime" />
                </button>
              </th>
              <th className="min-w-[80px] hidden sm:table-cell">
                <button
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={() => toggleSort('size')}
                >
                  大小
                  <SortIcon column="size" />
                </button>
              </th>
              <th className="w-16">操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedFiles.map((file) => (
              <FileRow
                key={file.id}
                item={file}
                isSelected={selectedIds.has(file.id)}
                onSelect={onSelect}
                onDownload={onDownload}
                onDelete={onDelete}
                onRename={onRename}
                onPreview={onPreview}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* 移动端卡片列表 */}
      <div className="md:hidden space-y-2">
        {sortedFiles.map((file) => (
          <FileCard
            key={file.id}
            item={file}
            isSelected={selectedIds.has(file.id)}
            onSelect={onSelect}
            onDownload={onDownload}
            onDelete={onDelete}
            onRename={onRename}
            onPreview={onPreview}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: 创建 src/components/folder/FolderDetailPage.tsx**

```typescript
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useFileStore } from '@/stores/fileStore';
import { useUIStore } from '@/stores/uiStore';
import {
  listFolderChildren,
  getDownloadUrl,
  deleteItem,
  renameItem,
} from '@/services/graphService';
import { uploadFile, uploadFiles } from '@/services/uploadService';
import type { DriveItem, UploadProgress } from '@/types';
import Breadcrumb from './Breadcrumb';
import FileTable from './FileTable';
import BatchToolbar from './BatchToolbar';
import DropZoneOverlay from './DropZoneOverlay';
import { FolderOpen, Loader2 } from 'lucide-react';

export default function FolderDetailPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const graphClient = useAuthStore((s) => s.graphClient);
  const { files, setFiles, setLoading, isLoading } = useFileStore();
  const addToast = useUIStore((s) => s.addToast);
  const updateToast = useUIStore((s) => s.updateToast);
  const removeToast = useUIStore((s) => s.removeToast);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const uploadToastIdRef = useRef<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string>('');

  // 加载文件夹内容
  const fetchFiles = useCallback(async () => {
    if (!graphClient || !folderId) return;
    setLoading(true);
    try {
      const [folderInfo, items] = await Promise.all([
        // 获取当前文件夹信息（名称等）
        graphClient.api(`/me/drive/items/${folderId}`).select(['name', 'parentReference']).get(),
        // 获取子项目列表
        listFolderChildren(graphClient, folderId),
      ]);
      setCurrentFolderName(folderInfo.name);
      setFiles(items);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      addToast({ type: 'error', message: '加载文件列表失败' });
    } finally {
      setLoading(false);
    }
  }, [graphClient, folderId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // 选择操作
  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedIds(new Set(files.map((f) => f.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // 下载
  const handleDownload = async (item: DriveItem) => {
    if (!graphClient) return;
    try {
      const url = await getDownloadUrl(graphClient, item.id);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.name;
      link.click();
      addToast({ type: 'success', message: `已开始下载 ${item.name}` });
    } catch {
      addToast({ type: 'error', message: `下载 ${item.name} 失败` });
    }
  };

  // 批量下载
  const handleBatchDownload = async () => {
    const selectedFiles = files.filter((f) => selectedIds.has(f.id) && !f.folder);
    for (const file of selectedFiles) {
      await handleDownload(file);
    }
    addToast({ type: 'success', message: `已下载 ${selectedFiles.length} 个文件` });
  };

  // 删除
  const handleDelete = async (item: DriveItem) => {
    if (!graphClient) return;
    if (!window.confirm(`确定删除 "${item.name}" 吗？此操作不可恢复。`)) return;
    try {
      await deleteItem(graphClient, item.id);
      setFiles(files.filter((f) => f.id !== item.id));
      selectedIds.delete(item.id);
      setSelectedIds(new Set(selectedIds));
      addToast({ type: 'success', message: `已删除 ${item.name}` });
    } catch {
      addToast({ type: 'error', message: `删除 ${item.name} 失败` });
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (!graphClient) return;
    const count = selectedIds.size;
    if (!window.confirm(`确定删除选中的 ${count} 个项目吗？此操作不可恢复。`)) return;
    try {
      for (const id of selectedIds) {
        await deleteItem(graphClient, id);
      }
      setFiles(files.filter((f) => !selectedIds.has(f.id)));
      setSelectedIds(new Set());
      addToast({ type: 'success', message: `已删除 ${count} 个项目` });
    } catch {
      addToast({ type: 'error', message: '批量删除失败' });
    }
  };

  // 重命名
  const handleRename = async (item: DriveItem, newName: string) => {
    if (!graphClient) return;
    try {
      const updated = await renameItem(graphClient, item.id, newName);
      setFiles(files.map((f) => (f.id === item.id ? { ...f, name: newName } : f)));
      addToast({ type: 'success', message: `已重命名为 ${newName}` });
    } catch {
      addToast({ type: 'error', message: '重命名失败' });
    }
  };

  // 预览
  const handlePreview = (item: DriveItem) => {
    if (!graphClient) return;
    getDownloadUrl(graphClient, item.id).then((url) => {
      window.open(url, '_blank');
    });
  };

  // 上传
  const handleFileUpload = async (filesToUpload: File[]) => {
    if (!graphClient || !folderId) return;
    setIsDragActive(false);
    setIsUploading(true);

    const progressMap: Record<string, UploadProgress> = {};
    filesToUpload.forEach((f) => {
      progressMap[f.name] = {
        fileName: f.name,
        uploadedBytes: 0,
        totalBytes: f.size,
        percentage: 0,
      };
    });
    setUploadProgress(Object.values(progressMap));

    // 创建进度 toast
    const toastId = addToast({
      type: 'uploading',
      message: `正在上传 ${filesToUpload.length} 个文件...`,
      progress: 0,
    });
    uploadToastIdRef.current = toastId;

    try {
      const result = await uploadFiles(
        graphClient,
        folderId,
        filesToUpload,
        (file, progress) => {
          progressMap[file.name] = progress;
          setUploadProgress([...Object.values(progressMap)]);
          // 更新 toast 进度
          const total = filesToUpload.length;
          const done = Object.values(progressMap).filter((p) => p.percentage === 100).length;
          const overall = total > 0 ? Math.round((done / total) * 100) : 0;
          updateToast(toastId, { progress: overall });
        }
      );

      removeToast(toastId);

      if (result.succeeded.length > 0) {
        addToast({ type: 'success', message: `成功上传 ${result.succeeded.length} 个文件` });
        fetchFiles(); // 刷新列表
      }
      if (result.failed.length > 0) {
        addToast({ type: 'error', message: `${result.failed.length} 个文件上传失败` });
      }
    } catch {
      removeToast(toastId);
      addToast({ type: 'error', message: '上传失败' });
    } finally {
      setIsUploading(false);
      setUploadProgress([]);
    }
  };

  if (isLoading && files.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const folderName = currentFolderName || '文件夹';

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* 面包屑 */}
      <Breadcrumb items={[{ label: folderName }]} />

      {/* 文件夹标题 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <FolderOpen className="w-7 h-7 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{folderName}</h1>
          <p className="text-sm text-base-content/50">{files.length} 个项目</p>
        </div>
      </div>

      {/* 批量操作栏 */}
      <BatchToolbar
        selectedCount={selectedIds.size}
        onBatchDownload={handleBatchDownload}
        onBatchDelete={handleBatchDelete}
        onClearSelection={handleClearSelection}
      />

      {/* 文件表格 */}
      <FileTable
        files={files}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onRename={handleRename}
        onPreview={handlePreview}
      />

      {/* 拖拽上传遮罩 */}
      <DropZoneOverlay
        folderName={folderName}
        isActive={isDragActive}
        onDrop={handleFileUpload}
        onClose={() => setIsDragActive(false)}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
      />

      {/* 隐藏的上传按钮（供点击触发） */}
      <input
        type="file"
        multiple
        className="hidden"
        id="file-upload-input"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) {
            handleFileUpload(files);
          }
          e.target.value = '';
        }}
      />

      {/* 固定上传按钮 */}
      <div className="fixed bottom-6 right-6">
        <label
          htmlFor="file-upload-input"
          className="btn btn-primary btn-circle btn-lg shadow-xl cursor-pointer"
          title="选择文件上传"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </label>
      </div>
    </div>
  );
}
```

---

## 里程碑 9：PWA 配置与收尾

### Task 12: PWA 图标与配置

**Files:**
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `public/manifest.json`

**Steps:**

- [ ] **Step 1: 创建 PWA 图标**

使用 SVG 或 Base64 生成简单的应用图标（蓝色云朵主题）：

Create: `public/icons/icon-192.svg` — SVG 图标，转换为 PNG 或直接使用 SVG
Create: `public/icons/icon-512.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="32" fill="#3b82f6"/>
  <path d="M96 48c-22.1 0-40 17.9-40 40 0 17.3 11.1 32.2 26.7 38.1L80 144h32l-2.7-17.9C126.9 120.2 138 105.3 138 88c0-22.1-17.9-40-40-40h-2z" fill="white"/>
  <path d="M96 56c-17.7 0-32 14.3-32 32 0 13.9 8.9 25.8 21.3 30.5L84 136h24l-1.3-17.5C118.1 113.8 127 101.9 127 88c0-17.7-14.3-32-31-32h-1z" fill="#60a5fa"/>
</svg>
```

- [ ] **Step 2: 创建 manifest.json**

```json
{
  "name": "Onedrive Upload Manager",
  "short_name": "OneDrive Upload",
  "description": "管理你的 OneDrive 文件，简单高效",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

### Task 13: App.tsx 完善（MSAL 回调处理）

**Files:**
- Modify: `src/App.tsx`

**Steps:**

- [ ] **Step 1: 完善 src/App.tsx，添加 MSAL 回调处理**

```typescript
// 替换之前的 App.tsx，添加 handleRedirectPromise
import { useEffect } from 'react';
// ... 保持原有导入 ...

export default function App() {
  const msalInstance = useAuthStore((s) => s.msalInstance);
  const setAccount = useAuthStore((s) => s.setAccount);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setGraphClient = useAuthStore((s) => s.setGraphClient);
  const setLoading = useAuthStore((s) => s.setLoading);
  const initializeMsal = useAuthStore((s) => s.initializeMsal);

  // MSAL 重定向回调处理
  useEffect(() => {
    if (!msalInstance) return;

    msalInstance.handleRedirectPromise().then((authResult) => {
      if (authResult) {
        const { account, accessToken } = authResult;
        const graphClient = Client.init({
          authProvider: (done) => {
            done(null, accessToken);
          },
        });
        setAccount(account);
        setAccessToken(accessToken);
        setGraphClient(graphClient);
        setLoading(false);
      } else {
        // 无回调结果，检查现有账户
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          const account = accounts[0];
          msalInstance
            .acquireTokenSilent({
              scopes: [...MSAL_CONFIG.scopes],
              account,
            })
            .then((response) => {
              const graphClient = Client.init({
                authProvider: (done) => {
                  done(null, response.accessToken);
                },
              });
              setAccount(account);
              setAccessToken(response.accessToken);
              setGraphClient(graphClient);
              setLoading(false);
            })
            .catch(() => {
              setAccount(account);
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      }
    });
  }, [msalInstance]);
  // ... 保持路由和其他逻辑 ...
}
```

### Task 14: 最终验证与启动说明

**Steps:**

- [ ] **Step 1: 验证 TypeScript 编译**

Run: `npx tsc --noEmit`
Expected: 无错误输出
**If fails:** 检查 import 路径（@/ 别名）、类型错误

- [ ] **Step 2: 验证 Vite 构建**

Run: `npm run build`
Expected: 构建成功，dist/ 目录生成
**If fails:** 检查依赖是否完整、vite.config.ts 路径别名配置

- [ ] **Step 3: 端到端冒烟测试**

Run: `npm run dev` → 打开 http://localhost:5173
Expected:
1. 页面显示登录页（未登录状态）
2. 点击"使用 Microsoft 账户登录" → 弹出 Microsoft 登录框
3. 登录成功后跳转到主页，显示文件夹网格
4. 点击 Quick Note 展开 Monaco 编辑器，可输入文字

**MSAL 认证失败（AADSTS 错误）排查：**
- 确认 Azure AD 应用注册中 redirectUri 包含 `http://localhost:5173`
- 确认已添加权限：User.Read, Files.ReadWrite.All, offline_access
- 确认"认证"页中已启用"隐式授权"（ID token 和 Access token）
- 确认 API 版本兼容 MSAL 3.x（PKCE 流程）

- [ ] **Step 4: 验证 PWA Service Worker 注册**

Run: `npm run preview`
Expected: http://localhost:4173 可访问，DevTools Application > Service Workers 显示已注册

- [ ] **Step 5: 创建启动说明文档**

Create: `docs/START.md`

```markdown
# 启动说明

## 开发环境

```bash
npm install
npm run dev
```

访问 http://localhost:5173

## 构建生产版本

```bash
npm run build
npm run preview
```

访问 http://localhost:4173

## PWA 安装

1. 在 Chrome/Edge 中打开应用
2. 点击地址栏右侧的安装图标，或
3. 开发者工具 > Application > Manifest > "Install"

## Azure AD 应用注册配置

在 Azure Portal > App registrations 中配置：

**Authentication:**
- redirectUri: `http://localhost:5173`
- 启用"Implicit grant": ✅ ID tokens, ✅ Access tokens

**API permissions:**
- Microsoft Graph > User.Read
- Microsoft Graph > Files.ReadWrite.All
- 勾选 "offline_access"

**Authentication platform:**
- Platform: Single-page application
- redirectUri: `http://localhost:5173`
```

---

## 里程碑概览

| 里程碑 | 任务数 | 核心产出 |
|---|---|---|
| 1. 脚手架 | 3 | Vite 项目、配置、Tailwind + DaisyUI |
| 2. 类型与工具 | 2 | types/index.ts, utils/ |
| 3. 状态管理 | 1 | 4个 Zustand Store |
| 4. 服务层 | 3 | authService, graphService, uploadService |
| 5. 认证页 | 1 | LoginPage, AuthCallback |
| 6. 布局组件 | 1 | TopBar, ToastContainer, Layout |
| 7. 主页组件 | 1 | FolderCard, FolderGrid, QuickNote, HomePage |
| 8. 文件夹页 | 1 | Breadcrumb, FileTable, FileActions, DropZone, FolderDetailPage |
| 9. PWA 与收尾 | 3 | 图标、manifest、完善 App.tsx、验证文档 |

**总任务数：16 个 Task，约 50+ 个 Step**

---

*本文档由 Superpowers writing-plans 工作流生成，基于 Design Document v1.0*
