import { useState, useRef, useEffect, useCallback } from 'react';
import { MoreVertical, Download, Trash2, Edit3, X, Check } from 'lucide-react';
import type { DriveItem } from '@/types';

interface FileActionsProps {
  item: DriveItem;
  onDownload?: (item: DriveItem) => void;
  onDelete?: (item: DriveItem) => void;
  onRename?: (item: DriveItem, newName: string) => void;
}

export default function FileActions({ item, onDownload, onDelete, onRename }: FileActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 点击 ⋮ 按钮：记录按钮位置，弹出菜单
  const handleTriggerClick = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setIsOpen(true);
  }, [isOpen]);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // ESC 关闭
  useEffect(() => {
    if (!isOpen && !isRenaming) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRenaming) {
          setNewName(item.name);
          setIsRenaming(false);
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, isRenaming, item.name]);

  // 重命名时自动聚焦
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    const trimmed = newName.trim();
    if (trimmed && trimmed !== item.name && onRename) {
      onRename(item, trimmed);
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameSubmit();
  };

  const handleDelete = () => {
    setIsOpen(false);
    if (window.confirm(`确定删除 "${item.name}" 吗？此操作不可恢复。`)) {
      onDelete?.(item);
    }
  };

  // 重命名态：隐藏菜单，显示行内输入框
  if (isRenaming) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleRenameKeyDown}
          onBlur={handleRenameSubmit}
          className="input input-bordered input-xs w-36"
        />
        <button className="btn btn-ghost btn-xs btn-square" onClick={handleRenameSubmit} title="确认">
          <Check className="w-3 h-3 text-success" />
        </button>
        <button
          className="btn btn-ghost btn-xs btn-square"
          onClick={() => { setNewName(item.name); setIsRenaming(false); }}
          title="取消"
        >
          <X className="w-3 h-3 text-error" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* ⋮ 触发按钮 */}
      <button
        ref={triggerRef}
        className="btn btn-ghost btn-xs btn-square"
        onClick={handleTriggerClick}
        title="更多操作"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* 固定定位浮出菜单 */}
      {isOpen && (
        <div
          ref={menuRef}
          className="menu bg-base-100 rounded-xl shadow-xl border border-base-300 w-44 py-1 z-[200] fixed"
          style={{ top: menuPos.top, right: menuPos.right }}
          onClick={(e) => e.stopPropagation()}
        >
          {onDownload && (
            <button
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-sm"
              onClick={() => { onDownload(item); setIsOpen(false); }}
            >
              <Download className="w-4 h-4 text-base-content/60" />
              下载
            </button>
          )}

          {onRename && (
            <button
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-base-200 transition-colors text-sm"
              onClick={() => { setIsRenaming(true); setIsOpen(false); }}
            >
              <Edit3 className="w-4 h-4 text-base-content/60" />
              重命名
            </button>
          )}

          {onDelete && (
            <>
              <div className="divider my-1" />
              <button
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-error/10 transition-colors text-sm text-error"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
