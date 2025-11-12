import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Annuler',
  isDangerous = false
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 animate-fadeIn"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${isDangerous ? 'bg-red-50 border-red-200' : 'bg-gradient-to-r from-coral-50 to-sunset-50 border-coral-200'}`}>
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              isDangerous ? 'bg-red-100' : 'bg-coral-100'
            }`}>
              <AlertCircle className={`w-6 h-6 ${isDangerous ? 'text-red-600' : 'text-coral-600'}`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold ${isDangerous ? 'text-red-900' : 'text-cocoa-900'}`}>
                {title}
              </h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-cocoa-700 text-base leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl font-semibold text-cocoa-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-md hover:shadow-lg ${
              isDangerous
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gradient-to-r from-coral-500 to-sunset-500 hover:from-coral-600 hover:to-sunset-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

