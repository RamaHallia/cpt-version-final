import { BellRing, PauseCircle, PlayCircle, StopCircle } from 'lucide-react';

interface LongRecordingReminderModalProps {
  isOpen: boolean;
  elapsedHours: number;
  onContinue: () => void;
  onPause: () => void;
  onStop: () => void;
}

export const LongRecordingReminderModal = ({
  isOpen,
  elapsedHours,
  onContinue,
  onPause,
  onStop,
}: LongRecordingReminderModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn border-2 border-amber-200">
        <div className="bg-gradient-to-r from-amber-200 via-amber-100 to-white p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/40">
              <BellRing className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-900">Rappel d'enregistrement</h2>
              <p className="text-sm text-amber-800/80">
                Vous enregistrez depuis{' '}
                <span className="font-semibold">
                  {elapsedHours.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h
                </span>
                . Pensez à faire une pause ou à clôturer si nécessaire.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-900 flex items-start gap-3">
            <div className="mt-1">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            </div>
            <div>
              <p className="font-semibold">Restez concentré(e) !</p>
              <p className="text-amber-800/80 mt-1">
                Nous vous recommandons de faire une courte pause toutes les 2 heures pour garder un compte rendu optimal.
                Vous pouvez mettre l'enregistrement en pause, le reprendre plus tard ou l'arrêter pour générer un résumé immédiat.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={onContinue}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-amber-200 text-amber-900 font-semibold hover:bg-amber-50 transition-colors"
            >
              <PlayCircle className="w-5 h-5" />
              Continuer
            </button>

            <button
              onClick={onPause}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-coral-200 text-coral-700 font-semibold hover:bg-coral-50 transition-colors"
            >
              <PauseCircle className="w-5 h-5" />
              Mettre en pause
            </button>

            <button
              onClick={onStop}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-coral-500 to-sunset-500 text-white font-semibold shadow-md shadow-coral-500/30 hover:shadow-lg transition-transform active:scale-95"
            >
              <StopCircle className="w-5 h-5" />
              Arrêter & Résumer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

