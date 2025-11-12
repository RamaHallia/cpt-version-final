/*
  # Auto-update user quota when meeting is created
  
  1. Fonction trigger
    - `update_user_quota_on_meeting_insert()` - Met à jour automatiquement minutes_used_this_month
    - Déclenché à chaque INSERT dans la table meetings
    - Calcule le total des minutes pour le CYCLE DE FACTURATION en cours de l'utilisateur
    
  2. Avantages
    - Synchronisation automatique entre meetings et user_subscriptions
    - Pas besoin de mettre à jour manuellement dans le code
    - Garantit que minutes_used_this_month est toujours à jour
    - Respecte le cycle de facturation individuel de chaque utilisateur
    
  3. Notes
    - Le calcul se fait en temps réel à chaque insertion de réunion
    - Prend en compte uniquement les réunions depuis billing_cycle_start
    - Chaque utilisateur a son propre cycle (basé sur sa date d'inscription)
*/

-- Fonction pour mettre à jour le quota utilisateur quand une réunion est créée
CREATE OR REPLACE FUNCTION update_user_quota_on_meeting_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_minutes_used integer;
  user_cycle_start timestamptz;
BEGIN
  -- Récupérer le début du cycle de facturation de l'utilisateur
  SELECT billing_cycle_start
  INTO user_cycle_start
  FROM user_subscriptions
  WHERE user_id = NEW.user_id;
  
  -- Si pas de cycle trouvé, utiliser le début du mois calendaire comme fallback
  IF user_cycle_start IS NULL THEN
    user_cycle_start := date_trunc('month', CURRENT_TIMESTAMP);
  END IF;
  
  -- Calculer le total des minutes utilisées depuis le début du cycle
  SELECT COALESCE(SUM(ROUND(duration / 60.0)), 0)
  INTO total_minutes_used
  FROM meetings
  WHERE user_id = NEW.user_id
    AND created_at >= user_cycle_start;
  
  -- Mettre à jour user_subscriptions avec le total calculé
  UPDATE user_subscriptions
  SET 
    minutes_used_this_month = total_minutes_used,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  -- Logger pour debug
  RAISE NOTICE 'Quota mis à jour pour user % (cycle depuis %): % minutes', 
    NEW.user_id, user_cycle_start, total_minutes_used;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur la table meetings
DROP TRIGGER IF EXISTS trigger_update_quota_on_meeting_insert ON meetings;

CREATE TRIGGER trigger_update_quota_on_meeting_insert
  AFTER INSERT ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_quota_on_meeting_insert();

-- NOTE: Pas de trigger sur DELETE
-- Raison: Si un utilisateur supprime une réunion de l'historique,
-- il a DÉJÀ consommé ces minutes. On ne doit pas les redonner.
-- Le quota reste tel quel et se réinitialisera au prochain cycle mensuel.

-- NOTE: Pas de trigger sur UPDATE non plus
-- Raison: Si la durée d'une réunion change (modification manuelle),
-- les minutes ont déjà été consommées lors de l'enregistrement.
-- Modifier la durée après coup ne doit pas affecter le quota consommé.

-- Backfill: Recalculer les quotas pour tous les utilisateurs existants
DO $$
DECLARE
  user_record RECORD;
  total_minutes integer;
BEGIN
  -- Pour chaque utilisateur ayant un abonnement
  FOR user_record IN 
    SELECT user_id, billing_cycle_start FROM user_subscriptions
  LOOP
    -- Calculer le total des minutes depuis le début de leur cycle
    SELECT COALESCE(SUM(ROUND(duration / 60.0)), 0)
    INTO total_minutes
    FROM meetings
    WHERE user_id = user_record.user_id
      AND created_at >= user_record.billing_cycle_start;
    
    -- Mettre à jour l'abonnement
    UPDATE user_subscriptions
    SET 
      minutes_used_this_month = total_minutes,
      updated_at = now()
    WHERE user_id = user_record.user_id;
    
    RAISE NOTICE 'Backfill: User % - % minutes depuis %', 
      user_record.user_id, total_minutes, user_record.billing_cycle_start;
  END LOOP;
END $$;
