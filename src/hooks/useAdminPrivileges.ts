import { useState, useEffect, useCallback } from "react";
import {
  getAdminPrivilegesInfo,
  ensureAdminPrivileges,
  type AdminPrivilegesInfo,
  type AdminPrivilegesResult,
} from "../api";

interface UseAdminPrivilegesReturn {
  adminInfo: AdminPrivilegesInfo | null;
  loading: boolean;
  error: string | null;
  showModal: boolean;
  checkPrivileges: () => Promise<void>;
  ensurePrivileges: () => Promise<AdminPrivilegesResult>;
  dismissModal: () => void;
  setShowModal: (show: boolean) => void;
}

export const useAdminPrivileges = (): UseAdminPrivilegesReturn => {
  const [adminInfo, setAdminInfo] = useState<AdminPrivilegesInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hasCheckedOnStartup, setHasCheckedOnStartup] = useState(false);

  const checkPrivileges = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const info = await getAdminPrivilegesInfo();
      setAdminInfo(info);

      // Show modal if admin is required but not available
      if (
        info.isAdminRequired &&
        !info.hasAdminPrivileges &&
        !hasCheckedOnStartup
      ) {
        setShowModal(true);
      }

      setHasCheckedOnStartup(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to check admin privileges";
      setError(errorMessage);
      console.error("❌ Admin privileges check failed:", err);
    } finally {
      setLoading(false);
    }
  }, [hasCheckedOnStartup]);

  const ensurePrivileges =
    useCallback(async (): Promise<AdminPrivilegesResult> => {
      try {
        const result = await ensureAdminPrivileges();

        // Refresh admin info after ensuring privileges
        await checkPrivileges();

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to ensure admin privileges";
        setError(errorMessage);
        throw err;
      }
    }, [checkPrivileges]);

  const dismissModal = useCallback(() => {
    setShowModal(false);
  }, []);

  // Check privileges on mount
  useEffect(() => {
    checkPrivileges();
  }, [checkPrivileges]);

  return {
    adminInfo,
    loading,
    error,
    showModal,
    checkPrivileges,
    ensurePrivileges,
    dismissModal,
    setShowModal,
  };
};

// Utility hook for components that need to ensure admin privileges before operations
export const useEnsureAdminPrivileges = () => {
  const { ensurePrivileges, adminInfo } = useAdminPrivileges();

  const ensureAdminForOperation = useCallback(
    async (operationName?: string): Promise<boolean> => {
      try {
        const result = await ensurePrivileges();

        if (!result.success) {
          console.warn(
            `Admin privileges required for ${operationName || "operation"}: ${result.error}`
          );
          return false;
        }

        return true;
      } catch (error) {
        console.error(
          `Failed to ensure admin privileges for ${operationName || "operation"}:`,
          error
        );
        return false;
      }
    },
    [ensurePrivileges]
  );

  return {
    ensureAdminForOperation,
    hasAdminPrivileges: adminInfo?.hasAdminPrivileges ?? false,
    isAdminRequired: adminInfo?.isAdminRequired ?? false,
    adminInfo,
  };
};
