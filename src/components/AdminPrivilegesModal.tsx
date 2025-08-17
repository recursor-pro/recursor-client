import React, { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle, X } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import { useToast } from "./ToastContainer";
import { 
  checkAdminPrivileges, 
  requestAdminPrivileges, 
  isAdminRequired,
  getAdminPrivilegesInfo 
} from "../api";

interface AdminPrivilegesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}

const AdminPrivilegesModal: React.FC<AdminPrivilegesModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminInfo, setAdminInfo] = useState<{
    hasAdminPrivileges: boolean;
    isAdminRequired: boolean;
    platform: string;
    canRequestElevation: boolean;
  } | null>(null);
  const toast = useToast();

  // Check admin privileges when modal opens
  useEffect(() => {
    if (isOpen) {
      checkPrivileges();
    }
  }, [isOpen]);

  const checkPrivileges = async () => {
    setChecking(true);
    try {
      const info = await getAdminPrivilegesInfo();
      setAdminInfo(info);
    } catch (error) {
      console.error("Failed to check admin privileges:", error);
      toast.showError("Error", "Failed to check admin privileges");
    } finally {
      setChecking(false);
    }
  };

  const handleRequestPrivileges = async () => {
    if (!adminInfo) return;

    setLoading(true);
    try {
      const success = await requestAdminPrivileges();
      if (success) {
        toast.showSuccess("Success", "Application will restart with admin privileges");
        // App will restart, so we don't need to do anything else
      } else {
        toast.showError("Failed", "Could not obtain admin privileges");
      }
    } catch (error) {
      console.error("Failed to request admin privileges:", error);
      toast.showError("Error", "Failed to request admin privileges");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithoutAdmin = () => {
    toast.showWarning(
      "Limited Functionality", 
      "Some features may not work without admin privileges"
    );
    onConfirm?.();
    onClose();
  };

  const getPlatformInstructions = (platform: string) => {
    switch (platform) {
      case "Windows":
        return "Right-click the application and select 'Run as administrator'";
      case "macOS":
        return "The system will prompt for your administrator password";
      case "Linux":
        return "You may need to enter your sudo password";
      default:
        return "Administrator privileges are required";
    }
  };

  if (checking) {
    return (
      <Modal isOpen={isOpen} onClose={() => {}} title="Checking Privileges">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-secondary-600 dark:text-secondary-300">
            Checking admin privileges...
          </span>
        </div>
      </Modal>
    );
  }

  if (!adminInfo) {
    return null;
  }

  // If admin privileges are not required, don't show modal
  if (!adminInfo.isAdminRequired) {
    onConfirm?.();
    onClose();
    return null;
  }

  // If already has admin privileges, don't show modal
  if (adminInfo.hasAdminPrivileges) {
    onConfirm?.();
    onClose();
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Administrator Privileges Required"
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Shield className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Administrator Privileges Required
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              This application needs elevated privileges to modify Cursor files
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Insufficient Privileges
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                The application requires administrator privileges to:
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1">
                <li>• Modify Cursor's main.js file</li>
                <li>• Access system directories</li>
                <li>• Perform file operations safely</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Platform Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Platform: {adminInfo.platform}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {getPlatformInstructions(adminInfo.platform)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-3">
          {adminInfo.canRequestElevation && (
            <Button
              onClick={handleRequestPrivileges}
              loading={loading}
              className="w-full"
              variant="primary"
            >
              <Shield className="h-4 w-4 mr-2" />
              Request Administrator Privileges
            </Button>
          )}
          
          <Button
            onClick={handleContinueWithoutAdmin}
            variant="secondary"
            className="w-full"
          >
            Continue Without Admin Privileges
          </Button>
        </div>

        {/* Warning */}
        <div className="text-xs text-secondary-500 dark:text-secondary-400 text-center">
          <p>
            Without admin privileges, some features like hook management may not work properly.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default AdminPrivilegesModal;
