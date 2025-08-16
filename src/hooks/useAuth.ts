import { useState, useEffect } from "react";
import { authService } from "../services/authService";
import { AuthState } from "../types";

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authService.getState());

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe(setAuthState);

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const activateKey = async (keyId: string) => {
    try {
      await authService.activateKey(keyId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to activate key",
      };
    }
  };

  const logout = () => {
    authService.logout();
  };

  const validateAndLogoutIfInvalid = async () => {
    try {
      return await authService.validateAndLogoutIfInvalid();
    } catch (error) {
      console.error("Failed to validate access key:", error);
      return false;
    }
  };

  const copyKey = async () => {
    try {
      await authService.copyKeyToClipboard();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Failed to copy key to clipboard",
      };
    }
  };

  const getServiceAccount = async () => {
    try {
      const accountData = await authService.getServiceAccount();
      return { success: true, data: accountData };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get account",
      };
    }
  };

  const switchAccount = async (options: {
    email: string;
    token: string;
    forceKill?: boolean;
  }) => {
    try {
      const result = await window.electronAPI.switchCursorAccount(options);
      return { success: true, message: result };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to switch account",
      };
    }
  };

  return {
    // State
    ...authState,

    // Computed values
    isAuthenticated: authService.isAuthenticated(),
    maskedKey: authService.getMaskedKey(),
    usagePercentage: authService.getUsagePercentage(),
    isExpired: authService.isExpired(),
    formattedExpiry: authService.getFormattedExpiry(),

    // Actions
    activateKey,
    logout,
    copyKey,
    getServiceAccount,
    switchAccount,
    validateAndLogoutIfInvalid,
  };
}
