export interface UserInfo {
  id: string;
  email: string;
  username: string;
  level: number;
  expireTime: string;
  dailyUsage: number;
}

export interface CursorUserInfo {
  email: string;
  username: string;
  plan: string;
}

export interface CursorUsageInfo {
  advancedModel: {
    used: number;
    limit: number;
  };
  normalModel: {
    used: number;
    limit: number;
  };
}

export interface DeviceInfo {
  machineId: string;
  currentAccount: string;
  cursorToken: string;
  hookStatus: boolean | null;
  cursorRunning?: boolean;
}

export interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export interface ThemeConfig {
  isDark: boolean;
}

export interface AppState {
  isLoading: boolean;
  currentPlatform: 'windows' | 'macos' | 'linux';
}

export interface HistoryRecord {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  status: 'success' | 'error' | 'pending';
}

export interface Account {
  id: string;
  email: string;
  lastUsed: string;
  status: 'active' | 'inactive' | 'expired';
}

// Electron API types
declare global {
  interface Window {
    electronAPI: {
      // Cursor reset APIs
      resetCursor: (options: Record<string, never>) => Promise<{
        success: boolean;
        message: string;
        details?: {
          kill: string;
          reset: string;
          clean: string;
          restore: string;
        };
      }>;
      getCursorPaths: () => Promise<any>;
      killCursorProcesses: () => Promise<string>;
      resetMachineIds: (forceKill?: boolean, customDeviceId?: string) => Promise<string>;
      cleanDatabase: (paths: any) => Promise<string>;
      restoreMainJs: (paths: any) => Promise<string>;
      // Device info APIs
      getMachineIds: () => Promise<{
        machineId: string;
        currentAccount: string;
        cursorToken: string;
      }>;
      checkHookStatus: () => Promise<boolean | null>;
      checkCursorRunning: () => Promise<boolean>;
      getCursorToken: () => Promise<string>;
    };
  }
}
