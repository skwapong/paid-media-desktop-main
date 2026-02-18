/**
 * IPC handlers for extended TD CDP API operations.
 *
 * Provides access to segment details, journeys, and activations
 * via the Treasure Data CDP REST API. Uses the same settings store
 * pattern as settings-handlers for reading API credentials, and
 * makes authenticated HTTP requests to TD endpoints.
 */

import { IpcMain, app } from 'electron';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { IPC_CHANNELS, AppSettings } from '../utils/ipc-types';

// ---------- Settings helpers ----------

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings(): AppSettings {
  try {
    const data = fs.readFileSync(getSettingsPath(), 'utf-8');
    return { theme: 'system', ...JSON.parse(data) };
  } catch {
    return { theme: 'system' };
  }
}

// ---------- HTTP helpers ----------

interface TdApiResponse {
  statusCode: number;
  body: string;
}

/**
 * Make an authenticated GET request to the TD CDP REST API.
 * Uses the `Authorization: TD1 <apiKey>` header format.
 */
function tdApiGet(endpoint: string, apiKey: string, baseUrl: string): Promise<TdApiResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);

    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        Authorization: `TD1 ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 500,
          body: Buffer.concat(chunks).toString('utf-8'),
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

/**
 * Validate that the required TD API settings are present and return them.
 */
function getTdApiConfig(): {
  valid: boolean;
  apiKey?: string;
  endpoint?: string;
  error?: string;
} {
  const settings = loadSettings();
  const apiKey = settings.tdxApiKey;
  const endpoint = settings.tdxEndpoint || 'https://api.treasuredata.com';

  if (!apiKey) {
    return {
      valid: false,
      error: 'TD API key is not configured. Please set it in Settings.',
    };
  }

  return { valid: true, apiKey, endpoint };
}

// ---------- Setup ----------

export function setupTdApiHandlers(ipcMain: IpcMain): void {
  /**
   * Get detailed information about a specific segment.
   *
   * Expects: { parentSegmentId: string; segmentId: string }
   */
  ipcMain.handle(
    IPC_CHANNELS.TD_SEGMENT_DETAILS,
    async (
      _event,
      payload: { parentSegmentId: string; segmentId: string }
    ): Promise<{ success: boolean; data?: any; error?: string }> => {
      const config = getTdApiConfig();
      if (!config.valid) {
        return { success: false, error: config.error };
      }

      try {
        const { parentSegmentId, segmentId } = payload;
        const response = await tdApiGet(
          `/audiences/${encodeURIComponent(parentSegmentId)}/segments/${encodeURIComponent(segmentId)}`,
          config.apiKey!,
          config.endpoint!
        );

        if (response.statusCode >= 400) {
          console.error(
            `[TD API] Segment details request failed (${response.statusCode}):`,
            response.body
          );
          return {
            success: false,
            error: `TD API returned status ${response.statusCode}: ${response.body}`,
          };
        }

        const data = JSON.parse(response.body);
        return { success: true, data };
      } catch (error: any) {
        console.error('[TD API] Failed to fetch segment details:', error);
        return {
          success: false,
          error: error.message || 'Failed to fetch segment details from TD API',
        };
      }
    }
  );

  /**
   * List journeys from the TD CDP.
   *
   * Expects: { limit?: number; offset?: number } (optional pagination)
   */
  ipcMain.handle(
    IPC_CHANNELS.TD_JOURNEYS,
    async (
      _event,
      payload?: { limit?: number; offset?: number }
    ): Promise<{ success: boolean; data?: any; error?: string }> => {
      const config = getTdApiConfig();
      if (!config.valid) {
        return { success: false, error: config.error };
      }

      try {
        const limit = payload?.limit || 50;
        const offset = payload?.offset || 0;

        const response = await tdApiGet(
          `/journeys?limit=${limit}&offset=${offset}`,
          config.apiKey!,
          config.endpoint!
        );

        if (response.statusCode >= 400) {
          console.error(
            `[TD API] Journeys request failed (${response.statusCode}):`,
            response.body
          );
          return {
            success: false,
            error: `TD API returned status ${response.statusCode}: ${response.body}`,
          };
        }

        const data = JSON.parse(response.body);
        return { success: true, data };
      } catch (error: any) {
        console.error('[TD API] Failed to fetch journeys:', error);
        return {
          success: false,
          error: error.message || 'Failed to fetch journeys from TD API',
        };
      }
    }
  );

  /**
   * List activations (syndications) for a given segment.
   *
   * Expects: { parentSegmentId: string; segmentId: string }
   */
  ipcMain.handle(
    IPC_CHANNELS.TD_ACTIVATIONS,
    async (
      _event,
      payload: { parentSegmentId: string; segmentId: string }
    ): Promise<{ success: boolean; data?: any; error?: string }> => {
      const config = getTdApiConfig();
      if (!config.valid) {
        return { success: false, error: config.error };
      }

      try {
        const { parentSegmentId, segmentId } = payload;
        const response = await tdApiGet(
          `/audiences/${encodeURIComponent(parentSegmentId)}/segments/${encodeURIComponent(segmentId)}/activations`,
          config.apiKey!,
          config.endpoint!
        );

        if (response.statusCode >= 400) {
          console.error(
            `[TD API] Activations request failed (${response.statusCode}):`,
            response.body
          );
          return {
            success: false,
            error: `TD API returned status ${response.statusCode}: ${response.body}`,
          };
        }

        const data = JSON.parse(response.body);
        return { success: true, data };
      } catch (error: any) {
        console.error('[TD API] Failed to fetch activations:', error);
        return {
          success: false,
          error: error.message || 'Failed to fetch activations from TD API',
        };
      }
    }
  );
}
