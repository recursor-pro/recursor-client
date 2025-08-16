import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  loading = false,
}) => {
  const variantConfig = {
    danger: {
      icon: XCircle,
      iconColor: 'text-error-600 dark:text-error-400',
      iconBg: 'bg-error-100 dark:bg-error-900/20',
      confirmVariant: 'danger' as const,
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-warning-600 dark:text-warning-400',
      iconBg: 'bg-warning-100 dark:bg-warning-900/20',
      confirmVariant: 'warning' as const,
    },
    info: {
      icon: Info,
      iconColor: 'text-info-600 dark:text-info-400',
      iconBg: 'bg-info-100 dark:bg-info-900/20',
      confirmVariant: 'primary' as const,
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-success-600 dark:text-success-400',
      iconBg: 'bg-success-100 dark:bg-success-900/20',
      confirmVariant: 'primary' as const,
    },
  };

  const config = variantConfig[variant];
  const IconComponent = config.icon;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center mb-4`}>
          <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6 whitespace-pre-line">
          {message}
        </p>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
