import { useState, useEffect } from 'react';
import { Mail, Settings, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SetupReminderProps {
  userId: string;
  onNavigateToSettings: () => void;
}

export const SetupReminder = ({ userId, onNavigateToSettings }: SetupReminderProps) => {
  const [showReminder, setShowReminder] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkSetupStatus();
  }, [userId]);

  const checkSetupStatus = async () => {
    try {
      // Vérifier si l'utilisateur a déjà configuré ses paramètres
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('email_method, gmail_connected, smtp_host, smtp_user, signature_text')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking setup status:', error);
        setIsChecking(false);
        return;
      }

      // Vérifier si la config est incomplète
      const isIncomplete = !settings || 
        (settings.email_method === 'gmail' && !settings.gmail_connected) ||
        (settings.email_method === 'smtp' && (!settings.smtp_host || !settings.smtp_user)) ||
        !settings.signature_text; // Au moins une signature texte

      // Vérifier si l'utilisateur a déjà dismissé le reminder (stocké localement)
      const dismissedKey = `setup_reminder_dismissed_${userId}`;
      const wasDismissed = localStorage.getItem(dismissedKey) === 'true';

      setShowReminder(isIncomplete && !wasDismissed);
      setIsChecking(false);
    } catch (error) {
      console.error('Error in checkSetupStatus:', error);
      setIsChecking(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowReminder(false);
    // Stocker la dismissal dans localStorage
    localStorage.setItem(`setup_reminder_dismissed_${userId}`, 'true');
  };

  const handleGoToSettings = () => {
    setShowReminder(false);
    onNavigateToSettings();
  };

  if (isChecking || !showReminder || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Fond flou */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" onClick={handleDismiss}></div>

      {/* Modal centré */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto max-w-2xl w-full animate-scaleIn">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header avec gradient */}
            <div className="bg-gradient-to-r from-coral-500 via-sunset-500 to-peach-500 px-8 py-6 relative">
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-white hover:text-coral-100 transition-colors p-2 rounded-lg hover:bg-white/10"
                title="Fermer"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4 pr-12">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Mail className="w-8 h-8 text-coral-600" />
                </div>

                <div className="flex-1">
                  <h3 className="text-white font-bold text-2xl mb-1 flex items-center gap-2">
                    <AlertCircle className="w-6 h-6" />
                    Bienvenue ! Configurez votre compte pour commencer
                  </h3>
                </div>
              </div>
            </div>

            {/* Corps du modal */}
            <div className="px-8 py-6">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                Pour envoyer vos comptes-rendus par email, configurez votre méthode d'envoi et votre signature professionnelle dans les paramètres.
              </p>

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={handleDismiss}
                  className="px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-all duration-200"
                >
                  Plus tard
                </button>

                <button
                  onClick={handleGoToSettings}
                  className="bg-gradient-to-r from-coral-500 to-sunset-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-coral-600 hover:to-sunset-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:scale-105"
                >
                  <Settings className="w-5 h-5" />
                  Configurer maintenant
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

