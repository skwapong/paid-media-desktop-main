import { BrowserWindow, ipcMain } from 'electron';
import { setupSettingsHandlers } from './settings-handlers';
import { setupWindowHandlers } from './window-handlers';
import { setupChatHandlers } from './chat-handlers';
import { setupBlueprintHandlers } from './blueprint-handlers';
import { setupPdfHandlers } from './pdf-handlers';
import { setupPlatformHandlers } from './platform-handlers';
import { setupTdApiHandlers } from './td-api-handlers';

export function setupIPCHandlers(mainWindow: BrowserWindow): void {
  setupSettingsHandlers(ipcMain);
  setupWindowHandlers(mainWindow);
  setupChatHandlers(mainWindow);
  setupBlueprintHandlers(ipcMain);
  setupPdfHandlers(ipcMain);
  setupPlatformHandlers(ipcMain);
  setupTdApiHandlers(ipcMain);
}
