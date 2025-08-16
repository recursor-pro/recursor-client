import { AccessKeyInfo, AuthState } from "../types";

const BASE_URL = "https://recursor.pro";
const AUTH_ENDPOINT = "/api/client/auth/login";
const SERVICE_ACCOUNT_ASSIGN_ENDPOINT = "/api/client/service-account/assign";

// Local storage keys
const STORAGE_KEYS = {
  ACCESS_KEY: "recursor_access_key",
  AUTH_STATE: "recursor_auth_state",
} as const;

export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    accessKey: null,
    loading: false,
    error: null,
  };
  private listeners: Array<(state: AuthState) => void> = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Subscribe to auth state changes
  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners of state changes
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.authState));
  }

  // Update auth state and notify listeners
  private updateState(updates: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...updates };
    this.notifyListeners();
  }

  // Get current auth state
  public getState(): AuthState {
    return { ...this.authState };
  }

  // Load auth state from localStorage
  private loadFromStorage(): void {
    try {
      const storedKey = localStorage.getItem(STORAGE_KEYS.ACCESS_KEY);
      const storedState = localStorage.getItem(STORAGE_KEYS.AUTH_STATE);

      if (storedKey && storedState) {
        const accessKey: AccessKeyInfo = JSON.parse(storedKey);
        const authState: Partial<AuthState> = JSON.parse(storedState);

        // Check if key is still valid (not expired)
        const isExpired =
          accessKey.expiresAt && new Date(accessKey.expiresAt) < new Date();

        if (!isExpired) {
          this.updateState({
            isAuthenticated: true,
            accessKey,
            loading: false,
            error: null,
            ...authState,
          });
        } else {
          // Clear expired key
          this.clearStorage();
        }
      }
    } catch (error) {
      console.error("Failed to load auth state from storage:", error);
      this.clearStorage();
    }
  }

  // Save auth state to localStorage
  private saveToStorage(): void {
    try {
      if (this.authState.accessKey) {
        localStorage.setItem(
          STORAGE_KEYS.ACCESS_KEY,
          JSON.stringify(this.authState.accessKey)
        );
        localStorage.setItem(
          STORAGE_KEYS.AUTH_STATE,
          JSON.stringify({
            isAuthenticated: this.authState.isAuthenticated,
            loading: this.authState.loading,
            error: this.authState.error,
          })
        );
      }
    } catch (error) {
      console.error("Failed to save auth state to storage:", error);
    }
  }

  // Clear storage
  private clearStorage(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_KEY);
    localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
  }

  // Activate access key
  public async activateKey(keyId: string): Promise<void> {
    this.updateState({ loading: true, error: null });

    try {
      const response = await fetch(`${BASE_URL}${AUTH_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const accessKey: AccessKeyInfo = await response.json();

      this.updateState({
        isAuthenticated: true,
        accessKey,
        loading: false,
        error: null,
      });

      this.saveToStorage();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to activate key";
      this.updateState({
        isAuthenticated: false,
        accessKey: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  // Logout - clear auth state
  public logout(): void {
    this.updateState({
      isAuthenticated: false,
      accessKey: null,
      loading: false,
      error: null,
    });
    this.clearStorage();
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated && this.authState.accessKey !== null;
  }

  // Get access key info
  public getAccessKey(): AccessKeyInfo | null {
    return this.authState.accessKey;
  }

  // Get masked key for display
  public getMaskedKey(): string {
    if (!this.authState.accessKey) return "";
    const key = this.authState.accessKey.id;
    if (key.length <= 8) return key;
    return (
      key.substring(0, 4) +
      "*".repeat(key.length - 8) +
      key.substring(key.length - 4)
    );
  }

  // Get usage percentage
  public getUsagePercentage(): number {
    if (!this.authState.accessKey) return 0;
    const { currentRequests, maxRequests } = this.authState.accessKey;
    return Math.round((currentRequests / maxRequests) * 100);
  }

  // Check if key is expired
  public isExpired(): boolean {
    if (!this.authState.accessKey?.expiresAt) return false;
    return new Date(this.authState.accessKey.expiresAt) < new Date();
  }

  // Get formatted expiry date
  public getFormattedExpiry(): string {
    if (!this.authState.accessKey?.expiresAt) return "Never";
    const expiry = new Date(this.authState.accessKey.expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} days`;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours} hours`;

    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} minutes`;
  }

  // Copy key to clipboard
  public async copyKeyToClipboard(): Promise<void> {
    if (!this.authState.accessKey) return;

    try {
      await navigator.clipboard.writeText(this.authState.accessKey.id);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = this.authState.accessKey.id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  }

  // Validate current access key by making an API call
  public async validateAccessKey(): Promise<boolean> {
    if (!this.authState.accessKey) {
      return false;
    }

    try {
      // Use the auth endpoint to validate the key
      const response = await fetch(`${BASE_URL}${AUTH_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyId: this.authState.accessKey.id }),
      });

      if (!response.ok) {
        // Key is invalid or expired
        return false;
      }

      const accessKey: AccessKeyInfo = await response.json();

      // Update the access key info with fresh data
      this.updateState({
        isAuthenticated: true,
        accessKey,
        loading: false,
        error: null,
      });

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error("Failed to validate access key:", error);
      return false;
    }
  }

  // Validate and auto-logout if invalid
  public async validateAndLogoutIfInvalid(): Promise<boolean> {
    if (!this.authState.accessKey) {
      return false;
    }

    // Check if key is expired locally first
    if (this.isExpired()) {
      this.logout();
      return false;
    }

    // Validate with server
    const isValid = await this.validateAccessKey();
    if (!isValid) {
      this.logout();
      return false;
    }

    return true;
  }

  // Get service account for quick change
  public async getServiceAccount(): Promise<{ email: string; token: string }> {
    if (!this.authState.accessKey) {
      throw new Error("No authenticated access key found");
    }

    try {
      // Use the service account assignment API
      const response = await window.electronAPI.apiRequest({
        url: `${BASE_URL}${SERVICE_ACCOUNT_ASSIGN_ENDPOINT}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyId: this.authState.accessKey.id }),
      });

      if (response.status !== 200) {
        const errorMsg =
          response.data?.error ||
          response.data?.message ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      const serviceAccountData = response.data;
      if (
        !serviceAccountData?.serviceAccount?.email
      ) {
        throw new Error("Invalid service account response - missing email");
      }

      // Token can be null, so we need to handle that case
      const token = serviceAccountData.serviceAccount.token;
      if (!token) {
        throw new Error("Service account has no token available");
      }

      return {
        email: serviceAccountData.serviceAccount.email,
        token: token,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to get service account";
      throw new Error(errorMessage);
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
