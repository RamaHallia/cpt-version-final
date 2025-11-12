import { AlertTriangle, Clock, X } from 'lucide-react';

interface ShortRecordingWarningModalProps {
  isOpen: boolean;
  recordedSeconds: number;
  minimumSeconds: number;
  onContinueRecording: () => void;
  onDiscardRecording: () => void;
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const ShortRecordingWarningModal = ({
  isOpen,
  recordedSeconds,
  minimumSeconds,
  onContinueRecording,
  onDiscardRecording,
}: ShortRecordingWarningModalProps) => {
  if (!isOpen) return null;

  const deficit = Math.max(0, minimumSeconds - recordedSeconds);

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-[1100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
        <div className="bg-gradient-to-r from-coral-500 to-sunset-500 p-6 relative">
          <button
            onClick={onContinueRecording}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            title="Continuer l'enregistrement"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Enregistrement trop court</h2>
              <p className="text-white/90 text-sm mt-1">
                Minimum requis&nbsp;: {Math.ceil(minimumSeconds / 60)} minute
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-coral-50 border border-coral-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
              <Clock className="w-6 h-6 text-coral-600" />
            </div>
            <div className="space-y-1">
              <p className="text-cocoa-800 font-semibold">
                Durée enregistrée&nbsp;: <span className="text-coral-600">{formatDuration(recordedSeconds)}</span>
              </p>
              <p className="text-cocoa-600 text-sm leading-relaxed">
                Pour générer un compte-rendu fiable, votre enregistrement doit durer au moins 1 minute. Il manque encore {deficit} seconde{deficit > 1 ? 's' : ''}.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onContinueRecording}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-coral-500 to-sunset-500 text-white font-semibold shadow-lg hover:shadow-xl transition-transform hover:scale-105"
            >
              Continuer l'enregistrement
            </button>
            <button
              onClick={onDiscardRecording}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-cocoa-200 text-cocoa-700 font-semibold hover:bg-cocoa-50 transition-transform hover:scale-105"
            >
              Annuler et ignorer cette prise
            </button>
          </div>

          <p className="text-center text-xs text-cocoa-500">
            Conseil&nbsp;: laissez tourner l'enregistrement quelques instants pour capturer suffisamment de contexte.
          </p>
        </div>
      </div>
    </div>
  );
};


