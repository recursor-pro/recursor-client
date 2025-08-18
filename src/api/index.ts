// Main API export file for Cursor Reset Tool
// Provides a single entry point for all types and utilities

// Export all types
export type {
  CursorPaths,
  ResetOptions,
  ResetResult,
  MachineIds,
  SwitchAccountOptions,
  ApiRequestOptions,
  ApiResponse,
  HookOptions,
  HookResult,
  PathValidationResult,
  CursorProcessInfo,
  DatabaseCleanupResult,
  CursorResetError,
  OperationStatus,
  OperationResult,
  IpcChannelName,
  AdminPrivilegesInfo,
  AdminPrivilegesResult,
  ExportResult,
} from "../types/ipcTypes";

// Export IPC channel constants
export { IPC_CHANNELS } from "../types/ipcTypes";

// Export all utility functions
export {
  // Main reset functionality
  resetCursor,
  getCursorPaths,
  killCursorProcesses,
  resetMachineIds,
  cleanDatabase,
  restoreMainJs,

  // Device info
  getMachineIds,
  checkHookStatus,
  checkCursorRunning,
  getCursorToken,

  // Account management
  switchCursorAccount,

  // Hook/Injection management
  hookMainJs,
  restoreHook,

  // Advanced path management
  getRunningCursorPath,
  validateCursorPath,
  findMainJsFromPath,

  // Database cleanup
  cleanupDatabaseEntries,

  // Admin privileges
  checkAdminPrivileges,
  requestAdminPrivileges,
  isAdminRequired,
  getAdminPrivilegesInfo,
  ensureAdminPrivileges,

  // API proxy
  apiRequest,

  // Utility functions
  isHookApplied,
  isCursorRunning,
  getCurrentMachineInfo,
  getCursorProcessInfo,
  executeOperation,

  // Combined operations
  fullReset,
  safeHookApply,
  safeHookRestore,

  // Export functionality
  exportCursorData,
} from "../utils/ipcUtils";

// Import types from the correct module
import type { ResetOptions, ResetResult } from "../types/ipcTypes";

// Export Electron API types
export type { ElectronAPI } from "../types/electron";

// Version info
export const VERSION = "1.0.0";
export const FEATURES = {
  HOOK_MANAGEMENT: true,
  ADVANCED_PATH_MANAGEMENT: true,
  DATABASE_CLEANUP: true,
  ACCOUNT_SWITCHING: true,
  MACHINE_ID_RESET: true,
  PROCESS_MANAGEMENT: true,
} as const;

// Feature detection
export function getAvailableFeatures() {
  return Object.entries(FEATURES)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature);
}

// Environment detection
export function isElectronEnvironment(): boolean {
  return (
    typeof window !== "undefined" && typeof window.electronAPI !== "undefined"
  );
}

// Quick health check
export async function healthCheck(): Promise<{
  electron: boolean;
  paths: boolean;
  cursor: boolean;
}> {
  const electron = isElectronEnvironment();

  if (!electron) {
    return { electron: false, paths: false, cursor: false };
  }

  try {
    // Use the window.electronAPI directly for health check
    const paths = await window.electronAPI.getCursorPaths();
    const cursor = await window.electronAPI.checkCursorRunning();

    return {
      electron: true,
      paths: !!paths.storage && !!paths.database,
      cursor,
    };
  } catch {
    return { electron: true, paths: false, cursor: false };
  }
}

// Convenience functions for common workflows
export async function quickReset(
  options: ResetOptions = {}
): Promise<ResetResult> {
  if (!isElectronEnvironment()) {
    throw new Error("Not in Electron environment");
  }
  return window.electronAPI.resetCursor(options);
}

export async function quickHookApply(forceKill = true): Promise<string> {
  if (!isElectronEnvironment()) {
    throw new Error("Not in Electron environment");
  }
  return window.electronAPI.hookMainJs(forceKill);
}

export async function quickHookRestore(forceKill = true): Promise<string> {
  if (!isElectronEnvironment()) {
    throw new Error("Not in Electron environment");
  }
  return window.electronAPI.restoreHook(forceKill);
}
