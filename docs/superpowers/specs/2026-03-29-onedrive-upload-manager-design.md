# Onedrive Upload Manager — Design Document

> 版本：v1.0 | 日期：2026-03-29 | 状态：草稿

---

## 1. 项目概述

**项目名称**：Onedrive Upload Manager（简称 Onedrive-upload）
**项目类型**：本地运行的单页 Web 应用（PWA）
**核心功能**：通过 Microsoft Graph API 管理 OneDrive 个人账户的文件，支持文件夹浏览、上传下载、Quick Note 编辑
**目标用户**：个人用户，有 OneDrive 个人版账号，需要简洁的云文件管理界面

---

## 2. 技术栈

| 层级 | 技术选型 | 版本要求 |
|---|---|---|
| 构建工具 | Vite | ^5.x |
| 前端框架 | React | 18.x |
| 语言 | TypeScript | strict mode |
| 样式 | Tailwind CSS + daisyUI | 最新 |
| 路由 | React Router v6 | ^6.x |
| 状态管理 | Zustand | ^4.x |
| 认证 | @azure/msal-browser | ^3.x |
| Graph API | @microsoft/microsoft-graph-client | ^3.x |
| Markdown 编辑 | @monaco-editor/react | ^4.x |
| Markdown 预览 | react-markdown + remark-gfm | 最新 |
| 拖拽上传 | react-dropzone | ^14.x |
| 图标 | lucide-react | 最新 |
| PWA | vite-plugin-pwa + Workbox | 最新 |

---

## 3. 架构总览

```
┌──────────────────────────────────────────────────┐
│  PWA Shell (vite-plugin-pwa + Workbox)            │
│  ┌──────────────────────────────────────────────┐ │
│  │  React Router v6                              │ │
│  │                                                │ │
│  │  /login            →  登录页（独立全屏）         │ │
│  │  /auth/callback    →  MSAL PKCE 回调处理       │ │
│  │  /                 →  主页（文件夹网格 + QuickNote）│
│  │  /folder/:folderId →  文件夹详情页              │ │
│  └──────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────┐ │
│  │  Zustand Stores (authStore, fileStore,       │ │
│  │                     uiStore, noteStore)      │ │
│  └──────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────┐ │
│  │  Services (authService, graphService,         │ │
│  │              uploadService)                  │ │
│  └──────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────┐ │
│  │  Microsoft Graph API (OneDrive Personal)      │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## 4. 路由设计

| 路径 | 组件 | 说明 |
|---|---|---|
| `/login` | `LoginPage` | 全屏登录页面 |
| `/auth/callback` | `AuthCallback` | 处理 MSAL PKCE code 换 token |
| `/` | `HomePage` | 主页：文件夹网格 + Quick Note |
| `/folder/:folderId` | `FolderDetail` | 文件夹详情：面包屑 + 文件列表 |

---

## 5. 状态管理（Zustand）

### 5.1 authStore

```typescript
interface AuthState {
  account: AccountInfo | null;
  accessToken: string | null;
  msalInstance: PublicClientApplication | null;
  graphClient: Client | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  acquireToken: () => Promise<string>;
}
```

### 5.2 fileStore

```typescript
interface FileState {
  currentFolder: DriveItem | null;
  files: DriveItem[];
  folderList: DriveItem[];  // /upload 下的子文件夹
  isLoading: boolean;
  setCurrentFolder: (folder: DriveItem) => void;
  fetchFolderList: () => Promise<void>;
  fetchFiles: (folderId: string) => Promise<void>;
  deleteFile: (itemId: string) => Promise<void>;
  renameFile: (itemId: string, newName: string) => Promise<void>;
  downloadFile: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}
