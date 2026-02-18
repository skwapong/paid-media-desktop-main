/**
 * IPC handlers for platform connection management.
 *
 * Manages connections to ad platforms (Meta, Google, TikTok).
 * Currently implemented as stubs with in-memory state and mock data.
 * These will be replaced with real OAuth flows and API calls.
 */

import { IpcMain } from 'electron';
import { IPC_CHANNELS, PlatformType, PlatformConnection } from '../utils/ipc-types';

// In-memory store for platform connection state
const connections: Record<PlatformType, PlatformConnection> = {
  meta: { platform: 'meta', connected: false },
  google: { platform: 'google', connected: false },
  tiktok: { platform: 'tiktok', connected: false },
};

export function setupPlatformHandlers(ipcMain: IpcMain): void {
  /**
   * Connect to an ad platform.
   *
   * Expects: { platform: PlatformType, credentials: Record<string, string> }
   * In production this would initiate an OAuth flow; for now it stores mock state.
   */
  ipcMain.handle(
    IPC_CHANNELS.PLATFORM_CONNECT,
    async (
      _event,
      payload: { platform: PlatformType; credentials?: Record<string, string> }
    ): Promise<{ success: boolean; connection?: PlatformConnection; error?: string }> => {
      try {
        const { platform, credentials } = payload;

        if (!connections[platform]) {
          return { success: false, error: `Unknown platform: ${platform}` };
        }

        // Simulate a connection delay
        await delay(500);

        const mockAccountNames: Record<PlatformType, string> = {
          meta: 'TD Paid Media Ad Account',
          google: 'TD Google Ads Account',
          tiktok: 'TD TikTok Ads Account',
        };

        const mockAccountIds: Record<PlatformType, string> = {
          meta: credentials?.adAccountId || 'act_123456789',
          google: credentials?.customerId || '123-456-7890',
          tiktok: credentials?.advertiserId || '7000000000000',
        };

        connections[platform] = {
          platform,
          connected: true,
          accountName: mockAccountNames[platform],
          accountId: mockAccountIds[platform],
          lastSyncedAt: new Date().toISOString(),
        };

        console.log(`[Platforms] Connected to ${platform}: ${connections[platform].accountName}`);
        return { success: true, connection: connections[platform] };
      } catch (error: any) {
        console.error('[Platforms] Failed to connect:', error);
        return { success: false, error: error.message || 'Failed to connect to platform' };
      }
    }
  );

  /**
   * Disconnect from an ad platform.
   */
  ipcMain.handle(
    IPC_CHANNELS.PLATFORM_DISCONNECT,
    async (
      _event,
      platform: PlatformType
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        if (!connections[platform]) {
          return { success: false, error: `Unknown platform: ${platform}` };
        }

        connections[platform] = { platform, connected: false };
        console.log(`[Platforms] Disconnected from ${platform}`);
        return { success: true };
      } catch (error: any) {
        console.error('[Platforms] Failed to disconnect:', error);
        return { success: false, error: error.message || 'Failed to disconnect from platform' };
      }
    }
  );

  /**
   * Get connection status for one or all platforms.
   *
   * Expects: platform?: PlatformType (if omitted, returns all)
   */
  ipcMain.handle(
    IPC_CHANNELS.PLATFORM_STATUS,
    async (
      _event,
      platform?: PlatformType
    ): Promise<{
      success: boolean;
      data?: PlatformConnection | Record<PlatformType, PlatformConnection>;
      error?: string;
    }> => {
      try {
        if (platform) {
          if (!connections[platform]) {
            return { success: false, error: `Unknown platform: ${platform}` };
          }
          return { success: true, data: connections[platform] };
        }
        return { success: true, data: { ...connections } };
      } catch (error: any) {
        console.error('[Platforms] Failed to get status:', error);
        return { success: false, error: error.message || 'Failed to get platform status' };
      }
    }
  );

  /**
   * Sync an audience/segment to a connected platform.
   *
   * Expects: { platform: PlatformType, audienceId: string, audienceName: string }
   * Returns mock sync result.
   */
  ipcMain.handle(
    IPC_CHANNELS.PLATFORM_SYNC_AUDIENCE,
    async (
      _event,
      payload: { platform: PlatformType; audienceId: string; audienceName: string }
    ): Promise<{
      success: boolean;
      data?: { syncId: string; status: string; matchRate: number };
      error?: string;
    }> => {
      try {
        const { platform, audienceId, audienceName } = payload;

        if (!connections[platform]?.connected) {
          return {
            success: false,
            error: `Platform ${platform} is not connected. Please connect first.`,
          };
        }

        // Simulate sync delay
        await delay(1000);

        const syncResult = {
          syncId: `sync_${platform}_${Date.now()}`,
          status: 'completed',
          matchRate: Math.round((0.55 + Math.random() * 0.35) * 100) / 100, // 55-90%
        };

        // Update last sync timestamp
        connections[platform].lastSyncedAt = new Date().toISOString();

        console.log(
          `[Platforms] Synced audience "${audienceName}" (${audienceId}) to ${platform} — match rate: ${syncResult.matchRate}`
        );

        return { success: true, data: syncResult };
      } catch (error: any) {
        console.error('[Platforms] Failed to sync audience:', error);
        return { success: false, error: error.message || 'Failed to sync audience' };
      }
    }
  );

  /**
   * Get performance metrics from a connected platform.
   *
   * Expects: { platform: PlatformType, dateRange?: { start: string; end: string } }
   * Returns mock metrics.
   */
  ipcMain.handle(
    IPC_CHANNELS.PLATFORM_METRICS,
    async (
      _event,
      payload: { platform: PlatformType; dateRange?: { start: string; end: string } }
    ): Promise<{
      success: boolean;
      data?: {
        impressions: number;
        clicks: number;
        spend: number;
        conversions: number;
        ctr: number;
        cpc: number;
        roas: number;
      };
      error?: string;
    }> => {
      try {
        const { platform } = payload;

        if (!connections[platform]?.connected) {
          return {
            success: false,
            error: `Platform ${platform} is not connected. Please connect first.`,
          };
        }

        // Simulate API delay
        await delay(300);

        // Generate plausible mock metrics
        const impressions = Math.floor(50000 + Math.random() * 450000);
        const clicks = Math.floor(impressions * (0.01 + Math.random() * 0.04));
        const spend = Math.round((500 + Math.random() * 9500) * 100) / 100;
        const conversions = Math.floor(clicks * (0.02 + Math.random() * 0.08));

        const metrics = {
          impressions,
          clicks,
          spend,
          conversions,
          ctr: Math.round((clicks / impressions) * 10000) / 100,
          cpc: Math.round((spend / clicks) * 100) / 100,
          roas: Math.round(((conversions * 50) / spend) * 100) / 100,
        };

        return { success: true, data: metrics };
      } catch (error: any) {
        console.error('[Platforms] Failed to get metrics:', error);
        return { success: false, error: error.message || 'Failed to get platform metrics' };
      }
    }
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
