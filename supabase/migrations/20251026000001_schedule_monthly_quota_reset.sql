/*
  # Schedule automatic monthly quota reset
  
  1. Configuration du CRON
    - Exécute reset_monthly_quotas() automatiquement TOUS LES JOURS à minuit
    - Utilise l'extension pg_cron de Supabase
    
  2. Notes
    - La fonction reset_monthly_quotas() existe déjà (créée dans 20251023134243)
    - Elle vérifie billing_cycle_end < now() donc réinitialise uniquement les utilisateurs dont le cycle est terminé
    - Exécution quotidienne permet de respecter la date d'inscription de chaque utilisateur
    - Format CRON: '0 0 * * *' = À minuit (00:00) tous les jours
    
  3. Exemples
    - User A inscrit le 5 janvier → cycle: 5 janv → 5 févr → réinitialisation le 5 février
    - User B inscrit le 20 janvier → cycle: 20 janv → 20 févr → réinitialisation le 20 février
*/

-- Activer l'extension pg_cron si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Supprimer l'ancien job s'il existe (ignorer l'erreur s'il n'existe pas)
DO $$
BEGIN
  PERFORM cron.unschedule('monthly-quota-reset');
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorer l'erreur si le job n'existe pas
    RAISE NOTICE 'Job monthly-quota-reset n''existait pas, on continue...';
END $$;

-- Planifier la réinitialisation des quotas
-- Tous les jours à minuit (UTC) - La fonction vérifie billing_cycle_end pour chaque utilisateur
SELECT cron.schedule(
  'monthly-quota-reset',           -- nom du job
  '0 0 * * *',                      -- CRON: 00:00 tous les jours
  $$SELECT reset_monthly_quotas();$$ -- fonction à exécuter
);

-- Ajouter un commentaire pour la documentation
COMMENT ON EXTENSION pg_cron IS 'Scheduler automatique pour la réinitialisation mensuelle des quotas utilisateur';

