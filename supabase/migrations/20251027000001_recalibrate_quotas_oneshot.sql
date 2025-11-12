/*
  # Recalibrage One-Shot des Quotas
  
  À exécuter UNE SEULE FOIS après avoir appliqué le fix du trigger.
  
  Objectif:
  - Recalculer correctement tous les quotas existants
  - Prendre en compte uniquement les meetings depuis billing_cycle_start
  - Après cette migration, le nouveau trigger (incrémentation) prendra le relais
  
  NOTE: Cette migration recalcule une DERNIÈRE fois.
  Après, le trigger incrémente uniquement (pas de recalcul).
*/

-- Recalculer les quotas pour tous les utilisateurs
DO $$
DECLARE
  user_record RECORD;
  total_minutes integer;
  meeting_count integer;
BEGIN
  RAISE NOTICE '🔄 Début du recalibrage des quotas...';
  
  -- Pour chaque utilisateur ayant un abonnement
  FOR user_record IN 
    SELECT user_id, billing_cycle_start, plan_type FROM user_subscriptions
  LOOP
    -- Compter les meetings dans le cycle actuel
    SELECT 
      COUNT(*),
      COALESCE(SUM(ROUND(duration / 60.0)), 0)
    INTO meeting_count, total_minutes
    FROM meetings
    WHERE user_id = user_record.user_id
      AND created_at >= user_record.billing_cycle_start
      AND created_at < user_record.billing_cycle_start + interval '1 month';
    
    -- Mettre à jour l'abonnement
    UPDATE user_subscriptions
    SET 
      minutes_used_this_month = total_minutes,
      updated_at = now()
    WHERE user_id = user_record.user_id;
    
    RAISE NOTICE '✅ User % (%) : % meetings, % minutes depuis %', 
      user_record.user_id, 
      user_record.plan_type,
      meeting_count,
      total_minutes, 
      user_record.billing_cycle_start;
  END LOOP;
  
  RAISE NOTICE '✅ Recalibrage terminé ! À partir de maintenant, le trigger incrémente uniquement.';
END $$;

-- Vérification: Afficher un résumé
DO $$
DECLARE
  total_users integer;
  total_starter integer;
  total_unlimited integer;
  avg_minutes_starter numeric;
BEGIN
  SELECT COUNT(*) INTO total_users FROM user_subscriptions;
  SELECT COUNT(*) INTO total_starter FROM user_subscriptions WHERE plan_type = 'starter';
  SELECT COUNT(*) INTO total_unlimited FROM user_subscriptions WHERE plan_type = 'unlimited';
  
  SELECT AVG(minutes_used_this_month) 
  INTO avg_minutes_starter 
  FROM user_subscriptions 
  WHERE plan_type = 'starter' AND minutes_used_this_month > 0;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📊 RÉSUMÉ DU RECALIBRAGE';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Total utilisateurs: %', total_users;
  RAISE NOTICE 'Plan Starter: %', total_starter;
  RAISE NOTICE 'Plan Unlimited: %', total_unlimited;
  RAISE NOTICE 'Moyenne minutes (Starter): % min', ROUND(avg_minutes_starter, 0);
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

