-- Script pour corriger IMMÉDIATEMENT votre quota
-- À exécuter dans Supabase SQL Editor MAINTENANT

-- ÉTAPE 1: Identifier votre user_id
-- Exécutez d'abord cette requête pour trouver votre user_id:
/*
SELECT 
  id as user_id,
  email
FROM auth.users
WHERE email = 'VOTRE_EMAIL@example.com'; -- Remplacer par votre email
*/

-- ÉTAPE 2: Une fois que vous avez votre user_id, décommentez et exécutez:
/*
DO $$
DECLARE
  target_user_id uuid := 'VOTRE_USER_ID_ICI'; -- ⚠️ REMPLACER
  total_minutes integer;
  cycle_start timestamptz;
BEGIN
  -- Récupérer le début du cycle
  SELECT billing_cycle_start INTO cycle_start
  FROM user_subscriptions
  WHERE user_id = target_user_id;
  
  -- Calculer les VRAIES minutes
  SELECT COALESCE(SUM(ROUND(duration / 60.0)), 0)
  INTO total_minutes
  FROM meetings
  WHERE user_id = target_user_id
    AND created_at >= cycle_start
    AND created_at < cycle_start + interval '1 month';
  
  -- Mettre à jour
  UPDATE user_subscriptions
  SET minutes_used_this_month = total_minutes,
      updated_at = now()
  WHERE user_id = target_user_id;
  
  RAISE NOTICE '✅ Quota corrigé: % minutes (depuis %)', total_minutes, cycle_start;
END $$;
*/

-- ÉTAPE 3: Vérifier le résultat
/*
SELECT 
  plan_type,
  minutes_used_this_month,
  minutes_quota,
  billing_cycle_start
FROM user_subscriptions
WHERE user_id = 'VOTRE_USER_ID_ICI'; -- ⚠️ REMPLACER
*/

