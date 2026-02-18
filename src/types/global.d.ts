import type { PaidMediaSuiteAPI } from '../../electron/preload';

declare global {
  interface Window {
    paidMediaSuite: PaidMediaSuiteAPI;
  }
}
