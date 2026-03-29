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