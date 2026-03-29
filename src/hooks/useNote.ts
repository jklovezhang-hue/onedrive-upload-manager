import { useCallback, useEffect, useRef } from 'react';
import { useNoteStore } from '@/stores/noteStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import {
  listNotes,
  getNoteContent,
  createNote,
  updateNoteContent,
  renameNote,
  deleteNote,
} from '@/services/graphService';
import { NOTE_CONFIG } from '@/utils/constants';

export function useNote() {
  const graphClient = useAuthStore((s) => s.graphClient);
  const {
    notes,
    activeNoteId,
    content,
    isDirty,
    isSaving,
    isLoading,
    setNotes,
    addNote,
    removeNote,
    updateNoteMeta,
    setActiveNoteId,
    setContent,
    loadContent,
    setLoading,
    setSaving,
    markSaved,
    setError,
  } = useNoteStore();
  const addToast = useUIStore((s) => s.addToast);

  const saveTimeoutRef = useRef<number | null>(null);

  // 加载笔记列表
  const fetchNotes = useCallback(async () => {
    if (!graphClient) return;
    setLoading(true);
    try {
      const items = await listNotes(graphClient);
      const mapped = items.map((item) => ({
        id: item.id,
        name: item.name.replace(/\.md$/, ''),
        lastModified: item.lastModifiedDateTime ?? '',
        size: item.size,
      }));
      setNotes(mapped);

      // 如果没有选中笔记，自动选中第一个
      if (!activeNoteId && mapped.length > 0) {
        setActiveNoteId(mapped[0].id);
      }
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      const msg = (error as Error).message ?? '';
      const display = statusCode ? `加载笔记列表失败 (${statusCode})` : `加载笔记列表失败: ${msg}`;
      console.error('[notes] fetchNotes error:', statusCode, msg, error);
      addToast({ type: 'error', message: display });
    } finally {
      setLoading(false);
    }
  }, [graphClient, setNotes, setLoading, addToast, activeNoteId, setActiveNoteId]);

  // 加载当前笔记内容
  const fetchNoteContent = useCallback(async (noteId: string) => {
    if (!graphClient) return;
    try {
      const text = await getNoteContent(graphClient, noteId);
      loadContent(text);
    } catch {
      loadContent('');
    }
  }, [graphClient, loadContent]);

  // 切换笔记
  const selectNote = useCallback(async (noteId: string) => {
    // 先保存当前笔记
    if (isDirty && activeNoteId) {
      await saveNote();
    }
    setActiveNoteId(noteId);
    await fetchNoteContent(noteId);
  }, [isDirty, activeNoteId, setActiveNoteId, fetchNoteContent]);

  // 创建新笔记
  const handleCreateNote = useCallback(async (name: string) => {
    if (!graphClient || !name.trim()) return;
    try {
      const item = await createNote(graphClient, name.trim(), `# ${name.trim()}\n\n`);
      const newNote = {
        id: item.id,
        name: name.trim(),
        lastModified: item.lastModifiedDateTime ?? new Date().toISOString(),
        size: item.size,
      };
      addNote(newNote);
      setActiveNoteId(item.id);
      loadContent(`# ${name.trim()}\n\n`);
      addToast({ type: 'success', message: `笔记「${name}」已创建` });
    } catch (error: unknown) {
      console.error('[notes] createNote error:', error);
      const msg = (error as Error).message ?? '';
      addToast({ type: 'error', message: `创建笔记失败: ${msg}` });
    }
  }, [graphClient, addNote, setActiveNoteId, loadContent, addToast]);

  // 保存当前笔记
  const saveNote = useCallback(async () => {
    if (!graphClient || !activeNoteId || !isDirty) return;

    setSaving(true);
    try {
      await updateNoteContent(graphClient, activeNoteId, content);
      markSaved();
    } catch (error: unknown) {
      console.error('[notes] saveNote error:', error);
      setError((error as Error).message ?? String(error));
      const msg = (error as Error).message ?? '';
      addToast({ type: 'error', message: `保存失败: ${msg}` });
    }
  }, [graphClient, activeNoteId, content, isDirty, setSaving, markSaved, setError, addToast]);

  // 重命名笔记
  const handleRenameNote = useCallback(async (noteId: string, newName: string) => {
    if (!graphClient || !newName.trim()) return;
    try {
      await renameNote(graphClient, noteId, newName.trim());
      updateNoteMeta(noteId, { name: newName.trim() });
      addToast({ type: 'success', message: `已重命名为「${newName}」` });
    } catch (error: unknown) {
      console.error('[notes] renameNote error:', error);
      addToast({ type: 'error', message: '重命名失败' });
    }
  }, [graphClient, updateNoteMeta, addToast]);

  // 删除笔记
  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (!graphClient) return;
    try {
      await deleteNote(graphClient, noteId);
      removeNote(noteId);
      addToast({ type: 'success', message: '笔记已删除' });

      // 如果删的是当前笔记，选第一个
      if (noteId === activeNoteId) {
        const remaining = notes.filter((n) => n.id !== noteId);
        if (remaining.length > 0) {
          setActiveNoteId(remaining[0].id);
          await fetchNoteContent(remaining[0].id);
        } else {
          setActiveNoteId(null);
          loadContent('');
        }
      }
    } catch (error: unknown) {
      console.error('[notes] deleteNote error:', error);
      addToast({ type: 'error', message: '删除失败' });
    }
  }, [graphClient, removeNote, notes, activeNoteId, setActiveNoteId, fetchNoteContent, loadContent, addToast]);

  // 内容变化
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, [setContent]);

  // 自动保存（debounce）
  useEffect(() => {
    if (!isDirty) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      saveNote();
    }, NOTE_CONFIG.autoSaveDelay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, saveNote]);

  return {
    notes,
    activeNoteId,
    content,
    isDirty,
    isSaving,
    isLoading,
    fetchNotes,
    fetchNoteContent,
    selectNote,
    handleCreateNote,
    handleRenameNote,
    handleDeleteNote,
    handleContentChange,
    saveNote,
  };
}
