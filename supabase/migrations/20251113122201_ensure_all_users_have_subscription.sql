/*
  # S'assurer que tous les utilisateurs ont un abonnement

  1. Action
    - Créer un abonnement starter par défaut pour tous les utilisateurs sans abonnement
    
  2. Détails
    - Plan: starter (39€/mois)
    - Quota: 600 minutes
    - Actif par défaut
*/

-- Insérer un abonnement pour tous les utilisateurs qui n'en ont pas
INSERT INTO user_subscriptions (
  user_id,
  plan_type,
  minutes_quota,
  minutes_used_this_month,
  is_active,
  billing_cycle_start,
  billing_cycle_end
)
SELECT 
  u.id,
  'starter',
  600,
  0,
  true,
  now(),
  now() + interval '1 month'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 
  FROM user_subscriptions us 
  WHERE us.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;
