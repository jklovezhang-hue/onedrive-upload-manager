import { useUIStore } from '@/stores/uiStore';
import { X, CheckCircle, AlertCircle, Info, Upload } from 'lucide-react';
import { formatFileSize } from '@/utils/format';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  uploading: Upload,
};

const colorMap = {
  success: 'alert-success',
  error: 'alert-error',
  info: 'alert-info',
  uploading: 'alert-info',
};

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast toast-end toast-bottom z-[100]">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div key={toast.id} className={`alert ${colorMap[toast.type]} shadow-lg flex-row items-start gap-3 min-w-[300px]`}>
            {/* 图标 */}
            <div className="shrink-0 mt-0.5">
              {toast.type === 'uploading' ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Icon className="w-5 h-5" />
              )}
            </div>

            {/* 内容 */}
            <div className="flex-1">
              <div className="text-sm font-medium">{toast.message}</div>

              {/* 上传进度条 */}
              {toast.type === 'uploading' && toast.progress !== undefined && (
                <div className="mt-2">
                  <progress
                    className="progress progress-info w-full"
                    value={toast.progress}
                    max="100"
                  />
                  <div className="flex justify-between text-xs mt-1 opacity-80">
                    <span>{toast.progress}%</span>
                    {toast.totalBytes && toast.uploadedBytes && (
                      <span>
                        {formatFileSize(toast.uploadedBytes)} / {formatFileSize(toast.totalBytes)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 关闭按钮 */}
            <button
              className="btn btn-ghost btn-xs btn-square shrink-0"
              onClick={() => removeToast(toast.id)}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}