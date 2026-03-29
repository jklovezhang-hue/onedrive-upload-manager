// MSAL 配置常量
// 优先使用环境变量（构建时注入），否则使用 window.location.origin（运行时动态）
const getOrigin = () => {
  // 生产构建时 VITE_REDIRECT_URI 已注入
  if (import.meta.env.VITE_REDIRECT_URI) {
    return import.meta.env.VITE_REDIRECT_URI;
  }
  // 开发时或 fallback
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
};

export const MSAL_CONFIG = {
  clientId: 'ae6ceb41-6cf4-4bcf-89a2-7ca49b8fb417',
  authority: 'https://login.microsoftonline.com/consumers',
  redirectUri: getOrigin(),
  postLogoutRedirectUri: `${getOrigin()}/login`,
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