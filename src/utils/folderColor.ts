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