import { XCircle, X, Crown } from 'lucide-react';

interface UploadQuotaErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  audioDuration: number;
  remainingMinutes: number;
}

export const UploadQuotaErrorModal = ({
  isOpen,
  onClose,
  onUpgrade,
  audioDuration,
  remainingMinutes
}: UploadQuotaErrorModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn">
        {/* Header avec gradient rouge */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Upload impossible !
              </h2>
              <p className="text-white/90 text-sm mt-1">
                Ce fichier dépasse votre quota
              </p>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
            <p className="text-cocoa-800 leading-relaxed">
              Ce fichier audio dure <strong className="text-red-600">{audioDuration} minutes</strong>, mais il ne vous reste que <strong className="text-red-600">{remainingMinutes} minute{remainingMinutes > 1 ? 's' : ''}</strong> ce mois-ci.
            </p>
            <p className="text-cocoa-700 text-sm">
              📅 Veuillez attendre le renouvellement de votre quota ou passer à la formule Illimitée.
            </p>
          </div>

          {/* Bouton Upgrade */}
          <button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl p-4 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center gap-3">
              <Crown className="w-6 h-6" />
              <div className="text-left">
                <div className="font-bold text-lg">Passer à la formule Illimitée</div>
                <div className="text-sm text-white/90">39€/mois - Aucune limite de minutes</div>
              </div>
            </div>
          </button>

          {/* Bouton Fermer */}
          <button
            onClick={onClose}
            className="w-full bg-white border-2 border-gray-300 hover:bg-gray-50 text-cocoa-800 rounded-xl px-6 py-3 font-semibold transition-all hover:scale-105"
          >
            Fermer
          </button>

          {/* Info */}
          <div className="text-center">
            <p className="text-sm text-cocoa-600">
              💡 <strong>Astuce :</strong> Vous pouvez aussi essayer d'uploader un fichier plus court.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

