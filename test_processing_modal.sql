-- Script de test pour ProcessingStatusModal
-- Ce script permet de simuler des tâches en cours et terminées

-- 1. Voir toutes les tâches existantes
SELECT 
  id,
  user_id,
  type,
  status,
  progress,
  meeting_id,
  created_at,
  updated_at
FROM background_tasks
ORDER BY created_at DESC
LIMIT 10;

-- 2. Compter les tâches par statut
SELECT 
  status,
  COUNT(*) as count
FROM background_tasks
GROUP BY status;

-- 3. Nettoyer les anciennes tâches terminées (plus de 1 heure)
-- ATTENTION : Décommenter pour exécuter
/*
DELETE FROM background_tasks
WHERE status IN ('completed', 'error')
  AND created_at < NOW() - INTERVAL '1 hour';
*/

-- 4. Créer une tâche de test (SIMULATION)
-- Remplacer 'VOTRE_USER_ID' et 'VOTRE_MEETING_ID'
-- ATTENTION : Décommenter pour exécuter
/*
INSERT INTO background_tasks (user_id, type, status, progress, meeting_id)
VALUES (
  'VOTRE_USER_ID',
  'upload_transcription',
  'processing',
  'Test de traitement en cours...',
  'VOTRE_MEETING_ID'
);
*/

-- 5. Marquer une tâche comme terminée (SIMULATION)
-- Remplacer 'TASK_ID'
-- ATTENTION : Décommenter pour exécuter
/*
UPDATE background_tasks
SET 
  status = 'completed',
  progress = 'Test terminé avec succès !',
  updated_at = NOW()
WHERE id = 'TASK_ID';
*/

-- 6. Voir les tâches d'un utilisateur spécifique
-- Remplacer 'VOTRE_USER_ID'
/*
SELECT 
  id,
  type,
  status,
  progress,
  meeting_id,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as age_minutes
FROM background_tasks
WHERE user_id = 'VOTRE_USER_ID'
  AND status IN ('processing', 'completed')
ORDER BY created_at DESC
LIMIT 5;
*/

