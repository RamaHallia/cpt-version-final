import { useState, useEffect } from 'react';
import { X, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProcessingStatusModalProps {
  userId: string;
  onOpenReport: (meetingId: string) => void;
}

interface ProcessingTask {
  id: string;
  meeting_id: string | null;
  status: 'processing' | 'completed' | 'error';
  progress: string;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export const ProcessingStatusModal = ({ userId, onOpenReport }: ProcessingStatusModalProps) => {
  const [tasks, setTasks] = useState<ProcessingTask[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNewCompletion, setHasNewCompletion] = useState(false);

  useEffect(() => {
    // Charger immédiatement au montage
    loadTasks();

    // Polling de secours toutes les 5 secondes (suffisant pour suivre l'état sans spammer les logs)
    const interval = setInterval(() => {
      console.log('🔄 Polling background_tasks...');
      loadTasks();
    }, 5000);

    // Écouter les changements en temps réel (avec protection contre les erreurs)
    let subscription: ReturnType<typeof supabase.channel> | null = null;

    try {
      const channel = `background_tasks_${userId}_${Date.now()}`;
      console.log('🎧 Souscription Realtime:', channel);

      subscription = supabase
        .channel(channel)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'background_tasks',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('🔔 Changement de tâche détecté:', payload);
            loadTasks();

            // Si une tâche est complétée, notifier
            if (payload.new && (payload.new as any).status === 'completed') {
              setHasNewCompletion(true);
              setTimeout(() => setHasNewCompletion(false), 3000);
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Statut Realtime:', status);
        });
    } catch (error) {
      console.warn('⚠️ Erreur Realtime (non bloquante):', error);
    }

    return () => {
      console.log('🧹 Nettoyage ProcessingStatusModal');
      clearInterval(interval);
      if (subscription) {
        try {
          supabase.removeChannel(subscription);
        } catch (error) {
          console.warn('⚠️ Erreur nettoyage Realtime:', error);
        }
      }
    };
  }, [userId]);

  const loadTasks = async () => {
    console.log('📥 Chargement des tâches pour user:', userId);
    
    const { data, error } = await supabase
      .from('background_tasks')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['processing', 'completed'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Erreur chargement tâches:', error);
      return;
    }

    console.log('✅ Tâches chargées:', data?.length || 0, 'tâches', data);
    
    // Détecter les tâches orphelines (processing depuis plus de 5 minutes)
    const now = new Date().getTime();
    const orphanedTasks = (data || []).filter(task => {
      if (task.status !== 'processing') return false;
      const taskAge = now - new Date(task.created_at).getTime();
      return taskAge > 5 * 60 * 1000; // Plus de 5 minutes
    });

    // Nettoyer automatiquement les tâches orphelines
    if (orphanedTasks.length > 0) {
      console.warn('⚠️ Tâches orphelines détectées:', orphanedTasks.length);
      for (const task of orphanedTasks) {
        await supabase
          .from('background_tasks')
          .update({ 
            status: 'error', 
            error: 'Traitement interrompu (page rafraîchie). Veuillez réessayer.' 
          })
          .eq('id', task.id);
      }
      // Recharger après cleanup
      const { data: cleanData } = await supabase
        .from('background_tasks')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['processing', 'completed'])
        .order('created_at', { ascending: false })
        .limit(5);
      setTasks(cleanData || []);
    } else {
      setTasks(data || []);
    }
  };

  const handleDismissTask = async (taskId: string) => {
    // Marquer la tâche comme "dismissed" (ou la supprimer)
    await supabase
      .from('background_tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);
    
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const activeTasks = tasks.filter(t => t.status === 'processing');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Ne rien afficher si aucune tâche
  if (tasks.length === 0) return null;

  // Version minimisée (coin inférieur droit)
  if (isMinimized) {
    const activeCount = activeTasks.length;
    const completedCount = completedTasks.length;

    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className={`relative flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl transition-all ${
            activeCount > 0
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white animate-pulse'
              : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
          }`}
        >
          {activeCount > 0 ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-semibold">{activeCount} en cours</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">{completedCount} terminé{completedCount > 1 ? 's' : ''}</span>
            </>
          )}
          {hasNewCompletion && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
          )}
        </button>
      </div>
    );
  }

  // Version complète
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-slideUp">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-coral-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-coral-500 to-sunset-500 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-white" />
            <div>
              <h3 className="font-bold text-white text-lg">Traitement en cours</h3>
              <p className="text-white/80 text-sm">
                {activeTasks.length} actif{activeTasks.length > 1 ? 's' : ''} · {completedTasks.length} terminé{completedTasks.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-3">
          {/* Tâches en cours */}
          {activeTasks.map((task) => (
            <div
              key={task.id}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200"
            >
              <div className="flex items-start gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-blue-900 text-sm">
                    Traitement en cours...
                  </p>
                  <p className="text-blue-700 text-xs mt-1 line-clamp-2">
                    {task.progress || 'Préparation...'}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Tâches terminées */}
          {completedTasks.map((task) => (
            <div
              key={task.id}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-green-900 text-sm">✅ Terminé !</p>
                  <p className="text-green-700 text-xs mt-1">
                    {task.progress || 'Rapport prêt'}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    {task.meeting_id ? (
                      <button
                        onClick={() => onOpenReport(task.meeting_id!)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold text-sm hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
                      >
                        Ouvrir le rapport
                      </button>
                    ) : (
                      <p className="flex-1 text-xs text-gray-600 italic">Aucune réunion associée</p>
                    )}
                    <button
                      onClick={() => handleDismissTask(task.id)}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

