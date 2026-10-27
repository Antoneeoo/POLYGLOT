import React from 'react';
import { AlertTriangle, Trash2, UserPlus, X } from 'lucide-react';

interface DestructiveActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const DestructiveActionModal: React.FC<DestructiveActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  isDestructive = true,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              isDestructive
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            }`}
          >
            {isDestructive ? (
              <Trash2 className="w-6 h-6" />
            ) : (
              <UserPlus className="w-6 h-6" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">{description}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
            } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isDestructive ? <AlertTriangle className="w-3.5 h-3.5" /> : null}
            <span>{isLoading ? 'Processing...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
