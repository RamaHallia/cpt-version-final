-- Script de débogage pour vérifier les quotas
-- À exécuter dans Supabase SQL Editor

-- 1. Afficher les quotas actuels dans user_subscriptions
SELECT 
  user_id,
  plan_type,
  minutes_quota,
  minutes_used_this_month,
  billing_cycle_start,
  billing_cycle_end
FROM user_subscriptions
ORDER BY minutes_used_this_month DESC;

-- 2. Calculer les VRAIES minutes depuis les meetings
WITH real_usage AS (
  SELECT 
    m.user_id,
    us.billing_cycle_start,
    COUNT(*) as meeting_count,
    ROUND(SUM(m.duration / 60.0)) as calculated_minutes
  FROM meetings m
  JOIN user_subscriptions us ON m.user_id = us.user_id
  WHERE m.created_at >= us.billing_cycle_start
    AND m.created_at < us.billing_cycle_start + interval '1 month'
  GROUP BY m.user_id, us.billing_cycle_start
)
SELECT 
  us.user_id,
  us.plan_type,
  us.minutes_used_this_month as "DB_quota",
  ru.calculated_minutes as "Vraies_minutes_depuis_meetings",
  ru.meeting_count as "Nombre_meetings",
  CASE 
    WHEN us.minutes_used_this_month != ru.calculated_minutes 
    THEN '❌ INCOHÉRENT'
    ELSE '✅ OK'
  END as status
FROM user_subscriptions us
LEFT JOIN real_usage ru ON us.user_id = ru.user_id
ORDER BY ru.calculated_minutes DESC;

-- 3. Afficher les détails des meetings pour votre user
-- (Remplacer 'VOTRE_USER_ID' par votre vrai ID)
/*
SELECT 
  title,
  duration,
  ROUND(duration / 60.0) as minutes,
  created_at,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as date_formatee
FROM meetings
WHERE user_id = 'VOTRE_USER_ID'
  AND created_at >= (
    SELECT billing_cycle_start 
    FROM user_subscriptions 
    WHERE user_id = 'VOTRE_USER_ID'
  )
ORDER BY created_at DESC;
*/

