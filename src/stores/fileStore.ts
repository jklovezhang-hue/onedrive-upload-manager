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
  fetchFolderList: () => Promise<void>;
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

  // fetchFolderList 由组件层实现（依赖 graphClient），此处仅作空函数占位
  // 实际刷新由 FolderGrid 组件内部的 fetchFolders 处理
  fetchFolderList: async () => {},
}));