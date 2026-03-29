import { Download, Trash2, X } from 'lucide-react';

interface BatchToolbarProps {
  selectedCount: number;
  onDownload: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export default function BatchToolbar({
  selectedCount,
  onDownload,
  onDelete,
  onClear,
}: BatchToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary text-primary-content rounded-lg p-3 flex items-center gap-4">
      <span className="font-medium">
        已选择 <span className="badge badge-outline badge-sm ml-1">{selectedCount}</span> 项
      </span>

      <div className="flex-1" />

      <button className="btn btn-ghost btn-sm gap-1 text-primary-content hover:bg-primary-focus" onClick={onDownload}>
        <Download className="w-4 h-4" />
        批量下载
      </button>

      <button className="btn btn-ghost btn-sm gap-1 text-primary-content hover:bg-primary-focus" onClick={onDelete}>
        <Trash2 className="w-4 h-4" />
        批量删除
      </button>

      <button className="btn btn-ghost btn-sm btn-square" onClick={onClear}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}