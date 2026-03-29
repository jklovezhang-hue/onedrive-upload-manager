# Onedrive Upload Manager — 开发日志

> 版本：v1.2 | 日期：2026-03-30 | 状态：**正常运行（已部署至 Cloudflare Pages）**

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [核心功能](#4-核心功能)
5. [已解决的技术问题](#5-已解决的技术问题)
6. [API 设计](#6-api-设计)
7. [状态管理](#7-状态管理)
8. [启动与使用](#8-启动与使用)
9. [Azure AD 应用注册配置](#9-azure-ad-应用注册配置)
10. [PWA 安装](#10-pwa-安装)

---

## 1. 项目概述

**项目名称**：Onedrive Upload Manager
**项目类型**：本地运行的 PWA 单页应用（纯客户端，无需后端）
**核心功能**：通过 Microsoft Graph API 管理 OneDrive 个人账户的文件，支持文件夹浏览、拖拽上传、Markdown 笔记管理
**目标用户**：个人用户，有 OneDrive 个人版账号

### 文件夹结构（OneDrive 端）

```
OneDrive 根目录
└── /upload                    ← 应用根目录
    ├── /文件存储               ← 用户创建的文件夹（蓝色）
    ├── /资料备份               ← 用户创建的文件夹（绿色）
    ├── /共享资源               ← 用户创建的文件夹（紫色）
    ├── /临时归类               ← 用户创建的文件夹（橙色）
    ├── ...                    ← 其他用户创建的文件夹（灰色）
    └── /notes                 ← 笔记目录（隐藏，不在首页显示）
        ├── /note1.md
        ├── /note2.md
        └── ...
```

---

## 2. 技术栈

| 层级 | 技术选型 | 版本 |
|---|---|---|
| 构建工具 | Vite | 5.x |
| 前端框架 | React | 18.x |
| 语言 | TypeScript | strict mode |
| 样式 | Tailwind CSS + daisyUI | 3.4.x / 4.7.x |
| 路由 | React Router | 6.x |
| 状态管理 | Zustand | 4.x |
| 认证 | @azure/msal-browser | 3.x |
| Graph API | @microsoft/microsoft-graph-client | 3.x |
| Markdown 编辑 | @monaco-editor/react | 4.x |
| 拖拽上传 | react-dropzone | 14.x |
| 图标 | lucide-react | 0.344.x |
| PWA | vite-plugin-pwa + Workbox | 0.19.x |

---

## 3. 项目结构

```
src/
├── main.tsx                          # React 入口
├── App.tsx                           # 根组件 + 路由配置
├── index.css                         # Tailwind 入口
├── vite-env.d.ts                     # Vite 类型 + PWA client 类型
│
├── components/
│   ├── auth/
│   │   ├── LoginPage.tsx             # 登录页（全屏）
│   │   └── AuthCallback.tsx           # MSAL 回调页（降级处理）
│   │
│   ├── layout/
│   │   ├── TopBar.tsx                # 顶部导航栏（Logo + 用户 + 登出 + 主题）
│   │   ├── Layout.tsx                 # 页面布局包装 + 认证守卫
│   │   └── ToastContainer.tsx         # 全局 Toast 通知（右下角）
│   │
│   ├── home/
│   │   ├── HomePage.tsx               # 主页（文件夹网格 + 快速笔记）
│   │   ├── FolderGrid.tsx             # 文件夹网格 + 新建文件夹 Modal
│   │   ├── FolderCard.tsx             # 单个文件夹卡片（颜色 + 拖拽上传）
│   │   └── QuickNote.tsx              # 快速笔记（左侧列表 + 右侧 Monaco Editor）
│   │
│   └── folder/
│       ├── FolderDetailPage.tsx       # 文件夹详情页
│       ├── Breadcrumb.tsx             # 面包屑导航
│       ├── FileTable.tsx              # 文件表格（桌面端）
│       ├── FileRow.tsx                # 单行文件（桌面端）
│       ├── FileActions.tsx            # 文件操作菜单（⋮ 下拉）
│       ├── BatchToolbar.tsx           # 批量操作栏
│       └── DropZoneOverlay.tsx        # 拖拽上传遮罩层
│
├── hooks/
│   └── useNote.ts                     # 笔记 CRUD + 自动保存逻辑
│
├── stores/
│   ├── authStore.ts                   # 认证状态（account, token, graphClient）
│   ├── fileStore.ts                   # 文件/文件夹列表状态
│   ├── uiStore.ts                     # UI 状态（darkMode, toasts）
│   └── noteStore.ts                   # 笔记状态（列表, 当前笔记, 内容）
│
├── services/
│   ├── authService.ts                 # MSAL 配置（authService.ts）
│   ├── graphService.ts                # Graph API 封装（文件 + 笔记 CRUD）
│   └── uploadService.ts               # 上传逻辑（小文件/分片/进度）
│
├── utils/
│   ├── constants.ts                   # MSAL配置、API配置、上传阈值
│   ├── format.ts                     # 格式化函数（文件大小、日期、图标）
│   └── folderColor.ts                # 文件夹颜色映射
│
└── types/
    └── index.ts                       # DriveItem、Toast、Note 等类型定义

public/
├── manifest.json                      # PWA manifest（Vite 插件生成）
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## 4. 核心功能

### 4.1 认证与登录

- **登录页**：`/login` 全屏独立页面，Microsoft 账号登录按钮
- **MSAL 配置**（详见 9.1）：
  - `clientId: ae6ceb41-6cf4-4bcf-89a2-7ca49b8fb417`
  - `authority: https://login.microsoftonline.com/consumers`（个人 Microsoft 账号）
  - `redirectUri: window.location.origin`（**运行时动态获取当前域名**）
  - `postLogoutRedirectUri: window.location.origin + '/login'`
  - `scopes: ['User.Read', 'Files.ReadWrite.All', 'offline_access']`
  - `cacheLocation: 'localStorage'`（跨标签页持久化）
  - `storeAuthStateInCookie: true`（移动端兼容性）
- **Token 管理**：MSAL 内部 `localStorage`（改自 sessionStorage），`acquireTokenSilent` 自动刷新，失败则重新登录
- **登出**：顶部栏登出按钮，清除 sessionStorage，跳转登录页

### 4.2 主页 — 文件夹网格

- 展示 OneDrive `/upload` 下的所有**子文件夹**（不含 `/notes`）
- 网格布局：桌面 4 列 → 平板 2 列 → 手机 1 列
- 每个卡片：大彩色文件夹图标 + 文件夹名 + 颜色标签
- **固定颜色映射**：

| 关键词 | 颜色 |
|---|---|
| 文件存储 | 蓝色 `#3b82f6` |
| 资料备份 | 绿色 `#22c55e` |
| 共享资源 | 紫色 `#a855f7` |
| 临时归类 | 橙色 `#f97316` |
| 其他 | 灰色 `#6b7280` |

- **新建文件夹**：点击「新建文件夹」→ Modal 中输入名称 + 选颜色 → 调用 Graph API 创建
- **拖拽上传**：拖文件到任意卡片 → 上传到对应子文件夹
- **点击卡片**：进入 `/folder/:folderId` 详情页

### 4.3 主页 — 快速笔记

- 展开式卡片：点击标题栏展开/收起
- **左侧笔记列表**：按最后修改时间倒序，显示笔记名 + 修改时间 + 删除按钮
- **右侧 Monaco Editor**：Markdown 编辑，支持深色模式响应式切换
- **新建笔记**：点击「+」→ Modal 输入名称 → 在 `/upload/notes/` 下创建 `.md` 文件
- **自动保存**：800ms debounce，内容变化时触发；手动「保存到 OneDrive」按钮
- **切换笔记**：自动保存当前笔记后切换

### 4.4 文件夹详情页

- **面包屑**：`主页 > [文件夹名]`
- **文件表格**（桌面端）：多选框 | 图标 | 文件名 | 类型 | 修改时间 | 大小 | 操作
- **文件操作菜单**（⋮）：下载、重命名（行内编辑）、删除（confirm 确认）
- **批量操作**：选中后显示工具栏，支持批量下载、批量删除
- **上传按钮**：右下角固定蓝色圆形按钮，点击选择文件上传到当前文件夹
- **拖拽上传**：拖文件到页面任意区域，弹出遮罩层，显示上传进度

### 4.5 上传逻辑

| 文件大小 | 策略 |
|---|---|
| ≤ 4 MB | 直接 PUT `/items/{parentId}:/{name}:/content` |
| > 4 MB | `createUploadSession` + 分片上传（5 MiB/片）|

- 分片上传：指数退避重试（最多 3 次），`conflictBehavior: 'rename'`
- 进度显示：右下角 Toast 显示每个文件的上传进度百分比

---

## 5. 已解决的技术问题

### 5.1 OneDrive 个人版不支持 `$filter=file/mimeType`

**问题**：Graph API 查询笔记时使用 `$filter=file/mimeType eq 'text/markdown'`，返回 `400 Bad Request: Operation not supported`。

**解决**：去掉 `$filter` 查询参数，改为客户端过滤 `.md` 文件，并在 JS 中手动按 `lastModifiedDateTime desc` 排序。

```typescript
// 错误 ❌
.client.filter("file/mimeType eq 'text/markdown'")

// 正确 ✅
const mdFiles = (response.value ?? []).filter(
  (item: DriveItem) => !item.folder && item.name.toLowerCase().endsWith('.md')
);
```

### 5.2 OneDrive API 503 临时波动

**问题**：OneDrive API 偶发返回 503 Service Unavailable。

**解决**：在所有笔记相关 API 中封装 `withRetry(fn, retries=2)`，遇到 503/429 时自动指数退避重试。

### 5.3 笔记路径语法错误

**问题**：创建笔记时 API 路径语法错误（文件名含空格未 encode），导致创建成了文件夹。

**解决**：`encodeURIComponent(fileName)` 处理文件名，路径语法用 `/items/{id}:/{name}:/content`。

### 5.4 笔记 `conflictBehavior: 'replace'` 是无效值

**问题**：Graph API 的 `@microsoft.graph.conflictBehavior` 只支持 `fail`、`rename`、`prompt`，不支持 `replace`。

**解决**：更新现有笔记内容改用 `PUT /items/{id}/content`（直接覆盖，无需 conflictBehavior）。

### 5.5 文件夹详情页无法获取文件夹名称

**问题**：`listFolderChildren` 只返回子项，不返回文件夹本身。

**解决**：同时调用 `GET /items/{folderId}` 获取文件夹元信息，`GET /items/{folderId}/children` 获取子项列表，`Promise.all` 并行请求。

---

## 6. API 设计

### 6.1 认证（MSAL）

| 操作 | 方法 |
|---|---|
| 初始化 | `new PublicClientApplication(msalConfig)` |
| 登录 | `msalInstance.loginRedirect({ scopes })`（页面跳转，移动端兼容）|
| 静默获取 Token | `msalInstance.acquireTokenSilent({ scopes, account })` |
| 交互式获取 Token | `msalInstance.acquireTokenPopup({ scopes })` |
| 登出 | `msalInstance.logoutRedirect()` |

### 6.2 Graph API（封装在 graphService.ts）

#### 文件/文件夹操作

| 方法 | API | 说明 |
|---|---|---|
| `listUploadFolders()` | `GET /me/drive/root:/upload:/children` | 列出 /upload 子文件夹 |
| `listFolderChildren(folderId)` | `GET /me/drive/items/{id}/children` | 列出文件夹内容 |
| `getDriveItem(path)` | `GET /me/drive/root:{path}` | 获取指定路径 DriveItem |
| `getUploadFolderId()` | `GET /me/drive/root:/upload` | 获取 /upload 文件夹 ID |
| `createSubfolder(parentId, name)` | `POST /items/{id}/children` | 创建子文件夹 |
| `ensureUploadFolder()` | - | 确保 /upload 存在，不存在则创建 |
| `deleteItem(itemId)` | `DELETE /items/{id}` | 删除文件/文件夹 |
| `renameItem(itemId, newName)` | `PATCH /items/{id}` | 重命名 |
| `getDownloadUrl(itemId)` | `GET /items/{id}?select=@microsoft.graph.downloadUrl` | 获取下载 URL |

#### 笔记操作

| 方法 | API | 说明 |
|---|---|---|
| `ensureNotesFolder()` | `POST /items/{parentId}/children` | 确保 /upload/notes 存在 |
| `listNotes()` | `GET /items/{notesFolderId}/children` | 列出所有 .md 文件（客户端过滤） |
| `getNoteContent(noteId)` | `GET /items/{id}` → `downloadUrl` | 获取笔记文本内容 |
| `createNote(name, content)` | `PUT /items/{notesId}:/{name}.md:/content` | 创建新笔记文件 |
| `updateNoteContent(noteId, content)` | `PUT /items/{id}/content` | 覆盖更新笔记内容 |
| `renameNote(noteId, newName)` | `PATCH /items/{id}` | 重命名笔记 |
| `deleteNote(noteId)` | `DELETE /items/{id}` | 删除笔记 |

### 6.3 上传服务（uploadService.ts）

| 场景 | 方法 |
|---|---|
| 小文件 ≤ 4MB | `uploadSmallFile()` — 直接 PUT |
| 大文件 > 4MB | `createUploadSession()` + 分片 PUT |
| 批量上传 | `uploadFiles()` — 顺序逐个上传，报告每个文件的进度 |

---

## 7. 状态管理（Zustand）

### 7.1 authStore

```typescript
{
  account: AccountInfo | null,       // 当前登录用户
  accessToken: string | null,        // Access Token
  msalInstance: PublicClientApplication | null,
  graphClient: Client | null,        // Graph Client（带 authProvider）
  isLoading: boolean,
  isInitialized: boolean,
}
```

### 7.2 fileStore

```typescript
{
  currentFolder: DriveItem | null,    // 当前文件夹信息
  files: DriveItem[],                 // 当前文件夹内的文件列表
  folderList: DriveItem[],            // /upload 下的子文件夹列表
  isLoading: boolean,
}
```

### 7.3 uiStore

```typescript
{
  darkMode: boolean,                  // 持久化到 localStorage
  toasts: Toast[],                   // 当前 Toast 列表
  addToast(toast), updateToast(id, updates), removeToast(id),
  toggleDarkMode(), setDarkMode(dark),
}
```

### 7.4 noteStore

```typescript
{
  notes: Note[],                      // 笔记列表 { id, name, lastModified, size }
  activeNoteId: string | null,       // 当前选中的笔记 ID
  content: string,                    // 当前笔记内容
  originalContent: string,             // 上次保存的内容（用于判断 isDirty）
  isDirty: boolean,                   // 是否有未保存更改
  isLoading: boolean,                 // 笔记列表加载中
  isSaving: boolean,                  // 保存中
}
```

---

## 8. 启动与使用

### 8.1 安装依赖

```bash
npm install
```

### 8.2 开发环境

```bash
npm run dev
# 访问 http://localhost:5173
```

### 8.3 生产构建

```bash
npm run build
npm run preview
# 访问 http://localhost:4173
```

### 8.4 首次登录流程

1. 访问 `http://localhost:5173`，自动跳转 `/login`
2. 点击「使用 Microsoft 账户登录」
3. 在 Microsoft 弹窗中选择账号并授权
4. 授权成功后跳转主页，显示文件夹网格
5. 如果 OneDrive 根目录没有 `/upload` 文件夹，应用会自动创建

---

## 9. Azure AD 应用注册配置

在 [Azure Portal](https://portal.azure.com) > **Azure Active Directory** > **App registrations** > 选择应用：

### 9.1 Authentication（认证）

| 配置项 | 值 |
|---|---|
| Platform | Single-page application (SPA) |
| Redirect URI | `http://localhost:5173`（开发用）|
| Redirect URI | `https://onedrive-upload-manager.jklove-zhang.workers.dev`（Cloudflare Pages 生产环境）|
| Redirect URI | `https://onedrive-upload-manager.jklove-zhang.workers.dev/auth/callback`（MSAL 回调）|
| Implicit grant | ✅ **ID tokens**（必须） |

> 注意：MSAL 3.x 使用 PKCE 流程，不再需要 Access tokens 的隐式授权，但 ID tokens 仍然需要。

### 9.2 API permissions（API 权限）

| API | Permission | Type |
|---|---|---|
| Microsoft Graph | `User.Read` | Delegated |
| Microsoft Graph | `Files.ReadWrite.All` | Delegated |
| Microsoft Graph | `offline_access` | Delegated |

点击「Grant admin consent」（如果你是租户管理员），或让用户在首次登录时同意。

### 9.3 常见 AADSTS 错误排查

| 错误代码 | 原因 | 解决方法 |
|---|---|---|
| `AADSTS50011` | Redirect URI 不匹配 | 确认 Azure Portal 中 redirectUri 包含当前访问地址 |
| `AADSTS70002` | Client ID 不匹配 | 确认 `clientId` 为 `ae6ceb41-6cf4-4bcf-89a2-7ca49b8fb417` |
| `AADSTS50053` | 账户被锁定 | 登录 [account.live.com](https://account.live.com) 解锁账户 |
| `AADSTS50055` | 密码已过期 | 在 account.live.com 重置密码 |
| `AADSTS90006` | 缺少 offline_access scope | 确认已添加 `offline_access` 权限 |

---

## 10. PWA 安装

### 10.1 桌面端（Chrome / Edge）

1. 用 Chrome/Edge 打开应用（`http://localhost:5173` 或已部署的 URL）
2. 地址栏右侧出现「安装」图标（电脑带箭头），点击安装
3. 或者：DevTools（F12）> Application > Manifest > "Install"

### 10.2 安卓手机

1. 用 Chrome 打开应用
2. 点击浏览器菜单（三点）> 「添加到主屏幕」或「安装应用」

### 10.3 离线行为

- UI 全部可用（Service Worker 缓存了所有静态资源）
- 文件操作（上传/下载/删除/笔记保存）需要联网，离线时显示错误 Toast

---

## 11. 安卓手机 PWA 部署详解

当前应用运行在 `localhost:5173`，手机无法直接访问。必须部署到公网域名，手机才能通过浏览器安装为 PWA。

### 11.1 方案对比

| 方案 | 免费 | 速度 | 自定义域名 | 备注 |
|---|---|---|---|---|
| Cloudflare Pages | ✅ | 快 | ✅ | **推荐**，无限流量 |
| Vercel | ✅ | 快 | ✅ | 需注册账号 |
| Netlify | ✅ | 快 | ✅ | 需注册账号 |
| GitHub Pages | ✅ | 中 | ✅ | 构建产物手动部署 |
| 自建服务器 | ❌ | 快 | ✅ | 需要公网服务器 |

### 11.2 方案 A：Cloudflare Pages（推荐）

**当前部署配置：**

- **项目名称**：`onedrive-upload-manager`
- **部署地址**：`https://onedrive-upload-manager.jklove-zhang.workers.dev`
- **构建方式**：Git 集成（推荐）或 Direct upload）

**使用 Git 集成部署（推荐）：**

1. 注册 [Cloudflare](https://dash.cloudflare.com/)（免费）
2. 点击「Workers & Pages」→ 「Create application」→ 「Connect to Git」
3. 选择你的 GitHub 仓库
4. 设置：
   - **Production branch**: `main`
   - **Build command**: `npm ci && npm run build`
   - **Build output directory**: `dist`
5. 点击「Save and Deploy」

**使用 Direct upload 部署：**

```bash
# 先构建
npm run build

# 用 Wrangler 上传（需要 CLOUDFLARE_API_TOKEN 环境变量）
npx wrangler pages deploy dist/ --project-name=onedrive-upload-manager
```

### 11.3 方案 B：Vercel

```bash
# 构建
npm run build

# 安装 vercel 并部署
npm i -g vercel
vercel --prod dist/
```

获得 `*.vercel.app` 域名后，同样在 Azure Portal 添加对应 redirectUri。

### 11.4 方案 C：Netlify

```bash
npm run build
npx netlify deploy --prod --dir=dist
```

### 11.5 Azure AD 配置（关键）

部署到公网后，**必须**在 Azure Portal 更新 redirectUri，否则 Microsoft 登录会失败：

1. [Azure Portal](https://portal.azure.com) → **App registrations** → 选择应用
2. **Authentication** → **Add URI** → 添加实际 URL，例如：
   - `https://onedrive-upload-manager.jklove-zhang.workers.dev`（必须）
   - `https://onedrive-upload-manager.jklove-zhang.workers.dev/auth/callback`（MSAL 回调）
3. 重新点击「**Grant admin consent**」（即使之前已授权，新 URI 也需要）

### 11.6 手机端使用流程

1. 用 Chrome 打开部署后的 URL：`https://onedrive-upload-manager.jklove-zhang.workers.dev`
2. 点击「使用 Microsoft 账户登录」→ 在 Microsoft 弹窗中授权
3. 登录成功后即可正常使用所有功能
4. **安装为 PWA**：Chrome 菜单（三点）→ 「添加到主屏幕」
5. 以后从手机桌面图标打开，就像原生 App 一样

### 11.7 手机端功能支持情况

| 功能 | 支持 | 备注 |
|---|---|---|
| Microsoft 登录 | ✅ | 需联网 |
| 浏览 /upload 子文件夹 | ✅ | 响应式布局 |
| 文件夹详情与文件列表 | ✅ | 触控友好 |
| 文件上传（点击按钮） | ✅ | 右下角圆形按钮 |
| 文件下载 | ✅ | 浏览器原生下载 |
| 笔记编辑 | ✅ | Monaco 可用 |
| 文件重命名 | ✅ | 行内编辑 |
| 批量选择/操作 | ✅ | 触控可用 |
| 离线查看 UI | ✅ | PWA 缓存 |
| 离线文件操作 | ❌ | 提示联网 |

---

## 12. 手机部署问题排查与解决方案（重要经验）

### 12.1 问题：手机登录跳转到 localhost

**现象**：手机访问 `https://onedrive-upload-manager.jklove-zhang.workers.dev/` 后，点击登录按钮跳转到 `http://localhost:5173`，显示"无法访问此网站"。

**根本原因**：MSAL 的 `redirectUri` 在构建时被硬编码为 `http://localhost:5173`。

**解决方案**：所有 redirectUri 必须使用 `window.location.origin` 动态获取当前域名。

```typescript
// ❌ 错误：硬编码 localhost
redirectUri: 'http://localhost:5173'
redirectUri: import.meta.env.VITE_REDIRECT_URI  // 环境变量在构建时注入，生产环境可能缺失

// ✅ 正确：运行时动态获取
redirectUri: window.location.origin
postLogoutRedirectUri: `${window.location.origin}/login`
```

### 12.2 问题：Vite 环境变量在 Cloudflare 构建时未注入

**现象**：设置了 `.env.production` 文件，但构建产物中仍然包含 localhost。

**原因**：Vite 的 `import.meta.env.VITE_*` 变量在**构建时**被替换。如果 Cloudflare 构建环境没有该环境变量，就会使用 fallback 值。

**解决方案**：
1. 不依赖环境变量，直接使用 `window.location.origin`
2. 删除 `.env` 和 `.env.production` 文件
3. 确保代码中没有任何 `localhost:5173` 字符串

### 12.3 问题：wrangler.toml 配置模式混淆

**现象**：Cloudflare 提示"无法修改 Worker 的环境变量"（Variables cannot be added to a Worker that only has static assets）。

**原因**：项目混合了 Workers 和 Pages 模式：
- Workers 模式使用 `[assets]` 配置
- Pages 模式使用 `pages_build_output_dir` 配置

**解决方案**：根据部署方式选择正确的配置：

```toml
# Pages 模式（推荐，用于纯静态网站）
name = "onedrive-upload-manager"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"

# Workers 模式（用于有后端逻辑的项目）
name = "onedrive-upload-manager"
compatibility_date = "2024-01-01"

[assets]
directory = "./dist"
exclude = ["_redirects"]

[build]
command = "npm run build"
```

### 12.4 问题：wrangler deploy 失败 "Must specify a project name"

**现象**：`npx wrangler pages deploy dist/` 报错 "Must specify a project name"。

**原因**：CI 环境无法交互式输入项目名称。

**解决方案**：在构建命令中添加 `--project-name` 参数：

```bash
npm ci && npm run build && npx wrangler pages deploy dist/ --project-name onedrive-upload-manager
```

### 12.5 问题：wrangler Authentication error [code: 10000]

**现象**：wrangler 部署时报认证错误。

**原因**：Cloudflare API Token 权限不足。

**解决方案**：
1. 去 https://dash.cloudflare.com/profile/api-tokens
2. 创建新 Token，添加 **Account: Cloudflare Pages: Edit** 权限
3. 将新 Token 更新到 Cloudflare Pages 项目的 `CLOUDFLARE_API_TOKEN` 环境变量

### 12.6 最佳实践总结

1. **redirectUri 必须动态化**：始终使用 `window.location.origin`，不要硬编码或依赖环境变量
2. **删除所有 localhost 引用**：构建前全局搜索 `localhost:5173`，确保零残留
3. **使用 Git 集成部署**：Cloudflare Pages 的 Git 集成最稳定，自动处理构建和部署
4. **保持配置简单**：使用 Pages 模式的 `pages_build_output_dir`，避免复杂的 wrangler 配置
5. **验证构建产物**：部署前检查 `dist/assets/*.js` 中是否包含 localhost

---

## 更新日志

### v1.2（2026-03-30）

**问题修复：**

- **手机登录跳转到 localhost**：移除所有 `VITE_REDIRECT_URI` 环境变量依赖，`redirectUri` 和 `postLogoutRedirectUri` 统一使用 `window.location.origin`
- **删除 `.env` 文件**：该文件包含硬编码的 `localhost:5173`，已被删除
- **删除 `dist/` 从 git 追踪**：Cloudflare 从源码构建，不需要追踪构建产物
- **添加 `dist/` 到 `.gitignore`**：避免误提交构建产物

**代码变更：**

```typescript
// App.tsx - 修改前
const redirectUri = import.meta.env.VITE_REDIRECT_URI || window.location.origin;
const config: Configuration = {
  auth: {
    redirectUri,
    postLogoutRedirectUri: `${redirectUri}/login`,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// App.tsx - 修改后
const config: Configuration = {
  auth: {
    redirectUri: window.location.origin,
    postLogoutRedirectUri: `${window.location.origin}/login`,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
};
```

**部署成功：**

- Cloudflare Pages 部署地址：`https://onedrive-upload-manager.jklove-zhang.workers.dev`
- 手机端可正常登录和使用

### v1.1（2026-03-29）

**修复：**
- `conflictBehavior: 'replace'` 改为 `updateFileContent()`（Graph API 不支持 replace 值）
- OneDrive 个人版 `$filter=file/mimeType eq 'text/markdown'` → 400，改为客户端过滤 `.md`
- `getDriveItem` 被传入完整 API 路径导致 404 → 统一使用相对路径
- 根目录重复上传问题 → 首页去掉全局 Dropzone，拖拽仅作用于卡片级
- **MSAL redirectUri 硬编码 localhost** → 改为 `window.location.origin`，支持局域网 IP 访问
- **MSAL `handleRedirectPromise()` 未被调用** → `initializeMsal` 中补全 redirect 处理流程，解决手机访问白屏问题
- **Layout spinner 在白屏上不可见** → 修复后手机可正常跳转到登录页

**新增：**
- 多笔记系统：`/upload/notes/` 下 `.md` 文件，左侧列表 + 右侧 Monaco Editor
- 新建笔记 Modal（输入名称 → 在 `/upload/notes/` 下创建 `.md` 文件）
- 笔记删除（hover 显示删除按钮，需二次确认）
- 笔记重命名（PATCH 更新 name + `.md`）
- 笔记按最后修改时间倒序显示
- 上传进度 Toast（文件名、百分比、已上传/总大小）
- `withRetry` 通用重试逻辑（应对 503/429，指数退避）
- 首页 HomePage 简化为无拖拽干扰的干净布局

**移除：**
- Quick Note 中的 Markdown 预览区（只保留 Monaco Editor）
- react-markdown + remark-gfm（减少打包体积 ~100KB）

### v1.0（2026-03-29）

- 完成基础架构：Vite + React 18 + TypeScript strict + Tailwind + daisyUI
- 完成 MSAL 认证：PKCE 流程，Token 自动刷新
- 完成主页：文件夹网格（创建/拖拽上传）+ 快速笔记
- 完成文件夹详情页：文件列表/下载/删除/重命名/上传按钮
- 完成 PWA 配置：Service Worker + manifest + 图标
- 修复 OneDrive 个人版 `$filter=mimeType` 不支持问题
- 修复笔记 API 路径语法、conflictBehavior 无效值等问题

---

*本文档由 Superpowers 工作流生成，记录了 Onedrive Upload Manager 的完整开发过程。*
