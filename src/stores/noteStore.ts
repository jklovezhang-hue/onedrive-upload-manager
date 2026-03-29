import { create } from 'zustand';
import type { DriveItem } from '@/types';

export interface Note {
  id: string;
  name: string;           // 文件名（不含 .md）
  lastModified: string;   // ISO 字符串
  size?: number;
}

interface NoteState {
  notes: Note[];          // 所有笔记列表
  activeNoteId: string | null;
  content: string;       // 当前笔记内容
  originalContent: string;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // actions
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  removeNote: (noteId: string) => void;
  updateNoteMeta: (noteId: string, updates: Partial<Note>) => void;
  setActiveNoteId: (noteId: string | null) => void;
  setContent: (content: string) => void;
  loadContent: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  markSaved: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  activeNoteId: null,
  content: '',
  originalContent: '',
  isDirty: false,
  isLoading: false,
  isSaving: false,
  error: null,

  setNotes: (notes) => set({ notes }),

  addNote: (note) =>
    set((state) => ({
      notes: [note, ...state.notes],
    })),

  removeNote: (noteId) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== noteId),
      activeNoteId: state.activeNoteId === noteId ? null : state.activeNoteId,
      content: state.activeNoteId === noteId ? '' : state.content,
      originalContent: state.activeNoteId === noteId ? '' : state.originalContent,
    })),

  updateNoteMeta: (noteId, updates) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === noteId ? { ...n, ...updates } : n)),
    })),

  setActiveNoteId: (noteId) => set({ activeNoteId: noteId }),

  setContent: (content) => {
    const { originalContent } = get();
    set({ content, isDirty: content !== originalContent });
  },

  loadContent: (content) => {
    set({ content, originalContent: content, isDirty: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setSaving: (saving) => set({ isSaving: saving }),

  markSaved: () => {
    const { content, notes, activeNoteId } = get();
    const now = new Date().toISOString();
    set({
      originalContent: content,
      isDirty: false,
      isSaving: false,
      error: null,
      notes: notes.map((n) => (n.id === activeNoteId ? { ...n, lastModified: now } : n)),
    });
  },

  setError: (error) => set({ error, isSaving: false }),

  reset: () =>
    set({
      notes: [],
      activeNoteId: null,
      content: '',
      originalContent: '',
      isDirty: false,
      isLoading: false,
      isSaving: false,
      error: null,
    }),
}));