```

### 5.3 uiStore

```typescript
interface UIState {
  darkMode: boolean;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  toggleDarkMode: () => void;
}
```

### 5.4 noteStore

```typescript
interface NoteState {
  content: string;
  originalContent: string;  // 用于判断 isDirty
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  loadNote: () => Promise<void>;
  saveNote: () => Promise<void>;
  setContent: (content: string) => void;
}
```

---

## 6. 服务层

### 6.1 authService.ts

- 初始化 MSAL `PublicClientApplication`
- `login()`: 调用 `msalInstance.loginPopup()` 或 `loginRedirect()`
- `logout()`: 调用 `msalInstance.logoutPopup()` 或 `logoutRedirect()`
- `acquireToken()`: 先 `acquireTokenSilent()`，失败则 `acquireTokenRedirect()`

### 6.2 graphService.ts

封装所有 Graph API 调用：

| 方法 | API | 说明 |
|---|---|---|
| `getUserProfile()` | `GET /me` | 获取用户头像和名称 |
| `listUploadChildren()` | `GET /me/drive/root:/upload:/children` | 列出 /upload 下的子文件夹 |
| `listFolderChildren(folderId)` | `GET /me/drive/items/{id}/children` | 列出某文件夹内的所有项目 |
| `getDriveItem(path)` | `GET /me/drive/root:{path}` | 获取指定路径的 DriveItem |
| `uploadSmallFile(parentId, file, conflictBehavior)` | `PUT /me/drive/items/{parentId}:/{name}:/content` | ≤4MB 直接上传 |
| `createUploadSession(parentId, fileName, conflictBehavior)` | `POST /me/drive/items/{parentId}:/{name}:/createUploadSession` | 创建分片上传会话 |
| `deleteItem(itemId)` | `DELETE /me/drive/items/{id}` | 删除文件/文件夹 |
| `renameItem(itemId, name)` | `PATCH /me/drive/items/{id}` | 重命名 |
| `downloadItem(itemId)` | `GET /me/drive/items/{id}/content` | 下载文件 |
| `getThumbnail(itemId)` | `GET /me/drive/items/{id}/thumbnails` | 获取缩略图 |

### 6.3 uploadService.ts

- 接收 `File` 对象、目标 `parentId`、Graph Client 实例
- `file.size <= 4 * 1024 * 1024` → 直接调用 `graphService.uploadSmallFile()`
- `file.size > 4 * 1024 * 1024` → 调用 `createUploadSession` + 分片上传：
  - 分片大小：5 MiB（必须是 320 KiB = 327,680 bytes 的倍数）
  - 进度回调：实时上报上传字节数
  - 重试策略：指数退避，最多 3 次
  - `conflictBehavior`: `"rename"`
- 返回上传结果或抛出错误

---

## 7. 页面设计

### 7.1 登录页（LoginPage）

- 全屏布局，垂直水平居中
- 背景：深色渐变（daisyUI 的 neutral 色调）
- 中央卡片：App Logo + 标题「Onedrive Upload Manager」+ 「使用 Microsoft 账户登录」按钮
- 按钮样式：daisyUI `btn-primary`，带 Microsoft Logo
- 加载态：按钮显示 spinner + "正在跳转..."

### 7.2 主页（HomePage）

**顶部栏**（daisyUI `navbar`，sticky）：

```
[App Logo] Onedrive Upload Manager          [用户头像] [显示名] [登出] [🌙/☀️]
```

**文件夹卡片网格**（CSS Grid，响应式）：

```
桌面(≥1024px): 4列
平板(≥640px):  2列
手机(<640px):  1列
```

每个卡片内容：

```
┌─────────────────────────────┐
│  📁 (大图标, 颜色填充)        │
│                             │
│  文件夹名称                   │
│  📄 12 个文件    2026-03-28  │
└─────────────────────────────┘
```

**文件夹颜色映射**：

| 文件夹名称关键词 | Tailwind 颜色 |
|---|---|
| 文件存储 | `text-blue-500`, `bg-blue-50` |
| 资料备份 | `text-green-500`, `bg-green-50` |
| 共享资源 | `text-purple-500`, `bg-purple-50` |
| 临时归类 | `text-orange-500`, `bg-orange-50` |
| 其他 | `text-gray-500`, `bg-gray-50` |

**Quick Note 区域**：

- 收起态（默认）：折叠面板，`<details>` + `<summary>`，显示「📝 快速笔记」+ 文件状态
- 展开态：
  - 左右分栏布局，Monaco Editor 占左 50%，预览占右 50%
  - 分隔线可拖拽调整比例
  - Monaco 语言设为 `markdown`，主题跟随 daisyUI 明暗模式
  - 底部保存栏：保存状态文字 + 「保存到 OneDrive」按钮
  - 自动保存：800ms debounce + textarea/editor 失焦时触发
  - 保存路径：`/upload/note.md`（不存在则先创建空文件）

### 7.3 文件夹详情页（FolderDetail）

**顶部面包屑**：

```
主页 > [文件夹名]
```

**搜索栏**：输入框，客户端过滤文件名（`files.filter(f => f.name.includes(query))`）

**工具栏**（选中文件后显示）：

```
[☑ 已选择 N 项]  [批量下载]  [批量删除]  [取消选择]
```

**文件表格**（daisyUI `table` 组件）：

| ☑ | 图标 | 文件名 | 类型 | 修改时间 | 大小 | 操作 |
|---|---|---|---|---|---|---|
| ☐ | 📄 | 报告.docx | Word | 2026-03-28 | 1.2 MB | ⋮ |

- 点击表头列可排序（升/降）
- 操作列 `⋮` 下拉菜单：下载、删除、重命名、预览
- 删除确认：`window.confirm` 或 daisyUI `modal`
- 重命名：行内 `input` 编辑，回车确认
- 移动端：表格隐藏，切换为卡片列表

**整页 Dropzone**：

- `react-dropzone` 覆盖整个页面容器（`position: fixed` 遮罩层）
- 拖拽进入：`rgba(59, 130, 246, 0.1)` 背景 + 蓝色边框 + 文字「释放以上传到 [当前文件夹]」
- 拖拽离开：遮罩消失
- 支持多文件同时拖拽

**上传进度**：

- 每个文件单独进度条
- 底部显示汇总：「上传中：2/5，60%」
- 单个进度条：`{文件名} - {已上传}/{总大小} ({百分比}) - {速度}/s」
- 完成后：绿色成功 Toast，自动从列表移除或追加到列表

