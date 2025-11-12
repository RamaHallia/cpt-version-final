import { Smartphone, Volume2, Mic, AlertCircle } from 'lucide-react';

interface MobileVisioTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export const MobileVisioTipModal = ({
  isOpen,
  onClose,
  onContinue
}: MobileVisioTipModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Mode Visio sur Mobile</h3>
              <p className="text-purple-100 text-sm">Comment enregistrer votre réunion</p>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          {/* Information importante */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Sur mobile, les navigateurs ne peuvent pas capturer directement l'audio système.
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Nous utilisons votre microphone pour enregistrer l'audio de la réunion.
                </p>
              </div>
            </div>
          </div>

          {/* Instructions étape par étape */}
          <div className="space-y-4">
            <h4 className="font-bold text-cocoa-800 text-lg flex items-center gap-2">
              <span className="text-purple-600">📋</span> Instructions :
            </h4>
            
            <div className="space-y-3">
              {/* Étape 1 */}
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-cocoa-800">Activez le haut-parleur</p>
                  <p className="text-sm text-cocoa-600 mt-1">
                    <Volume2 className="w-4 h-4 inline mr-1" />
                    Mettez votre téléphone en mode haut-parleur pendant la réunion
                  </p>
                </div>
              </div>

              {/* Étape 2 */}
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-cocoa-800">Placez votre téléphone</p>
                  <p className="text-sm text-cocoa-600 mt-1">
                    Posez votre téléphone près de vous pour que le microphone capte bien l'audio
                  </p>
                </div>
              </div>

              {/* Étape 3 */}
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-cocoa-800">Autorisez le microphone</p>
                  <p className="text-sm text-cocoa-600 mt-1">
                    <Mic className="w-4 h-4 inline mr-1" />
                    Acceptez l'accès au microphone lorsque demandé
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conseil */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>💡 Astuce :</strong> Pour une meilleure qualité, réduisez le bruit ambiant et assurez-vous que le volume du haut-parleur est suffisant.
            </p>
          </div>
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
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
};

