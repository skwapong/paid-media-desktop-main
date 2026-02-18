import { create } from 'zustand';

export interface ParentSegment {
  id: string;
  name: string;
  count: string | null;
  description: string;
  masterTable?: string;
}

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  loadSettings: () => Promise<void>;

  // Parent segments (shared across Layout and wizard)
  parentSegments: ParentSegment[];
  selectedParentSegmentId: string | null;
  isLoadingParentSegments: boolean;
  parentSegmentError: string | null;
  fetchParentSegments: () => Promise<void>;
  selectParentSegment: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'system',

  setTheme: (theme) => {
    set({ theme });
  },

  loadSettings: async () => {
    // Settings will be loaded from electron main process via IPC
    // For now, use defaults
    set({ theme: 'system' });
  },

  // Parent segments
  parentSegments: [],
  selectedParentSegmentId: null,
  isLoadingParentSegments: false,
  parentSegmentError: null,

  fetchParentSegments: async () => {
    console.log('🔍 fetchParentSegments called');

    // Skip if already loaded or currently loading
    const currentState = get();
    console.log('📊 Current state:', {
      parentSegmentsCount: currentState.parentSegments.length,
      isLoading: currentState.isLoadingParentSegments,
    });

    if (currentState.parentSegments.length > 0 || currentState.isLoadingParentSegments) {
      console.log('⏭️ Skipping fetch (already loaded or loading)');
      return;
    }

    // Guard: paidMediaSuite API may not be available outside Electron
    console.log('🔌 Checking for paidMediaSuite API...');
    console.log('window.paidMediaSuite available:', !!window.paidMediaSuite);
    console.log('window.paidMediaSuite.settings available:', !!window.paidMediaSuite?.settings);

    const api = window.paidMediaSuite?.settings;
    if (!api) {
      console.warn('⚠️ Parent segments API not available - this is expected outside Electron');
      set({ parentSegmentError: 'Parent segments API is not available', isLoadingParentSegments: false });
      return;
    }

    console.log('✅ API available, fetching parent segments...');
    set({ isLoadingParentSegments: true, parentSegmentError: null });

    try {
      // Load saved settings to restore previous selection
      console.log('📥 Loading saved settings...');
      const savedSettings = await api.get();
      const savedSelectionId = (savedSettings as Record<string, unknown>)?.selectedParentSegmentId as string | undefined;
      console.log('💾 Saved selection ID:', savedSelectionId);

      console.log('🌐 Calling api.parentSegments()...');
      const result = await api.parentSegments();
      console.log('📦 API result:', {
        success: result.success,
        dataLength: result.data?.length,
        error: result.error,
      });

      if (result.success && result.data) {
        // Restore saved selection if it exists in the fetched segments, otherwise default to first
        const hasMatch = savedSelectionId && result.data.some((s: ParentSegment) => s.id === savedSelectionId);
        console.log('✅ Parent segments loaded:', {
          count: result.data.length,
          savedSelectionMatches: hasMatch,
          selectedId: hasMatch ? savedSelectionId : (result.data.length > 0 ? result.data[0].id : null),
        });

        set({
          parentSegments: result.data,
          selectedParentSegmentId: hasMatch ? savedSelectionId! : (result.data.length > 0 ? result.data[0].id : null),
          isLoadingParentSegments: false,
        });
      } else {
        const errorMsg = result.error || 'Failed to load parent segments';
        console.error('❌ API returned error:', errorMsg);
        set({
          parentSegmentError: errorMsg,
          isLoadingParentSegments: false,
        });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load parent segments';
      console.error('❌ Exception in fetchParentSegments:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
      set({ parentSegmentError: msg, isLoadingParentSegments: false });
    }
  },

  selectParentSegment: (id: string) => {
    set({ selectedParentSegmentId: id });
    // Persist selection to disk so it survives restarts
    window.paidMediaSuite?.settings?.set({ selectedParentSegmentId: id });
  },
}));
