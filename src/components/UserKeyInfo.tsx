import React, { useState } from "react";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Button from "./Button";
import { AccessKeyInfo } from "../types";

interface UserKeyInfoProps {
  accessKey: AccessKeyInfo;
  maskedKey: string;
  usagePercentage: number;
  formattedExpiry: string;
  isExpired: boolean;
  onCopyKey: () => Promise<{ success: boolean; error?: string }>;
  onLogout: () => void;
}

const UserKeyInfo: React.FC<UserKeyInfoProps> = ({
  accessKey,
  maskedKey,
  usagePercentage,
  formattedExpiry,
  isExpired,
  onCopyKey,
  onLogout,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyKey = async () => {
    const result = await onCopyKey();
    if (result.success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600 dark:text-red-400";
    if (percentage >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getUsageBgColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusIcon = (status: string, expired: boolean) => {
    if (expired) return XCircle;
    if (status === "ACTIVE") return CheckCircle;
    return AlertCircle;
  };

  const getStatusIconColor = (status: string, expired: boolean) => {
    if (expired) return "text-error-600";
    if (status === "ACTIVE") return "text-success-600";
    return "text-secondary-500";
  };

  const getStatusBadgeColor = (status: string, expired: boolean) => {
    if (expired)
      return "bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400";
    if (status === "ACTIVE")
      return "bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400";
    return "bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300";
  };

  return (
    <div className="space-y-4">
      {/* Key Information */}
      <div className="space-y-3">
        {/* Access Key */}
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Access Key
          </label>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-sm font-mono text-gray-900 dark:text-white flex-1">
              {maskedKey}
            </p>
            <Button
              onClick={handleCopyKey}
              variant="secondary"
              className="text-xs px-2 py-1"
            >
              {copySuccess ? (
                <>
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Key Name */}
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Key Name
          </label>
          <p className="text-sm text-gray-900 dark:text-white">
            {accessKey.name}
          </p>
        </div>

        {/* Usage */}
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Usage
          </label>
          <div className="mt-1">
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${getUsageColor(usagePercentage)}`}>
                {accessKey.currentRequests.toLocaleString()} /{" "}
                {accessKey.maxRequests.toLocaleString()}
              </span>
              <span className={`text-xs ${getUsageColor(usagePercentage)}`}>
                {usagePercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getUsageBgColor(usagePercentage)}`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Status
          </label>
          <div className="flex items-center space-x-2 mt-1">
            {(() => {
              const StatusIcon = getStatusIcon(accessKey.status, isExpired);
              return (
                <div className="flex items-center space-x-2">
                  <StatusIcon
                    className={`w-4 h-4 ${getStatusIconColor(accessKey.status, isExpired)}`}
                  />
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(accessKey.status, isExpired)}`}
                  >
                    {isExpired
                      ? "Expired"
                      : accessKey.status === "ACTIVE"
                        ? "Active"
                        : accessKey.status}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Expiry */}
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Expires In
          </label>
          <p
            className={`text-sm ${isExpired ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
          >
            {formattedExpiry}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={onLogout} variant="warning" className="w-full text-xs">
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
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default UserKeyInfo;