### 7.4 Toast 通知系统

- 全局 `ToastContainer`（固定在右下角）
- 类型：`success`（绿色）、`error`（红色）、`info`（蓝色）、`uploading`（蓝色 + spinner）
- 自动消失：success/info 5秒，error 不自动消失（需手动关闭）
- 上传进度 Toast 实时更新，不消失直到完成/失败

---

## 8. PWA 配置

### 8.1 manifest.json

```json
{
  "name": "Onedrive Upload Manager",
  "short_name": "OneDrive Upload",
  "description": "管理你的 OneDrive 文件",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 8.2 Service Worker 策略

| 资源类型 | 策略 |
|---|---|
| 静态资源（JS/CSS/字体/图标） | CacheFirst，缓存名 `static-cache-v1` |
| Graph API 请求 | NetworkOnly（文件操作必须联网） |

### 8.3 离线行为

- UI 全部可用（已缓存）
- 文件操作弹出 Toast：「当前处于离线状态，请联网后重试」

---

## 9. 错误处理

| 错误类型 | 处理策略 |
|---|---|
| Token 过期 | MSAL `acquireTokenSilent` 自动刷新，失败则 `logout()` 跳转登录页 |
| 网络错误 | Toast「网络连接失败，请检查网络」+ 重试按钮 |
| 上传失败 | 指数退避重试（1s → 2s → 4s，最多 3 次），失败 Toast + 记录失败文件 |
| 权限不足 | Toast「权限不足，请重新授权」+ `logout()` |
| 文件不存在 | Toast「文件不存在」+ 刷新列表 |
| 文件名冲突 | MSAL 传入 `conflictBehavior: "rename"`，自动重命名 |

---

## 10. 项目结构

```
src/
├── main.tsx
├── App.tsx
├── index.css
├── vite-env.d.ts
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx         # 顶部导航栏
│   │   ├── ToastContainer.tsx # 全局 Toast
│   │   └── Layout.tsx         # 页面布局包装
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── AuthCallback.tsx
│   ├── home/
│   │   ├── HomePage.tsx
│   │   ├── FolderGrid.tsx
│   │   ├── FolderCard.tsx    # 单个文件夹卡片
│   │   └── QuickNote.tsx     # Monaco + 预览编辑器
│   └── folder/
│       ├── FolderDetailPage.tsx
│       ├── Breadcrumb.tsx
│       ├── FileTable.tsx      # 文件表格
│       ├── FileRow.tsx        # 单行文件
│       ├── FileActions.tsx    # 操作下拉菜单
│       ├── BatchToolbar.tsx   # 批量操作栏
│       └── DropZoneOverlay.tsx # 上传遮罩层
├── pages/
│   ├── LoginPage.tsx          # 重导出 from components/auth
│   ├── HomePage.tsx           # 重导出 from components/home
│   └── FolderDetailPage.tsx   # 重导出 from components/folder
├── hooks/
│   ├── useAuth.ts             # 认证 hook
│   ├── useFiles.ts            # 文件操作 hook
│   ├── useNote.ts             # Quick Note hook
│   ├── useDropzone.ts         # react-dropzone 封装
│   ├── useUpload.ts           # 上传逻辑 hook
│   └── useToast.ts            # Toast hook
├── stores/
│   ├── authStore.ts
│   ├── fileStore.ts
│   ├── uiStore.ts
│   └── noteStore.ts
├── services/
│   ├── authService.ts
│   ├── graphService.ts
│   └── uploadService.ts
├── types/
│   └── index.ts               # 全局类型定义
├── utils/
│   ├── format.ts              # 文件大小、时间格式化
│   ├── folderColor.ts          # 文件夹颜色映射
│   └── constants.ts            # 常量（scopes, chunkSize 等）
└── assets/
    └── icons/                  # PWA 图标
