/*
  # Fix: Quota ne doit PAS diminuer lors de suppression
  
  Problème:
  - L'ancien trigger recalcule le TOTAL à chaque INSERT
  - Si l'utilisateur supprime une réunion, le prochain INSERT recalcule et diminue le quota
  - Les minutes consommées ne doivent JAMAIS être restituées
  
  Solution:
  - Nouvelle logique: INCRÉMENTER uniquement lors de l'INSERT
  - Ne plus recalculer le total (sauf au reset mensuel)
  - Les suppressions n'affectent plus le quota
*/

-- Nouvelle fonction: INCRÉMENTER au lieu de RECALCULER
CREATE OR REPLACE FUNCTION update_user_quota_on_meeting_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  meeting_minutes integer;
BEGIN
  -- Calculer les minutes de cette réunion uniquement
  meeting_minutes := ROUND(NEW.duration / 60.0);
  
  -- INCRÉMENTER le compteur existant (ne pas recalculer le total)
  UPDATE user_subscriptions
  SET 
    minutes_used_this_month = COALESCE(minutes_used_this_month, 0) + meeting_minutes,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  -- Logger pour debug
  RAISE NOTICE 'Quota incrémenté pour user %: +% minutes', 
    NEW.user_id, meeting_minutes;
  
  RETURN NEW;
END;
$$;

-- Le trigger reste le même (AFTER INSERT)
-- Pas besoin de recréer, la fonction est déjà liée

COMMENT ON FUNCTION update_user_quota_on_meeting_insert() IS 
  'Incrémente minutes_used_this_month lors de l''insertion d''une réunion. Ne recalcule PAS le total pour éviter que les suppressions diminuent le quota.';

-- Note importante:
-- Les minutes consommées sont DÉFINITIVES
-- Supprimer une réunion de l'historique ne restitue PAS les minutes
-- Le quota se réinitialise uniquement au prochain cycle mensuel (via reset_monthly_quotas)

