import { File, Folder } from 'lucide-react';
import type { DriveItem } from '@/types';
import { formatFileSize, formatDate, isFolder } from '@/utils/format';
import FileActions from './FileActions';

interface FileRowProps {
  item: DriveItem;
  onClick: () => void;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onDownload?: (item: DriveItem) => void;
  onDelete?: (item: DriveItem) => void;
  onRename?: (item: DriveItem, newName: string) => void;
}

export default function FileRow({
  item,
  onClick,
  selected,
  onSelect,
  onDownload,
  onDelete,
  onRename,
}: FileRowProps) {
  const folder = isFolder(item);

  return (
    <tr
      className={`hover:bg-base-200 cursor-pointer transition-colors ${
        selected ? 'bg-primary/5' : ''
      }`}
      onClick={onClick}
    >
      <td onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="checkbox checkbox-sm checkbox-primary"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(!selected);
          }}
        />
      </td>
      <td>
        {folder ? (
          <Folder className="w-5 h-5 text-amber-500" />
        ) : (
          <File className="w-5 h-5 text-base-content/50" />
        )}
      </td>
      <td className="font-medium max-w-[200px] truncate" title={item.name}>
        {item.name}
      </td>
      <td className="text-base-content/60 text-sm hidden sm:table-cell">
        {folder ? '文件夹' : item.file?.mimeType ?? '-'}
      </td>
      <td className="text-base-content/60 text-sm hidden md:table-cell">
        {item.lastModifiedDateTime ? formatDate(item.lastModifiedDateTime) : '-'}
      </td>
      <td className="text-base-content/60 text-sm hidden sm:table-cell">
        {item.size !== undefined ? formatFileSize(item.size) : '-'}
      </td>
      <td onClick={(e) => e.stopPropagation()}>
        <FileActions
          item={item}
          onDownload={onDownload}
          onDelete={onDelete}
          onRename={onRename}
        />
      </td>
    </tr>
  );
}
