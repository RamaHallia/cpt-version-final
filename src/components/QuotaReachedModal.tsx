import { AlertCircle, Crown, X } from 'lucide-react';

interface QuotaReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onContinueWithSummary: () => void;
  minutesUsed: number;
  quota: number;
}

export const QuotaReachedModal = ({
  isOpen,
  onClose,
  onUpgrade,
  onContinueWithSummary,
  minutesUsed,
  quota
}: QuotaReachedModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Quota de minutes atteint !
              </h2>
              <p className="text-white/90 text-sm mt-1">
                {minutesUsed} / {quota} minutes utilisées ce mois
              </p>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-cocoa-800 leading-relaxed">
              Votre enregistrement a été <strong>arrêté automatiquement</strong> car vous avez atteint votre quota mensuel de {quota} minutes.
            </p>
            <p className="text-cocoa-700 text-sm mt-2">
              ✅ Votre enregistrement en cours sera <strong>sauvegardé et traité</strong>.
            </p>
          </div>

          {/* Option 1: Upgrade */}
          <button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl p-4 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center gap-3">
              <Crown className="w-6 h-6" />
              <div className="text-left">
                <div className="font-bold text-lg">Passer à la formule Illimitée</div>
                <div className="text-sm text-white/90">39€/mois - Réunions illimitées</div>
              </div>
            </div>
          </button>

          {/* Option 2: Continuer avec résumé */}
          <button
            onClick={onContinueWithSummary}
            className="w-full bg-white border-2 border-coral-300 hover:bg-coral-50 text-cocoa-800 rounded-xl p-4 transition-all hover:scale-105"
          >
            <div className="text-left">
              <div className="font-bold">Générer le résumé maintenant</div>
              <div className="text-sm text-cocoa-600">
                Votre enregistrement sera traité et un compte-rendu sera généré
              </div>
            </div>
          </button>

          {/* Info */}
          <div className="text-center text-sm text-cocoa-500">
            Votre quota se renouvellera automatiquement le mois prochain
          </div>
        </div>
      </div>
    </div>
  );
};

