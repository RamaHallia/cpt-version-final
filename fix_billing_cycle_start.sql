-- Script pour corriger billing_cycle_start et billing_cycle_end
-- À exécuter APRÈS avoir identifié le problème avec diagnostic_dates.sql

-- OPTION 1: Aligner billing_cycle_start sur la date de la PREMIÈRE réunion
-- (Si vous avez commencé à utiliser l'app dès l'inscription)
DO $$
DECLARE
  target_user_id uuid := 'VOTRE_USER_ID';  -- ⚠️ REMPLACER
  first_meeting_date timestamptz;
BEGIN
  -- Trouver la date de la première réunion
  SELECT MIN(created_at) INTO first_meeting_date
  FROM meetings
  WHERE user_id = target_user_id;
  
  -- Mettre à jour billing_cycle_start
  UPDATE user_subscriptions
  SET 
    billing_cycle_start = first_meeting_date,
    billing_cycle_end = first_meeting_date + interval '1 month',
    updated_at = now()
  WHERE user_id = target_user_id;
  
  RAISE NOTICE '✅ billing_cycle_start mis à jour: %', first_meeting_date;
  RAISE NOTICE '✅ billing_cycle_end mis à jour: %', first_meeting_date + interval '1 month';
END $$;

-- OPTION 2: Aligner billing_cycle_start sur la date d'inscription
-- (Si vous voulez partir de la vraie date d'inscription)
/*
DO $$
DECLARE
  target_user_id uuid := 'VOTRE_USER_ID';  -- ⚠️ REMPLACER
  signup_date timestamptz;
BEGIN
  -- Trouver la date d'inscription
  SELECT created_at INTO signup_date
  FROM auth.users
  WHERE id = target_user_id;
  
  -- Mettre à jour billing_cycle_start
  UPDATE user_subscriptions
  SET 
    billing_cycle_start = signup_date,
    billing_cycle_end = signup_date + interval '1 month',
    updated_at = now()
  WHERE user_id = target_user_id;
  
  RAISE NOTICE '✅ billing_cycle_start mis à jour: %', signup_date;
  RAISE NOTICE '✅ billing_cycle_end mis à jour: %', signup_date + interval '1 month';
END $$;
*/

-- APRÈS correction, recalculer le quota pour ce cycle
DO $$
DECLARE
  target_user_id uuid := 'VOTRE_USER_ID';  -- ⚠️ REMPLACER (même ID)
  total_minutes integer;
  cycle_start timestamptz;
  meeting_count integer;
BEGIN
  -- Récupérer le nouveau cycle_start
  SELECT billing_cycle_start INTO cycle_start
  FROM user_subscriptions
  WHERE user_id = target_user_id;
  
  -- Recalculer les minutes
  SELECT 
    COUNT(*),
    COALESCE(SUM(ROUND(duration / 60.0)), 0)
  INTO meeting_count, total_minutes
  FROM meetings
  WHERE user_id = target_user_id
    AND created_at >= cycle_start
    AND created_at < cycle_start + interval '1 month';
  
  -- Mettre à jour
  UPDATE user_subscriptions
  SET minutes_used_this_month = total_minutes
  WHERE user_id = target_user_id;
  
  RAISE NOTICE '✅ Quota recalculé: % minutes (% réunions)', total_minutes, meeting_count;
END $$;

-- Vérification finale
SELECT 
  billing_cycle_start,
  billing_cycle_end,
  minutes_used_this_month,
  (SELECT COUNT(*) FROM meetings 
   WHERE user_id = user_subscriptions.user_id 
   AND created_at >= billing_cycle_start) as meetings_in_cycle,
  (SELECT COUNT(*) FROM meetings 
   WHERE user_id = user_subscriptions.user_id) as total_meetings
FROM user_subscriptions
WHERE user_id = 'VOTRE_USER_ID';  -- ⚠️ REMPLACER

