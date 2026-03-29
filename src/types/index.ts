// Microsoft Graph API 类型扩展
// 注意：@microsoft/microsoft-graph-client 已自带完整类型定义，无需手动扩展

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