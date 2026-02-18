/**
 * Blueprint Store — Zustand store for campaign blueprint management.
 * Handles CRUD, versioning, and localStorage persistence.
 */

import { create } from 'zustand';
import type { Blueprint } from '../../electron/utils/ipc-types';

const STORAGE_KEY = 'paid-media-blueprints';

interface BlueprintState {
  blueprints: Blueprint[];
  selectedBlueprintId: string | null;
  isLoading: boolean;

  // Actions
  loadBlueprints: () => void;
  addBlueprints: (blueprints: Omit<Blueprint, 'createdAt' | 'updatedAt' | 'version'>[]) => void;
  updateBlueprint: (id: string, updates: Partial<Blueprint>) => void;
  deleteBlueprint: (id: string) => void;
  selectBlueprint: (id: string | null) => void;
  getBlueprint: (id: string) => Blueprint | undefined;
  clearAll: () => void;
}

function loadFromStorage(): Blueprint[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToStorage(blueprints: Blueprint[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprints));
  } catch (e) {
    console.error('[BlueprintStore] Failed to save to localStorage:', e);
  }
}

export const useBlueprintStore = create<BlueprintState>((set, get) => ({
  blueprints: [],
  selectedBlueprintId: null,
  isLoading: false,

  loadBlueprints: () => {
    const blueprints = loadFromStorage();
    set({ blueprints });
  },

  addBlueprints: (newBlueprints) => {
    const now = new Date().toISOString();
    const withMeta: Blueprint[] = newBlueprints.map((bp) => ({
      ...bp,
      createdAt: now,
      updatedAt: now,
      version: 1,
    }));

    set((state) => {
      const updated = [...state.blueprints, ...withMeta];
      saveToStorage(updated);
      return { blueprints: updated };
    });
  },

  updateBlueprint: (id, updates) => {
    set((state) => {
      const updated = state.blueprints.map((bp) =>
        bp.id === id
          ? {
              ...bp,
              ...updates,
              updatedAt: new Date().toISOString(),
              version: bp.version + 1,
            }
          : bp
      );
      saveToStorage(updated);
      return { blueprints: updated };
    });
  },

  deleteBlueprint: (id) => {
    set((state) => {
      const updated = state.blueprints.filter((bp) => bp.id !== id);
      saveToStorage(updated);
      return {
        blueprints: updated,
        selectedBlueprintId: state.selectedBlueprintId === id ? null : state.selectedBlueprintId,
      };
    });
  },

  selectBlueprint: (id) => {
    set({ selectedBlueprintId: id });
  },

  getBlueprint: (id) => {
    return get().blueprints.find((bp) => bp.id === id);
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ blueprints: [], selectedBlueprintId: null });
  },
}));
