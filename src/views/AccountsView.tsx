import React, { useState, useEffect } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import { useAuth } from "../hooks/useAuth";

interface ServiceAccount {
  id: string;
  email: string;
  password: string;
  token: string;
  cookie: string;
  status: "active" | "inactive" | "expired";
  lastUsed?: string;
  createdAt: string;
}

const AccountsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [serviceAccounts, setServiceAccounts] = useState<ServiceAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [limit] = useState(10); // Items per page
  const auth = useAuth();

  const fetchServiceAccounts = async (page: number = currentPage) => {
    if (!auth.isAuthenticated || !auth.accessKey?.id) {
      setError("Please authenticate first");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query params
      const queryParams = new URLSearchParams({
        keyId: auth.accessKey.id,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await window.electronAPI.apiRequest({
        url: `https://recursor.pro/api/client/service-accounts?${queryParams.toString()}`,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status !== 200) {
        const errorMsg =
          response.data?.error ||
          response.data?.message ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      const responseData = response.data;

      // Extract accounts from the correct structure
      const rawAccounts = responseData?.accounts;

      const accounts = Array.isArray(rawAccounts) ? rawAccounts : [];

      // Extract pagination info
      const pagination = responseData?.pagination || {};

      // Update pagination info
      setServiceAccounts(accounts);
      setCurrentPage(pagination?.page || page);
      setTotalPages(
        pagination?.totalPages ||
          Math.ceil((pagination?.total || accounts.length) / limit)
      );
      setTotalAccounts(pagination?.total || accounts.length);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch service accounts";
      setError(errorMessage);
      console.error("Error fetching service accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceAccounts(1); // Reset to page 1 when auth changes
  }, [auth.isAuthenticated]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !loading) {
      fetchServiceAccounts(newPage);
    }
  };

  const handleSwitchAccount = async (
    account: ServiceAccount,
    forceKill = false
  ) => {
    setSwitchingId(account.id);
    try {
      // Check if Cursor is running first
      let shouldForceKill = forceKill;
      if (!forceKill && window.electronAPI) {
        const isRunning = await window.electronAPI.checkCursorRunning();

        if (isRunning) {
          // Ask user if they want to force kill Cursor if it's running
          shouldForceKill = window.confirm(
            `⚠️ Cursor is Running!\n\n` +
              `Do you want to automatically close Cursor to switch to account "${account.email}"?\n\n` +
              `Click OK to close Cursor and continue, or Cancel to abort.`
          );

          if (!shouldForceKill) {
            setSwitchingId(null);
            return; // User cancelled
          }
        }
      }

      const result = await auth.switchAccount({
        email: account.email,
        token: account.token,
        forceKill: shouldForceKill,
      });

      if (result.success) {
        // Show success message (you can add toast notification here)
        console.log("Successfully switched to account:", account.email);
      } else {
        setError(result.error || "Failed to switch account");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to switch account"
      );
    } finally {
      setSwitchingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return "✅";
      case "inactive":
        return "⏸️";
      case "expired":
        return "❌";
      default:
        return "❓";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Service Accounts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your available service accounts
          </p>
        </div>
        <Button
          onClick={() => fetchServiceAccounts(currentPage)}
          variant="secondary"
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card>
          <div className="text-center py-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </Card>
      )}

      {/* Service Accounts List */}
      <Card>
        <div className="space-y-4">
          {serviceAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {error
                  ? "Failed to load service accounts"
                  : "No service accounts found"}
              </p>
            </div>
          ) : (
            serviceAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-shrink-0 text-2xl">
                  {getStatusIcon(account.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {account.email}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}
                      >
                        {account.status}
                      </span>
                      <Button
                        onClick={() => handleSwitchAccount(account)}
                        variant="primary"
                        size="sm"
                        disabled={switchingId === account.id}
                      >
                        {switchingId === account.id
                          ? "Switching..."
                          : "Switch Account"}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {account.lastUsed && (
                      <span>
                        Last used:{" "}
                        {new Date(account.lastUsed).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * limit + 1} to{" "}
              {Math.min(currentPage * limit, totalAccounts)} of {totalAccounts}{" "}
              accounts
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {serviceAccounts.filter((a) => a.status === "active").length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Active Accounts
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {serviceAccounts.filter((a) => a.status === "expired").length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Expired Accounts
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalAccounts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Accounts
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AccountsView;
