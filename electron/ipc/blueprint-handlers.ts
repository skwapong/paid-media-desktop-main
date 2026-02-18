/**
 * IPC handlers for Blueprint CRUD operations.
 *
 * Blueprints are persisted as individual JSON files in the
 * user data directory under a `blueprints/` subfolder.
 */

import { IpcMain, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { IPC_CHANNELS, Blueprint } from '../utils/ipc-types';

function getBlueprintsDir(): string {
  const dir = path.join(app.getPath('userData'), 'blueprints');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function blueprintPath(id: string): string {
  // Sanitise the id to prevent directory traversal
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(getBlueprintsDir(), `${safeId}.json`);
}

export function setupBlueprintHandlers(ipcMain: IpcMain): void {
  /**
   * Save (create or update) a blueprint
   */
  ipcMain.handle(
    IPC_CHANNELS.BLUEPRINT_SAVE,
    async (_event, blueprint: Blueprint): Promise<{ success: boolean; error?: string }> => {
      try {
        const now = new Date().toISOString();
        const existing = loadBlueprint(blueprint.id);

        const toSave: Blueprint = {
          ...blueprint,
          createdAt: existing?.createdAt || blueprint.createdAt || now,
          updatedAt: now,
          version: existing ? (existing.version || 0) + 1 : blueprint.version || 1,
        };

        fs.writeFileSync(blueprintPath(toSave.id), JSON.stringify(toSave, null, 2), 'utf-8');
        console.log(`[Blueprints] Saved blueprint: ${toSave.id}`);
        return { success: true };
      } catch (error: any) {
        console.error('[Blueprints] Failed to save blueprint:', error);
        return { success: false, error: error.message || 'Failed to save blueprint' };
      }
    }
  );

  /**
   * List all saved blueprints (metadata only, sorted by updatedAt descending)
   */
  ipcMain.handle(
    IPC_CHANNELS.BLUEPRINT_LIST,
    async (): Promise<{ success: boolean; data?: Blueprint[]; error?: string }> => {
      try {
        const dir = getBlueprintsDir();
        const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

        const blueprints: Blueprint[] = [];
        for (const file of files) {
          try {
            const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
            blueprints.push(JSON.parse(raw) as Blueprint);
          } catch {
            // Skip malformed files
            console.warn(`[Blueprints] Skipping malformed file: ${file}`);
          }
        }

        // Sort newest first
        blueprints.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        return { success: true, data: blueprints };
      } catch (error: any) {
        console.error('[Blueprints] Failed to list blueprints:', error);
        return { success: false, error: error.message || 'Failed to list blueprints' };
      }
    }
  );

  /**
   * Get a single blueprint by ID
   */
  ipcMain.handle(
    IPC_CHANNELS.BLUEPRINT_GET,
    async (_event, id: string): Promise<{ success: boolean; data?: Blueprint; error?: string }> => {
      try {
        const blueprint = loadBlueprint(id);
        if (!blueprint) {
          return { success: false, error: `Blueprint not found: ${id}` };
        }
        return { success: true, data: blueprint };
      } catch (error: any) {
        console.error('[Blueprints] Failed to get blueprint:', error);
        return { success: false, error: error.message || 'Failed to get blueprint' };
      }
    }
  );

  /**
   * Delete a blueprint by ID
   */
  ipcMain.handle(
    IPC_CHANNELS.BLUEPRINT_DELETE,
    async (_event, id: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const filePath = blueprintPath(id);
        if (!fs.existsSync(filePath)) {
          return { success: false, error: `Blueprint not found: ${id}` };
        }
        fs.unlinkSync(filePath);
        console.log(`[Blueprints] Deleted blueprint: ${id}`);
        return { success: true };
      } catch (error: any) {
        console.error('[Blueprints] Failed to delete blueprint:', error);
        return { success: false, error: error.message || 'Failed to delete blueprint' };
      }
    }
  );

  /**
   * Export a blueprint as a JSON string (for file-save dialogs, clipboard, etc.)
   */
  ipcMain.handle(
    IPC_CHANNELS.BLUEPRINT_EXPORT,
    async (_event, id: string): Promise<{ success: boolean; data?: string; error?: string }> => {
      try {
        const blueprint = loadBlueprint(id);
        if (!blueprint) {
          return { success: false, error: `Blueprint not found: ${id}` };
        }
        return { success: true, data: JSON.stringify(blueprint, null, 2) };
      } catch (error: any) {
        console.error('[Blueprints] Failed to export blueprint:', error);
        return { success: false, error: error.message || 'Failed to export blueprint' };
      }
    }
  );
}

/**
 * Helper: load a single blueprint from disk, or return null if not found.
 */
function loadBlueprint(id: string): Blueprint | null {
  const filePath = blueprintPath(id);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as Blueprint;
  } catch {
    return null;
  }
}
