import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface DropZoneOverlayProps {
  folderName: string;
  onFilesDropped: (files: File[]) => void;
  onClose: () => void;
}

export default function DropZoneOverlay({ folderName, onFilesDropped, onClose }: DropZoneOverlayProps) {
  const addToast = useUIStore((s) => s.addToast);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesDropped(acceptedFiles);
        onClose();
      }
    },
    [onFilesDropped, onClose]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  return (
    <div
      {...getRootProps()}
      className="fixed inset-0 z-50 bg-blue-500/10 border-4 border-dashed border-blue-500 flex items-center justify-center"
    >
      <input {...getInputProps()} />

      <div className="bg-base-100 rounded-2xl shadow-2xl p-8 text-center max-w-md mx-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          {isDragActive ? (
            <Upload className="w-8 h-8 text-primary animate-bounce" />
          ) : (
            <Upload className="w-8 h-8 text-primary" />
          )}
        </div>

        <h3 className="text-xl font-semibold mb-2">
          {isDragActive ? '释放以上传' : '拖拽文件到这里'}
        </h3>
        <p className="text-base-content/60 mb-4">
          上传到 <span className="font-medium text-base-content">{folderName}</span>
        </p>

        <button
          className="btn btn-ghost btn-sm gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="w-4 h-4" />
          取消
        </button>
      </div>
    </div>
  );
}