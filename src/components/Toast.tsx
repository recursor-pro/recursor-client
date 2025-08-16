import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import Button from "./Button";

export interface ToastProps {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 200);
  };

  const typeConfig = {
    success: {
      icon: CheckCircle,
      iconColor: "text-success-600 dark:text-success-400",
      bgColor: "bg-success-50 dark:bg-success-900/20",
      borderColor: "border-success-200 dark:border-success-700",
    },
    error: {
      icon: XCircle,
      iconColor: "text-error-600 dark:text-error-400",
      bgColor: "bg-error-50 dark:bg-error-900/20",
      borderColor: "border-error-200 dark:border-error-700",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-warning-600 dark:text-warning-400",
      bgColor: "bg-warning-50 dark:bg-warning-900/20",
      borderColor: "border-warning-200 dark:border-warning-700",
    },
    info: {
      icon: Info,
      iconColor: "text-info-600 dark:text-info-400",
      bgColor: "bg-info-50 dark:bg-info-900/20",
      borderColor: "border-info-200 dark:border-info-700",
    },
  };

  const config = typeConfig[type];
  const IconComponent = config.icon;

  return (
    <div
      className={`
        max-w-sm w-full ${config.bgColor} ${config.borderColor} border rounded-xl shadow-large p-4
        transform transition-all duration-200 ease-out
        ${isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
            {title}
          </p>
          {message && (
            <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400 whitespace-pre-line">
              {message}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="xs"
            onClick={handleClose}
            icon={<X size={14} />}
            className="text-secondary-400 hover:text-secondary-600 dark:text-secondary-500 dark:hover:text-secondary-300"
            children={<></>}
          />
        </div>
      </div>
    </div>
  );
};

export default Toast;
