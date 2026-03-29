import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { useFileStore } from '@/stores/fileStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { getDriveItem, deleteItem, listFolderChildren } from '@/services/graphService';
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
  const removeFile = useFileStore((s) => s.removeFile);
  const addToast = useUIStore((s) => s.addToast);
  const updateToast = useUIStore((s) => s.updateToast);

  const [showDropZone, setShowDropZone] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);

  // 加载当前文件夹内容
  const fetchFiles = useCallback(async () => {
    if (!graphClient || !folderId) return;
    try {
      const items = await listFolderChildren(graphClient, folderId);
      useFileStore.getState().setFiles(items);
    } catch {
      addToast({ type: 'error', message: '获取文件列表失败' });
    }
  }, [graphClient, folderId, addToast]);

  // 加载文件夹信息
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
    // 先清空
    setCurrentFolder(null);
  }, [folderId, graphClient, setCurrentFolder]);

  // 上传完成回调
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
        } catch {
          updateToast(toastId, { type: 'error', message: `${file.name} 上传失败` });
        }
      }

      // 上传完成后重新获取文件列表
      await fetchFiles();
      // 通知主页刷新
      window.dispatchEvent(new CustomEvent('folder-uploaded', { detail: { folderId } }));
    },
    [graphClient, folderId, addToast, updateToast, fetchFiles]
  );

  // 拖拽监控
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
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) {
        handleFilesDropped(files);
      }
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
  }, [handleFilesDropped]);

  const handleFolderClick = (folder: DriveItem) => {
    navigate(`/folder/${folder.id}`);
  };

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
      } catch {
        addToast({ type: 'error', message: '删除失败' });
      }
    }
    setSelectedIds(new Set());
  };

  const breadcrumbItems = currentFolder ? [{ name: currentFolder.name }] : [];

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

      {/* 固定上传按钮 */}
      {folderId && (
        <label className="btn btn-primary btn-circle btn-lg shadow-xl cursor-pointer fixed bottom-6 right-6 z-40">
          <Upload className="w-6 h-6" />
          <input
            type="file"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) {
                setIsUploading(true);
                await handleFilesDropped(files);
                setIsUploading(false);
              }
              e.target.value = '';
            }}
          />
        </label>
      )}
    </div>
  );
}
