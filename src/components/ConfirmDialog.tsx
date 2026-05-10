import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  requireTextConfirmation?: boolean;
  textToConfirm?: string;
  variant?: 'danger' | 'warning';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  confirmButtonText = 'Confirmer',
  cancelButtonText = 'Annuler',
  onConfirm,
  onCancel,
  requireTextConfirmation = false,
  textToConfirm = 'SUPPRIMER',
  variant = 'danger',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requireTextConfirmation && inputValue !== textToConfirm) {
      return;
    }
    
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
      setInputValue('');
    }
  };

  const handleCancel = () => {
    setInputValue('');
    onCancel();
  };

  const isConfirmDisabled = requireTextConfirmation && inputValue !== textToConfirm;

  const variantStyles = {
    danger: {
      icon: 'bg-red-100 text-red-600',
      button: 'bg-red-600 hover:bg-red-700 shadow-red-200',
      border: 'border-red-200',
      text: 'text-red-700',
    },
    warning: {
      icon: 'bg-amber-100 text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
      border: 'border-amber-200',
      text: 'text-amber-700',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className={`p-6 border-b ${styles.border}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${styles.icon}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              </div>
            </div>
            <button
              onClick={handleCancel}
              disabled={isConfirming}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">{message}</p>

          {confirmText && (
            <div className={`p-4 rounded-lg border ${styles.border} bg-gray-50`}>
              <p className={`text-sm font-medium ${styles.text}`}>{confirmText}</p>
            </div>
          )}

          {requireTextConfirmation && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pour confirmer, tapez <span className="font-mono font-bold">{textToConfirm}</span>
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isConfirming}
                placeholder={textToConfirm}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleCancel}
            disabled={isConfirming}
            className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled || isConfirming}
            className={`flex-1 px-6 py-3 rounded-lg text-white font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${styles.button}`}
          >
            {isConfirming && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isConfirming ? 'Confirmation...' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
