import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus, FileText, Trash2, Clock } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useNote } from '@/hooks/useNote';
import { useUIStore } from '@/stores/uiStore';
import { formatDateTime } from '@/utils/format';

export default function QuickNote() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNoteName, setNewNoteName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const editorRef = useRef<unknown>(null);
  const darkMode = useUIStore((s) => s.darkMode);

  const {
    notes,
    activeNoteId,
    content,
    isDirty,
    isSaving,
    isLoading,
    fetchNotes,
    selectNote,
    handleCreateNote,
    handleRenameNote,
    handleDeleteNote,
    handleContentChange,
  } = useNote();

  // darkMode 响应式
  useEffect(() => {
    if (editorRef.current) {
      (editorRef.current as { updateOptions: (o: { theme: string }) => void }).updateOptions({
        theme: darkMode ? 'vs-dark' : 'vs',
      });
    }
  }, [darkMode]);

  // 展开时加载笔记列表
  useEffect(() => {
    if (isOpen && notes.length === 0) {
      fetchNotes();
    }
  }, [isOpen]);

  const handleCreate = () => {
    const name = newNoteName.trim();
    if (!name) return;
    handleCreateNote(name);
    setNewNoteName('');
    setShowCreateModal(false);
  };

  const activeNote = notes.find((n) => n.id === activeNoteId);

  return (
    <div className="card bg-base-100">
      {/* 收起/展开头 */}
      <button
        className="card-body p-4 flex flex-row items-center gap-2 hover:bg-base-200 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-primary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-primary rotate-[-90deg]" />
        )}
        <FileText className="w-5 h-5 text-primary" />
        <span className="font-semibold">快速笔记</span>
        {isDirty && <span className="badge badge-warning badge-xs">未保存</span>}
        {isSaving && (
          <span className="ml-auto text-xs text-primary flex items-center gap-1">
            <span className="loading loading-spinner loading-xs" />
            保存中
          </span>
        )}
        {notes.length > 0 && !isDirty && !isSaving && (
          <span className="ml-auto text-xs text-base-content/40">
            {notes.length} 篇笔记
          </span>
        )}
      </button>

      {isOpen && (
        <div className="border-t border-base-300">
          <div className="flex h-[420px]">
            {/* ── 左侧笔记列表 ── */}
            <div className="w-52 border-r border-base-300 flex flex-col bg-base-200/30">
              {/* 新建按钮 */}
              <div className="p-2 border-b border-base-300">
                <button
                  className="btn btn-primary btn-sm w-full gap-1"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  新建笔记
                </button>
              </div>

              {/* 笔记列表 */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="loading loading-spinner loading-sm text-primary" />
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-8 px-3">
                    <p className="text-xs text-base-content/40">暂无笔记</p>
                    <p className="text-xs text-base-content/30 mt-1">点击上方按钮创建</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className={`group px-3 py-2.5 cursor-pointer border-b border-base-300/50 transition-colors ${
                        note.id === activeNoteId
                          ? 'bg-primary/10 border-l-2 border-l-primary'
                          : 'hover:bg-base-200'
                      }`}
                      onClick={() => selectNote(note.id)}
                    >
                      <div className="flex items-start gap-2">
                        <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${note.id === activeNoteId ? 'text-primary' : 'text-base-content/40'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${note.id === activeNoteId ? 'text-primary' : ''}`}>
                            {note.name}
                          </p>
                          <p className="text-[10px] text-base-content/40 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {note.lastModified
                              ? formatDateTime(note.lastModified)
                              : '-'}
                          </p>
                        </div>
                        {/* 删除按钮（hover 显示） */}
                        {deleteConfirmId === note.id ? (
                          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="btn btn-xs btn-error"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              确认
                            </button>
                            <button
                              className="btn btn-xs btn-ghost"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(note.id); }}
                            title="删除笔记"
                          >
                            <Trash2 className="w-3 h-3 text-error" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── 右侧编辑器 ── */}
            <div className="flex-1 flex flex-col min-w-0">
              {activeNote ? (
                <>
                  {/* 编辑器顶部：笔记名 + 保存状态 */}
                  <div className="px-4 py-2 border-b border-base-300 flex items-center gap-2 shrink-0">
                    <span className="font-medium text-sm truncate">{activeNote.name}</span>
                    {isDirty && <span className="badge badge-warning badge-xs">未保存</span>}
                    {isSaving && <span className="loading loading-spinner loading-xs text-primary" />}
                    {!isDirty && !isSaving && (
                      <span className="text-xs text-base-content/40 ml-auto">
                        已保存
                      </span>
                    )}
                  </div>

                  {/* Monaco Editor */}
                  <div className="flex-1 overflow-hidden">
                    <Editor
                      height="100%"
                      defaultLanguage="markdown"
                      value={content}
                      onChange={(val) => handleContentChange(val ?? '')}
                      onMount={(editor) => { editorRef.current = editor; }}
                      theme={darkMode ? 'vs-dark' : 'vs'}
                      options={{
                        minimap: { enabled: false },
                        wordWrap: 'on',
                        lineNumbers: 'off',
                        folding: false,
                        fontSize: 14,
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                    <p className="text-base-content/50 text-sm">选择一篇笔记开始编辑</p>
                    <p className="text-base-content/30 text-xs mt-1">或点击左上角「新建笔记」</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 新建笔记 Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => { setShowCreateModal(false); setNewNoteName(''); }}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg mb-4">新建笔记</h3>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">笔记名称</span>
              </label>
              <input
                type="text"
                placeholder="例如：工作备忘"
                value={newNoteName}
                onChange={(e) => setNewNoteName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="input input-bordered"
                autoFocus
              />
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => { setShowCreateModal(false); setNewNoteName(''); }}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!newNoteName.trim()}>
                创建
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => { setShowCreateModal(false); setNewNoteName(''); }} />
        </div>
      )}
    </div>
  );
}
