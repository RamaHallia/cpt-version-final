-- Script de diagnostic pour vérifier les incohérences de dates
-- À exécuter dans Supabase SQL Editor

-- 1. Afficher les dates importantes pour votre compte
-- (Remplacer 'VOTRE_EMAIL' par votre email)
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as date_inscription,
  us.billing_cycle_start,
  us.billing_cycle_end,
  us.created_at as subscription_created_at
FROM auth.users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
WHERE u.email = 'VOTRE_EMAIL@example.com'  -- ⚠️ REMPLACER
ORDER BY u.created_at DESC;

-- 2. Compter les réunions selon différentes périodes
-- (Remplacer 'VOTRE_USER_ID' une fois que vous l'avez)
WITH dates AS (
  SELECT 
    user_id,
    billing_cycle_start,
    (SELECT created_at FROM auth.users WHERE id = user_id) as real_signup_date,
    date_trunc('month', CURRENT_TIMESTAMP) as calendar_month_start
  FROM user_subscriptions
  WHERE user_id = 'VOTRE_USER_ID'  -- ⚠️ REMPLACER
)
SELECT 
  d.billing_cycle_start,
  d.real_signup_date,
  d.calendar_month_start,
  
  -- Compter selon billing_cycle_start
  (SELECT COUNT(*) FROM meetings 
   WHERE user_id = d.user_id AND created_at >= d.billing_cycle_start) 
   as meetings_since_billing_cycle,
  
  -- Compter selon signup_date
  (SELECT COUNT(*) FROM meetings 
   WHERE user_id = d.user_id AND created_at >= d.real_signup_date) 
   as meetings_since_signup,
  
  -- Compter selon mois calendaire
  (SELECT COUNT(*) FROM meetings 
   WHERE user_id = d.user_id AND created_at >= d.calendar_month_start) 
   as meetings_this_calendar_month,
  
  -- Total
  (SELECT COUNT(*) FROM meetings WHERE user_id = d.user_id) 
   as total_meetings
FROM dates d;

-- 3. Afficher les premières réunions pour voir les dates
SELECT 
  title,
  created_at,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI:SS') as date_formatee
FROM meetings
WHERE user_id = 'VOTRE_USER_ID'  -- ⚠️ REMPLACER
ORDER BY created_at ASC
LIMIT 5;

-- 4. Afficher les dernières réunions
SELECT 
  title,
  created_at,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI:SS') as date_formatee
FROM meetings
WHERE user_id = 'VOTRE_USER_ID'  -- ⚠️ REMPLACER
ORDER BY created_at DESC
LIMIT 5;

