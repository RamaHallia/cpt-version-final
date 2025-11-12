/*
  # Migration des mots de passe SMTP vers version chiffrée
  
  1. Objectif
    - Migrer les mots de passe SMTP existants en clair vers la version chiffrée
    - Nettoyer les anciens mots de passe en clair pour la sécurité
    
  2. Notes
    - Les fonctions encrypt_smtp_password() et decrypt_smtp_password() doivent déjà exister
    - Cette migration est idempotente (peut être exécutée plusieurs fois)
    - Les utilisateurs avec des mots de passe déjà chiffrés ne seront pas affectés
*/

-- Migrer les mots de passe existants en clair vers la version chiffrée
DO $$
DECLARE
  setting_record RECORD;
  encrypted_pwd bytea;
BEGIN
  -- Pour chaque user_settings qui a un mot de passe SMTP en clair
  FOR setting_record IN 
    SELECT user_id, smtp_password 
    FROM user_settings 
    WHERE smtp_password IS NOT NULL 
      AND smtp_password != '' 
      AND smtp_password_encrypted IS NULL
  LOOP
    -- Chiffrer le mot de passe
    SELECT encrypt_smtp_password(setting_record.smtp_password, setting_record.user_id)
    INTO encrypted_pwd;
    
    -- Mettre à jour avec le mot de passe chiffré et supprimer la version en clair
    UPDATE user_settings
    SET 
      smtp_password_encrypted = encrypted_pwd,
      smtp_password = NULL,
      updated_at = now()
    WHERE user_id = setting_record.user_id;
    
    RAISE NOTICE 'Mot de passe SMTP chiffré pour user %', setting_record.user_id;
  END LOOP;
  
  RAISE NOTICE 'Migration des mots de passe SMTP terminée';
END $$;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN user_settings.smtp_password IS 'Déprécié - Utiliser smtp_password_encrypted';
COMMENT ON COLUMN user_settings.smtp_password_encrypted IS 'Mot de passe SMTP chiffré avec AES-256 (utilisé pour l''envoi d''emails)';

