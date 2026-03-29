import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Folder, Upload } from 'lucide-react';
import type { DriveItem } from '@/types';
import { getColorForFolder } from '@/utils/folderColor';
import { formatRelativeTime } from '@/utils/format';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { uploadFile } from '@/services/uploadService';

interface FolderCardProps {
  folder: DriveItem;
  onClick: () => void;
}

export default function FolderCard({ folder, onClick }: FolderCardProps) {
  const colors = getColorForFolder(folder);
  const childCount = folder.folder?.childCount ?? 0;
  const graphClient = useAuthStore((s) => s.graphClient);
  const addToast = useUIStore((s) => s.addToast);
  const updateToast = useUIStore((s) => s.updateToast);

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (!graphClient) return;

      for (const file of files) {
        const toastId = addToast({
          type: 'uploading',
          message: `上传中: ${file.name}`,
          progress: 0,
          totalBytes: file.size,
          uploadedBytes: 0,
        });

        try {
          await uploadFile(graphClient, folder.id, file, (progress) => {
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

      // 上传完成后派发自定义事件，通知 FolderGrid 刷新
      window.dispatchEvent(new CustomEvent('folder-uploaded', { detail: { folderId: folder.id } }));
    },
    [graphClient, folder.id, addToast, updateToast]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleUpload(acceptedFiles);
      }
    },
    [handleUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />

      {/* 拖拽悬停时整卡片视觉反馈 */}
      <div
        onClick={onClick}
        className={`card bg-base-100 cursor-pointer transition-all duration-200 border-2 ${
          colors.borderColor
        } ${
          isDragActive
            ? `border-primary bg-primary/5 shadow-xl scale-[1.02] ${colors.borderColor}`
            : 'hover:shadow-xl hover:-translate-y-1'
        }`}
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        {/* 拖拽悬停时的全卡片上传遮罩 */}
        {isDragActive && (
          <div className="absolute inset-0 bg-primary/10 rounded-2xl flex flex-col items-center justify-center z-10 animate-pulse pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
              <Upload className="w-8 h-8 text-primary scale-110" />
            </div>
            <span className="text-sm font-medium text-primary">释放以上传</span>
          </div>
        )}

        <div className="card-body p-5">
          {/* 图标 */}
          <div
            className={`w-14 h-14 rounded-2xl ${colors.iconBgColor} flex items-center justify-center mb-4`}
          >
            <Folder className="w-8 h-8 text-white" />
          </div>

          {/* 文件夹名 */}
          <h3
            className={`font-semibold text-base ${colors.textColor} truncate`}
            title={folder.name}
          >
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
    </div>
  );
}
