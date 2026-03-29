import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useFileStore } from '@/stores/fileStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { listFolderChildren, getDownloadUrl, deleteItem, renameItem } from '@/services/graphService';
import type { DriveItem } from '@/types';
import FileRow from './FileRow';

interface FileTableProps {
  folderId: string;
  onFolderClick: (folder: DriveItem) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export default function FileTable({
  folderId,
  onFolderClick,
  selectedIds,
  onSelectionChange,
}: FileTableProps) {
  const graphClient = useAuthStore((s) => s.graphClient);
  const files = useFileStore((s) => s.files);
  const setFiles = useFileStore((s) => s.setFiles);
  const updateFile = useFileStore((s) => s.updateFile);
  const isLoading = useFileStore((s) => s.isLoading);
  const setLoading = useFileStore((s) => s.setLoading);
  const addToast = useUIStore((s) => s.addToast);

  const fetchFiles = async () => {
    if (!graphClient) return;
    setLoading(true);
    try {
      const items = await listFolderChildren(graphClient, folderId);
      setFiles(items);
    } catch {
      addToast({ type: 'error', message: '获取文件列表失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [folderId, graphClient]);

  const handleSelect = (id: string, selected: boolean) => {
    const next = new Set(selectedIds);
    if (selected) {
      next.add(id);
    } else {
      next.delete(id);
    }
    onSelectionChange(next);
  };

  const handleRowClick = (item: DriveItem) => {
    if (item.folder) {
      onFolderClick(item);
    }
  };

  // 下载
  const handleDownload = async (item: DriveItem) => {
    if (!graphClient) return;
    try {
      const url = await getDownloadUrl(graphClient, item.id);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      a.click();
      addToast({ type: 'success', message: `开始下载 ${item.name}` });
    } catch {
      addToast({ type: 'error', message: `下载 ${item.name} 失败` });
    }
  };

  // 删除
  const handleDelete = async (item: DriveItem) => {
    if (!graphClient) return;
    try {
      await deleteItem(graphClient, item.id);
      setFiles(files.filter((f) => f.id !== item.id));
      addToast({ type: 'success', message: `已删除 ${item.name}` });
    } catch {
      addToast({ type: 'error', message: `删除 ${item.name} 失败` });
    }
  };

  // 重命名
  const handleRename = async (item: DriveItem, newName: string) => {
    if (!graphClient) return;
    try {
      const updated = await renameItem(graphClient, item.id, newName);
      updateFile(item.id, { name: newName });
      addToast({ type: 'success', message: `已重命名为 ${newName}` });
    } catch {
      addToast({ type: 'error', message: '重命名失败' });
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
      <table className="table table-sm">
        <thead>
          <tr className="border-base-300">
            <th style={{ width: '40px' }}>
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={files.length > 0 && files.every((f) => selectedIds.has(f.id))}
                onChange={(e) => {
                  if (e.target.checked) {
                    onSelectionChange(new Set(files.map((f) => f.id)));
                  } else {
                    onSelectionChange(new Set());
                  }
                }}
              />
            </th>
            <th style={{ width: '40px' }} />
            <th>文件名</th>
            <th className="hidden sm:table-cell">类型</th>
            <th className="hidden md:table-cell">修改时间</th>
            <th className="hidden sm:table-cell">大小</th>
            <th style={{ width: '60px' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {files.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-base-content/50">
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
                onDownload={handleDownload}
                onDelete={handleDelete}
                onRename={handleRename}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
