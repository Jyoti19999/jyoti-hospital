import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

/**
 * Professional Confirmation Dialog Component
 * 
 * @param {boolean} open - Controls dialog visibility
 * @param {function} onOpenChange - Callback when dialog open state changes
 * @param {function} onConfirm - Callback when user confirms action
 * @param {function} onCancel - Callback when user cancels action
 * @param {string} title - Dialog title
 * @param {string} description - Dialog description/message
 * @param {string} confirmText - Text for confirm button (default: "Confirm")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {string} variant - Dialog variant: "danger", "warning", "success", "info" (default: "danger")
 * @param {boolean} loading - Shows loading state on confirm button
 * @param {string} loadingText - Text to show when loading (default: "Processing...")
 * @param {object} data - Optional data object to display additional info
 * @param {boolean} showData - Whether to show the data section (default: true if data is provided)
 * @param {boolean} success - Shows success state after action completes
 * @param {string} successTitle - Title to show on success (default: "Success")
 * @param {string} successMessage - Message to show on success (default: "Action completed successfully")
 * @param {string} successButtonText - Text for success close button (default: "Close")
 * @param {boolean} error - Shows error state after action fails
 * @param {string} errorTitle - Title to show on error (default: "Error")
 * @param {string} errorMessage - Message to show on error (default: "Action failed")
 * @param {string} errorButtonText - Text for error close button (default: "Close")
 */
const ConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = "Confirm Action",
  description = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  loadingText = "Processing...",
  data = null,
  showData = true,
  success = false,
  successTitle = "Success",
  successMessage = "Action completed successfully",
  successButtonText = "Close",
  error = false,
  errorTitle = "Error",
  errorMessage = "Action failed",
  errorButtonText = "Close"
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
          iconBg: 'bg-red-100',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          titleColor: 'text-red-900'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
          iconBg: 'bg-yellow-100',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          titleColor: 'text-yellow-900'
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          iconBg: 'bg-green-100',
          confirmButton: 'bg-green-600 hover:bg-green-700 text-white',
          titleColor: 'text-green-900'
        };
      case 'info':
        return {
          icon: <XCircle className="h-6 w-6 text-blue-600" />,
          iconBg: 'bg-blue-100',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          titleColor: 'text-blue-900'
        };
      default:
        return {
          icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
          iconBg: 'bg-red-100',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          titleColor: 'text-red-900'
        };
    }
  };

  const successStyles = {
    icon: <CheckCircle className="h-6 w-6 text-green-600" />,
    iconBg: 'bg-green-100',
    confirmButton: 'bg-green-600 hover:bg-green-700 text-white',
    titleColor: 'text-green-900'
  };

  const errorStyles = {
    icon: <XCircle className="h-6 w-6 text-red-600" />,
    iconBg: 'bg-red-100',
    confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
    titleColor: 'text-red-900'
  };

  const styles = success ? successStyles : error ? errorStyles : getVariantStyles();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] top-[0%] translate-y-0 border-0 shadow-2xl p-0 gap-0 overflow-hidden">
        <div className={`${styles.iconBg} px-6 py-5 border-b`}>
          <div className="flex items-center gap-4">
            <div className={`flex-shrink-0 rounded-full p-2.5 bg-white shadow-sm`}>
              {styles.icon}
            </div>
            <DialogTitle className={`text-xl font-bold ${styles.titleColor} m-0`}>
              {success ? successTitle : error ? errorTitle : title}
            </DialogTitle>
          </div>
        </div>

        <div className="px-6 py-5">
          <DialogDescription className="text-base text-slate-700 leading-relaxed">
            {success ? successMessage : error ? errorMessage : description}
          </DialogDescription>

          {!success && !error && showData && data && (
            <div className="mt-5 rounded-lg bg-slate-50 p-4 border border-slate-200">
              <div className="space-y-2.5">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-slate-900 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t gap-3 sm:gap-3 flex-row justify-end">
          {success ? (
            <Button
              type="button"
              onClick={handleCancel}
              className="bg-green-600 hover:bg-green-700 text-white min-w-[120px] shadow-sm"
            >
              {successButtonText}
            </Button>
          ) : error ? (
            <Button
              type="button"
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[120px] shadow-sm"
            >
              {errorButtonText}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="border-slate-300 hover:bg-white hover:border-slate-400 min-w-[100px]"
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className={`${styles.confirmButton} min-w-[100px] shadow-sm`}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText}
                  </>
                ) : (
                  confirmText
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationDialog;
