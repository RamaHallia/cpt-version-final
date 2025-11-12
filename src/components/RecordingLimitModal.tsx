import { Hourglass, Sparkles } from 'lucide-react';

interface RecordingLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordingLimitModal = ({ isOpen, onClose }: RecordingLimitModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn border-2 border-coral-200">
        <div className="bg-gradient-to-r from-coral-500 to-sunset-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/20">
              <Hourglass className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Limite maximale atteinte</h2>
              <p className="text-sm text-white/80">
                L'enregistrement a été arrêté automatiquement après 4 heures.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-coral-50 border border-coral-100 rounded-2xl p-4 text-sm text-cocoa-800 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-coral-500 mt-1" />
            <div>
              <p className="font-semibold text-coral-700">Résumé en cours de génération</p>
              <p className="mt-1 text-cocoa-700/80">
                Nous lançons immédiatement la transcription et la génération du résumé. Vous serez notifié(e) dès que tout est prêt.
              </p>
            </div>
          </div>

          <p className="text-xs text-cocoa-500">
            Besoin d'enregistrer plus longtemps ? Pensez à segmenter vos réunions par sessions de 4h maximum ou à contacter notre support pour explorer des options avancées.
          </p>

          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-coral-500 to-sunset-500 text-white font-semibold shadow-md shadow-coral-500/30 hover:shadow-lg transition-transform active:scale-95"
          >
            Compris, merci !
          </button>
        </div>
      </div>
    </div>
  );
};