public/
├── manifest.json
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── sw.js                      # Service Worker（vite-plugin-pwa 生成）
```

---

## 11. 关键技术决策

1. **PKCE vs 隐式流**：使用 PKCE（MSAL 3.x 默认），更安全
2. **Token 存储**：MSAL 内部使用 sessionStorage（适合单标签页 PWA）
3. **Monaco Editor 主题**：跟随 daisyUI 主题动态切换（`vs-dark` / `vs`）
4. **分片大小**：5 MiB（5,242,880 bytes），是 320 KiB（327,680）的 16 倍，符合 Graph API 要求
5. **Note 自动保存**：800ms debounce + editor onBlur，双重保障
6. **文件夹搜索**：纯客户端过滤，避免频繁 API 调用
7. **移动端适配**：Tailwind `sm:`/`md:`/`lg:` 断点 + daisyUI `table` 响应式类

---

## 12. 验收标准

- [ ] 用户可通过 Microsoft 账号成功登录 OneDrive
- [ ] 主页显示 /upload 下的所有子文件夹，4种固定文件夹有对应颜色
- [ ] Quick Note 可编辑并保存到 OneDrive `/upload/note.md`
- [ ] 文件夹详情页正确显示文件列表，支持排序和搜索
- [ ] 支持文件上传，>4MB 文件使用分片上传并显示进度
- [ ] 支持文件删除、重命名、下载操作
- [ ] PWA 可安装到桌面/手机主屏幕
- [ ] 离线时 UI 可用，文件操作提示联网
- [ ] 响应式布局，手机端体验良好
- [ ] TypeScript 严格模式无报错

---

*本文档由 Superpowers Brainstorm 工作流生成，版本：2026-03-29*
