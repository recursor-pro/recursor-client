export interface UserInfo {
  id: string;
  email: string;
  username: string;
  level: number;
  expireTime: string;
  dailyUsage: number;
}

// Access Key types for authentication
export interface AccessKeyInfo {
  id: string;
  name: string;
  maxRequests: number;
  currentRequests: number;
  expiresAt: Date | null;
  status: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  accessKey: AccessKeyInfo | null;
  loading: boolean;
  error: string | null;
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
  currentPlatform: "windows" | "macos" | "linux";
}

export interface HistoryRecord {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  status: "success" | "error" | "pending";
}

export interface Account {
  id: string;
  email: string;
  lastUsed: string;
  status: "active" | "inactive" | "expired";
}
