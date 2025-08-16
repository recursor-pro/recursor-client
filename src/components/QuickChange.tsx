import React, { useState } from "react";
import Button from "./Button";
import { useAuth } from "../hooks/useAuth";

interface QuickChangeProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const QuickChange: React.FC<QuickChangeProps> = ({ onSuccess, onError }) => {
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState<{
    email: string;
    token: string;
  } | null>(null);
  const [forceKill, setForceKill] = useState(false);
  const [showForceKillDialog, setShowForceKillDialog] = useState(false);

  const handleGetAccount = async () => {
    if (!auth.isAuthenticated) {
      onError?.("Please authenticate first");
      return;
    }

    setLoading(true);
    try {
      const result = await auth.getServiceAccount();
      if (result.success && result.data) {
        setAccountData(result.data);

        // Auto-switch account immediately after getting it
        await performAccountSwitch(result.data);
      } else {
        onError?.(result.error || "Failed to get account");
      }
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : "Failed to get account"
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if Cursor is running
  const checkCursorStatus = async (): Promise<boolean> => {
    try {
      if (!window.electronAPI) {
        return false;
      }
      return await window.electronAPI.checkCursorRunning();
    } catch (error) {
      console.error("Failed to check Cursor status:", error);
      return false;
    }
  };

  // Perform account switch with auto-detect
  const performAccountSwitch = async (accountData: { email: string; token: string }) => {
    try {
      // Check if Cursor is running
      const isRunning = await checkCursorStatus();

      if (isRunning && !forceKill) {
        // Show force kill confirmation dialog
        setShowForceKillDialog(true);
        return;
      }

      const result = await window.electronAPI.switchCursorAccount({
        email: accountData.email,
        token: accountData.token,
        forceKill: isRunning ? true : forceKill, // Auto force kill if running
      });

      if (result.success) {
        onSuccess?.();
        // Reset for next use
        setAccountData(null);
        setShowForceKillDialog(false);
      } else {
        onError?.(result.error || "Failed to switch account");
      }
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : "Failed to switch account"
      );
    }
  };



  const handleForceKillConfirm = async () => {
    if (!accountData) {
      onError?.("No account data available");
      return;
    }

    setShowForceKillDialog(false);
    setForceKill(true);
    setLoading(true);

    try {
      const result = await window.electronAPI.switchCursorAccount({
        email: accountData.email,
        token: accountData.token,
        forceKill: true,
      });

      if (result.success) {
        onSuccess?.();
        // Reset for next use
        setAccountData(null);
        setForceKill(false);
      } else {
        onError?.(result.error || "Failed to switch account");
      }
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : "Failed to switch account"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForceKillCancel = () => {
    setShowForceKillDialog(false);
    setLoading(false);
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="text-center p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please authenticate to use Quick Change
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!showForceKillDialog && (
        <>
          <div className="text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Quick Change
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Get a fresh Cursor account and switch automatically
            </p>
          </div>

          <Button
            onClick={handleGetAccount}
            variant="primary"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Getting & Switching Account...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Get & Switch Account
              </>
            )}
          </Button>
        </>
      )}



      {/* Force Kill Confirmation Dialog */}
      {showForceKillDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                ⚠️ Cursor is Running
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Cursor is currently running. Do you want to automatically close Cursor to continue switching accounts?
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleForceKillConfirm}
                variant="primary"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Close Cursor & Continue"
                )}
              </Button>

              <Button
                onClick={handleForceKillCancel}
                variant="secondary"
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickChange;
