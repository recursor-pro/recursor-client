import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Zap,
  RotateCcw,
  Monitor,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/ToastContainer";
import KeyActivation from "../components/KeyActivation";
import UserKeyInfo from "../components/UserKeyInfo";
import QuickChange from "../components/QuickChange";
import { deviceService, type DeviceInfoState } from "../services/deviceService";
import { useAuth } from "../hooks/useAuth";
import { useEnsureAdminPrivileges } from "../hooks/useAdminPrivileges";

const DashboardView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoState>({
    machineId: "",
    currentAccount: "",
    cursorToken: "",
    hookStatus: null,
    cursorRunning: false,
  });

  // Use authentication hook
  const auth = useAuth();
  const toast = useToast();
  const { ensureAdminForOperation } = useEnsureAdminPrivileges();

  // State for confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
    loading?: boolean;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {
      // No-op function for initial state - actual handler set when dialog opens
    },
  });

  // Load device info and validate auth on component mount
  useEffect(() => {
    const loadDeviceInfo = async () => {
      try {
        setLoading(true);

        // Validate access key and auto-logout if invalid/expired
        if (auth.isAuthenticated) {
          const isValid = await auth.validateAndLogoutIfInvalid();
          if (!isValid) {
            toast.showError(
              "Authentication Failed",
              "Your access key has expired or is invalid. Please login again."
            );
            return;
          }
        }

        const info = await deviceService.getDeviceInfo();
        setDeviceInfo(info);
      } catch (error) {
        console.error("Failed to load device info:", error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    loadDeviceInfo();
  }, [auth.isAuthenticated]); // Re-run when auth state changes

  // Refresh device info and validate auth
  const handleRefreshDeviceInfo = async () => {
    try {
      setLoading(true);

      // Validate access key and auto-logout if invalid/expired
      if (auth.isAuthenticated) {
        const isValid = await auth.validateAndLogoutIfInvalid();
        if (!isValid) {
          toast.showError(
            "Authentication Failed",
            "Your access key has expired or is invalid. Please login again."
          );
          return;
        }
      }

      const info = await deviceService.refreshDeviceInfo();
      setDeviceInfo(info);
    } catch (error) {
      console.error("Failed to refresh device info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetCursor = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Confirm Cursor Reset",
      message:
        "This operation will:\n• Close all Cursor processes\n• Generate new Machine ID\n• Clear configuration and cache\n• Restore hooks to original state\n\nThis action cannot be undone.",
      variant: "warning",
      onConfirm: performCursorReset,
    });
  };

  const performCursorReset = async () => {
    try {
      setConfirmDialog((prev) => ({ ...prev, loading: true }));
      toast.showInfo("Starting Cursor reset...");

      // Check admin privileges first
      const hasAdmin = await ensureAdminForOperation("Cursor Reset");
      if (!hasAdmin) {
        toast.showError(
          "Admin Privileges Required",
          "Administrator privileges are required to reset Cursor. Please restart the application as administrator."
        );
        setConfirmDialog((prev) => ({ ...prev, loading: false, isOpen: false }));
        return;
      }

      // Check if Electron API is available
      if (!window.electronAPI) {
        throw new Error(
          "Electron API is not available. Please run in Electron app."
        );
      }

      // Perform the reset using the existing API
      await window.electronAPI.resetCursor({});

      // Show success message with details
      const successMessage = "Cursor reset completed successfully!";

      toast.showSuccess("Reset Complete", successMessage, 8000);

      // Refresh device info to show updated state
      await handleRefreshDeviceInfo();

      // Close dialog
      setConfirmDialog((prev) => ({ ...prev, isOpen: false, loading: false }));
    } catch (error) {
      console.error("Failed to reset cursor:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      toast.showError(
        "Reset Failed",
        `Failed to reset cursor: ${errorMessage}`
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleChangeMachineId = async () => {
    try {
      setLoading(true);

      // Check admin privileges first
      const hasAdmin = await ensureAdminForOperation("Change Machine ID");
      if (!hasAdmin) {
        toast.showError(
          "Admin Privileges Required",
          "Administrator privileges are required to change machine ID. Please restart the application as administrator."
        );
        setLoading(false);
        return;
      }

      // Check if Cursor is running
      if (window.electronAPI) {
        const isRunning = await window.electronAPI.checkCursorRunning();

        if (isRunning) {
          // Show confirmation dialog like client-sample does
          return new Promise<void>((resolve) => {
            setConfirmDialog({
              isOpen: true,
              title: "Cursor is Running",
              message:
                "Cursor is currently running and needs to be closed to reset Machine ID.\n\n" +
                "⚠️ Please save any unsaved work in Cursor before proceeding!\n\n" +
                "Click 'Force Close & Reset' to automatically close Cursor and continue with the reset.",
              variant: "warning",
              confirmText: "Close Cursor & Continue",
              cancelText: "Cancel",
              onConfirm: async () => {
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                try {
                  // Automatically close Cursor and reset (like client-sample)
                  await performMachineIdReset(true);
                  resolve();
                } catch (error) {
                  console.error("Failed to reset machine ID:", error);
                  toast.showError(
                    "Reset Failed",
                    `Failed to reset machine ID: ${(error as Error).message}`
                  );
                  resolve();
                }
              },
            });
          });
        }
      }

      // If Cursor is not running, proceed directly
      await performMachineIdReset(false);
    } catch (error) {
      console.error("Failed to reset machine ID:", error);
      toast.showError(
        "Reset Failed",
        `Failed to reset machine ID: ${(error as Error).message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const performMachineIdReset = async (forceKill: boolean) => {
    // Check if Electron API is available
    if (!window.electronAPI) {
      throw new Error(
        "Electron API is not available. Please run in Electron app."
      );
    }

    // Call the reset machine IDs function
    const result = await window.electronAPI.resetMachineIds(forceKill);

    if (result.includes("❌")) {
      throw new Error(result.replace("❌ Failed to reset machine IDs: ", ""));
    }

    // Refresh device info to show new machine ID
    const updatedInfo = await deviceService.refreshDeviceInfo();
    setDeviceInfo(updatedInfo);

    // Show success message
    toast.showSuccess("Machine ID Reset", `Machine ID reset successfully!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Dashboard
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Overview of your Recursor status
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshDeviceInfo}
          loading={loading}
          icon={<RefreshCw size={16} />}
        >
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Information */}
        <Card
          title="Device Information"
          subtitle="Current system and application status"
          variant="elevated"
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
                Machine ID
              </label>
              <p className="text-sm font-mono text-secondary-900 dark:text-secondary-100 mt-1 bg-secondary-50 dark:bg-secondary-800 px-3 py-2 rounded-lg">
                {deviceInfo.machineId || "Not available"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
                Current Account
              </label>
              <p className="text-sm text-secondary-900 dark:text-secondary-100 mt-1">
                {deviceInfo.currentAccount || "Not logged in"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
                Hook Status
              </label>
              <div className="flex items-center space-x-2 mt-1">
                {deviceInfo.hookStatus === true ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-success-600" />
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400">
                      Active
                    </span>
                  </div>
                ) : deviceInfo.hookStatus === false ? (
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-error-600" />
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400">
                      Inactive
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-secondary-500" />
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300">
                      Unknown
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
                Cursor Status
              </label>
              <div className="flex items-center space-x-2 mt-1">
                {deviceInfo.cursorRunning ? (
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4 text-success-600" />
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400">
                      Running
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4 text-secondary-500" />
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300">
                      Not Running
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* User Information */}
        <Card
          title="User Information"
          subtitle={
            auth.isAuthenticated
              ? "Your account details and usage"
              : "Authenticate to access features"
          }
          variant="elevated"
        >
          {auth.isAuthenticated && auth.accessKey ? (
            <UserKeyInfo
              accessKey={auth.accessKey}
              maskedKey={auth.maskedKey}
              usagePercentage={auth.usagePercentage}
              formattedExpiry={auth.formattedExpiry}
              isExpired={auth.isExpired}
              onCopyKey={auth.copyKey}
              onLogout={auth.logout}
            />
          ) : (
            <KeyActivation
              onActivate={auth.activateKey}
              loading={auth.loading}
            />
          )}
        </Card>

        {/* Quick Change */}
        {auth.isAuthenticated && (
          <Card
            title="Quick Change"
            subtitle="Get a fresh account instantly"
            variant="elevated"
          >
            <QuickChange
              onAccountObtained={async () => {
                // Refetch access key info to update usage after getting new account
                if (auth.isAuthenticated) {
                  await auth.validateAndLogoutIfInvalid();
                }
              }}
              onSuccess={async () => {
                toast.showSuccess(
                  "Account Switched",
                  "Account switched successfully!"
                );
                // Refetch device info to show updated account information
                await handleRefreshDeviceInfo();
              }}
              onError={(error) => {
                toast.showError("Switch Failed", error);
              }}
            />
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card
        title="Quick Actions"
        subtitle="Common operations and utilities"
        variant="elevated"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleChangeMachineId}
            variant="secondary"
            icon={<RotateCcw size={16} />}
            disabled={loading}
          >
            Change Machine ID
          </Button>
          <Button
            onClick={handleResetCursor}
            variant="primary"
            disabled={loading}
            icon={<Zap size={16} />}
          >
            Reset Cursor
          </Button>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        loading={confirmDialog.loading}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
      />
    </div>
  );
};

export default DashboardView;
