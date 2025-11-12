import { AlertTriangle, X } from 'lucide-react';

interface LowQuotaWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  remainingMinutes: number;
}

export const LowQuotaWarningModal = ({
  isOpen,
  onClose,
  onContinue,
  remainingMinutes
}: LowQuotaWarningModalProps) => {
  console.log('🟠 LowQuotaWarningModal render:', { isOpen, remainingMinutes });
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
        {/* Header avec gradient orange */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Attention
              </h2>
              <p className="text-white/90 text-sm mt-1">
                Quota presque épuisé
              </p>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-cocoa-800 leading-relaxed">
              Il vous reste seulement <strong className="text-orange-600">{remainingMinutes} minute{remainingMinutes > 1 ? 's' : ''}</strong> ce mois-ci.
            </p>
            <p className="text-cocoa-700 text-sm mt-2">
              Voulez-vous continuer l'enregistrement ?
            </p>
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white border-2 border-gray-300 hover:bg-gray-50 text-cocoa-800 rounded-xl px-6 py-3 font-semibold transition-all hover:scale-105"
            >
              Annuler
            </button>
            <button
              onClick={onContinue}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl px-6 py-3 font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Continuer
            </button>
          </div>

          {/* Info */}
          <div className="text-center text-sm text-cocoa-500">
            💡 Passez à la formule Illimitée pour ne plus avoir de limites
          </div>
        </div>
      </div>
    </div>
  );
};

