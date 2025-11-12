/*
  # Expiration Automatique des Audios (24h)
  
  Ajoute un système d'expiration pour les fichiers audio :
  - Colonne audio_expires_at pour marquer l'expiration
  - Trigger automatique pour définir l'expiration à la création
  - Fonction de nettoyage pour supprimer les audios expirés
  - CRON job pour exécuter le nettoyage toutes les heures
*/

-- 1️⃣ Ajouter la colonne audio_expires_at
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS audio_expires_at timestamptz;

-- Commenter la colonne
COMMENT ON COLUMN meetings.audio_expires_at IS 'Date d''expiration de l''audio (24h après création)';

-- 2️⃣ Fonction pour définir l'expiration automatiquement
CREATE OR REPLACE FUNCTION set_audio_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si un audio_url existe, définir l'expiration à 24h après la création
  IF NEW.audio_url IS NOT NULL AND NEW.audio_url != '' THEN
    NEW.audio_expires_at := NEW.created_at + interval '24 hours';
    RAISE NOTICE 'Audio expiration définie pour %: %', NEW.id, NEW.audio_expires_at;
  ELSE
    NEW.audio_expires_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3️⃣ Trigger sur INSERT et UPDATE
DROP TRIGGER IF EXISTS trigger_set_audio_expiration ON meetings;

CREATE TRIGGER trigger_set_audio_expiration
  BEFORE INSERT OR UPDATE OF audio_url
  ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION set_audio_expiration();

-- 4️⃣ Fonction de nettoyage des audios expirés
CREATE OR REPLACE FUNCTION cleanup_expired_audios()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count integer := 0;
  expired_record RECORD;
BEGIN
  RAISE NOTICE '🧹 Démarrage du nettoyage des audios expirés...';

  -- Trouver tous les meetings avec audio expiré
  FOR expired_record IN
    SELECT id, audio_url, audio_expires_at, title
    FROM meetings
    WHERE audio_url IS NOT NULL
      AND audio_url != ''
      AND audio_expires_at IS NOT NULL
      AND audio_expires_at <= now()
  LOOP
    RAISE NOTICE '🗑️ Suppression audio expiré: % (réunion: %)', expired_record.id, expired_record.title;
    
    -- Supprimer le fichier du storage Supabase
    -- Note: La suppression du storage se fait via la politique RLS ou manuellement
    -- Ici on supprime juste l'URL de la DB
    
    UPDATE meetings
    SET 
      audio_url = NULL,
      audio_expires_at = NULL,
      updated_at = now()
    WHERE id = expired_record.id;
    
    expired_count := expired_count + 1;
  END LOOP;

  RAISE NOTICE '✅ Nettoyage terminé: % audio(s) supprimé(s)', expired_count;
  
  -- Log dans une table dédiée (optionnel)
  -- INSERT INTO cleanup_logs (action, count, created_at) 
  -- VALUES ('cleanup_expired_audios', expired_count, now());
END;
$$;

-- 5️⃣ Vérifier que pg_cron est activé
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 6️⃣ Supprimer l'ancien job s'il existe (éviter erreur)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-expired-audios');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Job cleanup-expired-audios n''existait pas, on continue...';
END $$;

-- 7️⃣ Planifier le nettoyage automatique toutes les heures
SELECT cron.schedule(
  'cleanup-expired-audios',     -- nom du job
  '0 * * * *',                  -- CRON: toutes les heures à :00
  $$SELECT cleanup_expired_audios();$$ -- fonction à exécuter
);

-- 8️⃣ Backfill: Définir l'expiration pour les audios existants
UPDATE meetings
SET audio_expires_at = created_at + interval '24 hours'
WHERE audio_url IS NOT NULL
  AND audio_url != ''
  AND audio_expires_at IS NULL;

-- Message de confirmation
DO $$
DECLARE
  backfilled_count integer;
BEGIN
  SELECT COUNT(*) INTO backfilled_count
  FROM meetings
  WHERE audio_expires_at IS NOT NULL;
  
  RAISE NOTICE '✅ Migration terminée: % réunion(s) avec expiration définie', backfilled_count;
END $$;

