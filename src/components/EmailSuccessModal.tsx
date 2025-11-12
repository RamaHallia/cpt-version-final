import { Check, X, Mail } from 'lucide-react';

interface EmailSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientCount: number;
  method: 'gmail' | 'smtp';
}

export const EmailSuccessModal = ({ isOpen, onClose, recipientCount, method }: EmailSuccessModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scaleIn">
        {/* Icône de succès */}
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </div>

        {/* Titre */}
        <h2 className="text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
          Email envoyé avec succès !
        </h2>

        {/* Description */}
        <p className="text-center text-cocoa-600 mb-6">
          Votre email a été envoyé à{' '}
          <span className="font-bold text-cocoa-800">
            {recipientCount} destinataire{recipientCount > 1 ? 's' : ''}
          </span>
          {' '}via{' '}
          <span className="font-semibold text-coral-600">
            {method === 'gmail' ? 'Gmail' : 'SMTP'}
          </span>
        </p>

        {/* Info supplémentaire */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-cocoa-700">
              <p className="font-semibold mb-1">L'email est en route 📧</p>
              <p className="text-xs text-cocoa-600">
                Vous pouvez consulter l'historique des emails envoyés dans l'onglet "Emails envoyés"
              </p>
            </div>
          </div>
        </div>

        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Parfait !
        </button>

        {/* Bouton X en haut à droite */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cocoa-400 hover:text-cocoa-600 transition-colors p-2 hover:bg-cocoa-100 rounded-full"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

