import { IpcMain, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { IPC_CHANNELS, AppSettings } from '../utils/ipc-types';
import { claudeAgentClient } from '../services/claude-agent-client';

const execAsync = promisify(exec);

const DEFAULT_LLM_PROXY_URL = 'https://llm-proxy.us01.treasuredata.com';

// Persist settings to disk so they survive restarts
function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettingsFromDisk(): AppSettings {
  try {
    const data = fs.readFileSync(getSettingsPath(), 'utf-8');
    return { theme: 'system', ...JSON.parse(data) };
  } catch {
    return { theme: 'system' };
  }
}

function saveSettingsToDisk(settings: AppSettings): void {
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Settings] Failed to save settings to disk:', err);
  }
}

let settings: AppSettings = loadSettingsFromDisk();

// Initialize SDK on startup if API key is already configured
if (settings.apiKey) {
  claudeAgentClient.init({
    apiKey: settings.apiKey,
    llmProxyUrl: settings.llmProxyUrl || DEFAULT_LLM_PROXY_URL,
    model: settings.model || undefined,
    workingDirectory: settings.workingDirectory,
  }).then(() => {
    console.log('[Settings] Claude Agent SDK client initialized from saved settings');
  }).catch((err) => {
    console.error('[Settings] Failed to initialize SDK client:', err);
  });
}

export function setupSettingsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.TEST_CONNECTION, async () => {
    return claudeAgentClient.testConnection();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, newSettings: Partial<AppSettings>) => {
    const prevApiKey = settings.apiKey;
    const prevLlmProxyUrl = settings.llmProxyUrl;
    const prevModel = settings.model;

    // Trim URL fields to prevent trailing-space issues
    if (newSettings.llmProxyUrl) newSettings.llmProxyUrl = newSettings.llmProxyUrl.trim();
    if (newSettings.tdxEndpoint) newSettings.tdxEndpoint = newSettings.tdxEndpoint.trim();
    settings = { ...settings, ...newSettings };
    saveSettingsToDisk(settings);

    // Reinitialize the Claude Agent SDK client when AI config changes
    const aiConfigChanged =
      settings.apiKey !== prevApiKey ||
      settings.llmProxyUrl !== prevLlmProxyUrl ||
      settings.model !== prevModel;

    if (aiConfigChanged && settings.apiKey) {
      await claudeAgentClient.init({
        apiKey: settings.apiKey,
        llmProxyUrl: settings.llmProxyUrl || DEFAULT_LLM_PROXY_URL,
        model: settings.model || undefined,
        workingDirectory: settings.workingDirectory,
      });
      console.log('[Settings] Claude Agent SDK client reinitialized');
    }
  });

  ipcMain.handle(IPC_CHANNELS.PARENT_SEGMENTS_LIST, async () => {
    try {
      const { stdout } = await execAsync('tdx ps list');

      const lines = stdout.split('\n').filter(line => line.trim().startsWith('👥'));

      const parentSegments = lines.map((line) => {
        const cleanLine = line.replace('👥', '').trim();

        const countMatch = cleanLine.match(/\(([\d.]+[KM]?)\)$/);
        const count = countMatch ? countMatch[1] : null;
        const name = count ? cleanLine.substring(0, cleanLine.lastIndexOf('(')).trim() : cleanLine;

        return {
          id: name,
          name,
          count,
          description: '',
        };
      });

      return { success: true, data: parentSegments };
    } catch (error: any) {
      console.error('[ParentSegments] Error fetching parent segments:', error);

      if (error.message?.includes('command not found') || error.message?.includes('tdx')) {
        return {
          success: false,
          error: 'Treasure Data CLI (tdx) is not installed or configured. Please run: npm install -g @td-sdk/cli && tdx auth setup',
        };
      }

      return {
        success: false,
        error: 'Failed to fetch parent segments from Treasure Data',
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PARENT_SEGMENT_CHILDREN, async (_event, parentSegmentName: string) => {
    try {
      // Set parent segment context, then list child segments
      await execAsync(`tdx ps use "${parentSegmentName.replace(/"/g, '\\"')}"`);
      const { stdout } = await execAsync('tdx sg list');

      // Parse lines starting with 🎯 (child segment entries)
      const lines = stdout.split('\n').filter(line => line.trim().startsWith('🎯'));

      const childSegments: Array<{ id: string; name: string; count: string | null; description: string }> = [];
      for (const line of lines) {
        const cleanLine = line.replace('🎯', '').trim();
        if (!cleanLine) continue;

        // Format: "Segment Name (count)" or "Segment Name (-)"
        const countMatch = cleanLine.match(/\(([\d.]+[KM]?)\)$/);
        const count = countMatch ? countMatch[1] : null;
        const name = countMatch
          ? cleanLine.substring(0, cleanLine.lastIndexOf('(')).trim()
          : cleanLine.replace(/\(-\)$/, '').trim();

        if (name) {
          childSegments.push({
            id: name,
            name,
            count,
            description: '',
          });
        }
      }

      return { success: true, data: childSegments };
    } catch (error: any) {
      console.error('[ParentSegmentChildren] Error fetching child segments:', error);

      if (error.message?.includes('command not found')) {
        return {
          success: false,
          error: 'Treasure Data CLI (tdx) is not installed or configured. Please run: npm install -g @td-sdk/cli && tdx auth setup',
        };
      }

      return {
        success: false,
        error: `Failed to fetch child segments for "${parentSegmentName}": ${error.message || 'Unknown error'}`,
      };
    }
  });
}
