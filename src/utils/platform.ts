/**
 * Platform detection utilities
 */
export function isMac(): boolean {
  return window.paidMediaSuite?.platform === 'darwin';
}

export function isWindows(): boolean {
  return window.paidMediaSuite?.platform === 'win32';
}
