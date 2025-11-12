import { AlertTriangle, TrendingDown } from 'lucide-react';

interface LowQuotaUploadWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  uploadMinutes: number;
  remainingAfter: number;
}

export const LowQuotaUploadWarningModal = ({
  isOpen,
  onClose,
  onContinue,
  uploadMinutes,
  remainingAfter
}: LowQuotaUploadWarningModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn">
        {/* Header avec dégradé orange */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Attention Quota</h3>
              <p className="text-orange-100 text-sm">Vérification avant upload</p>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          {/* Alerte principale */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <TrendingDown className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-orange-900 font-semibold text-lg leading-tight">
                  Après cet upload ({uploadMinutes} min), il vous restera seulement{' '}
                  <span className="text-red-600 font-bold">{remainingAfter} minute{remainingAfter > 1 ? 's' : ''}</span>{' '}
                  ce mois-ci.
                </p>
              </div>
            </div>
          </div>

          {/* Info supplémentaire */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Conseil :</strong> Si vous manquez de minutes, vous pouvez passer au forfait Illimité pour continuer sans limite.
            </p>
          </div>

          {/* Question */}
          <p className="text-center text-cocoa-700 font-medium text-lg">
            Voulez-vous continuer ?
          </p>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-coral-500 to-sunset-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
};

