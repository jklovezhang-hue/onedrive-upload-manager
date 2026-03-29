import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folders, RefreshCw, Loader2, Plus } from 'lucide-react';
import { useFileStore } from '@/stores/fileStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { listUploadFolders, ensureUploadFolder, getUploadFolderId, createSubfolder } from '@/services/graphService';
import FolderCard from './FolderCard';
import type { DriveItem, FolderColorKey } from '@/types';
import { FOLDER_COLORS } from '@/utils/folderColor';

export default function FolderGrid() {
  const navigate = useNavigate();
  const graphClient = useAuthStore((s) => s.graphClient);
  const folderList = useFileStore((s) => s.folderList);
  const setFolderList = useFileStore((s) => s.setFolderList);
  const isLoading = useFileStore((s) => s.isLoading);
  const setLoading = useFileStore((s) => s.setLoading);
  const addToast = useUIStore((s) => s.addToast);

  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState<FolderColorKey>('blue');

  // 颜色选项（从 utils/folderColor 导入的固定映射中取）
  const colorOptions: FolderColorKey[] = ['blue', 'green', 'purple', 'orange', 'gray'];

  const fetchFolders = async () => {
    if (!graphClient) return;
    setLoading(true);
    try {
      await ensureUploadFolder(graphClient);
      const folders = await listUploadFolders(graphClient);
      setFolderList(folders);
    } catch (error) {
      console.error('获取文件夹列表失败:', error);
      addToast({ type: 'error', message: '获取文件夹列表失败，请刷新重试' });
    } finally {
      setLoading(false);
    }
  };

  // 创建文件夹
  const handleCreateFolder = async () => {
    if (!graphClient || !newFolderName.trim()) return;
    setIsCreating(true);
    try {
      const uploadId = await getUploadFolderId(graphClient);
      await createSubfolder(graphClient, uploadId, newFolderName.trim());
      addToast({ type: 'success', message: `文件夹 "${newFolderName}" 创建成功` });
      setShowCreateModal(false);
      setNewFolderName('');
      setSelectedColor('blue');
      await fetchFolders();
    } catch (error) {
      console.error('创建文件夹失败:', error);
      addToast({ type: 'error', message: '创建文件夹失败，请重试' });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    fetchFolders();

    const handleUploadDone = () => fetchFolders();
    window.addEventListener('folder-uploaded', handleUploadDone);
    return () => window.removeEventListener('folder-uploaded', handleUploadDone);
  }, [graphClient]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFolders();
    setRefreshing(false);
  };

  const handleFolderClick = (folder: DriveItem) => {
    navigate(`/folder/${folder.id}`);
  };

  if (isLoading && folderList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-base-content/60">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folders className="w-5 h-5 text-base-content/60" />
          <h2 className="text-lg font-semibold">文件夹</h2>
          <span className="badge badge-ghost badge-sm">{folderList.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm gap-1"
            onClick={() => setShowCreateModal(true)}
            title="新建文件夹"
          >
            <Plus className="w-4 h-4" />
            新建文件夹
          </button>
          <button
            className="btn btn-ghost btn-sm gap-1"
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 文件夹网格 */}
      {folderList.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-4">
            <Folders className="w-8 h-8 text-base-content/40" />
          </div>
          <h3 className="text-lg font-medium text-base-content/60 mb-2">暂无文件夹</h3>
          <p className="text-sm text-base-content/40 mb-6">点击上方「新建文件夹」按钮创建</p>
          <button
            className="btn btn-primary gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            新建文件夹
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {folderList.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onClick={() => handleFolderClick(folder)}
            />
          ))}
        </div>
      )}

      {/* 创建文件夹 Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setShowCreateModal(false)}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg mb-4">新建文件夹</h3>

            {/* 文件夹名称 */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">文件夹名称</span>
              </label>
              <input
                type="text"
                placeholder="例如：文件存储"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                className="input input-bordered"
                autoFocus
              />
            </div>

            {/* 颜色选择 */}
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text">文件夹颜色</span>
              </label>
              <div className="flex gap-3">
                {colorOptions.map((key) => {
                  const color = FOLDER_COLORS[key];
                  return (
                    <button
                      key={key}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        selectedColor === key
                          ? `ring-2 ring-offset-2 ring-${color.iconBgColor.replace('bg-', '')} scale-110`
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: getComputedColor(key) }}
                      onClick={() => setSelectedColor(key)}
                      title={key}
                    />
                  );
                })}
              </div>
              <label className="label">
                <span className="label-text-alt text-base-content/50">
                  颜色仅用于界面显示，不会改变 OneDrive 中的文件夹属性
                </span>
              </label>
            </div>

            {/* 按钮 */}
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isCreating}
              >
                {isCreating ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : null}
                创建
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)} />
        </div>
      )}
    </div>
  );
}

// 根据 FolderColorKey 返回实际颜色值（用于 inline style）
function getComputedColor(key: FolderColorKey): string {
  const map: Record<FolderColorKey, string> = {
    blue: '#3b82f6',
    green: '#22c55e',
    purple: '#a855f7',
    orange: '#f97316',
    gray: '#6b7280',
  };
  return map[key];
}
