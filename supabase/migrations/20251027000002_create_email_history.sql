/*
  # Historique des Emails Envoyés
  
  Création d'une table pour stocker l'historique des emails envoyés
  afin que les utilisateurs puissent consulter leurs envois.
*/

-- Créer la table email_history
CREATE TABLE IF NOT EXISTS email_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meeting_id uuid REFERENCES meetings(id) ON DELETE SET NULL,
  
  -- Informations de l'email
  recipients text NOT NULL, -- Liste des destinataires séparés par virgules
  cc_recipients text, -- Liste des CC séparés par virgules
  subject text NOT NULL,
  method text NOT NULL, -- 'gmail', 'smtp', 'local'
  
  -- Contenu
  html_body text,
  attachments_count integer DEFAULT 0,
  total_attachments_size integer, -- Taille en bytes
  
  -- Statut
  status text NOT NULL DEFAULT 'sent', -- 'sent', 'failed'
  error_message text, -- Si échec
  
  -- Gmail/SMTP spécifique
  message_id text, -- ID du message Gmail
  thread_id text, -- ID du thread Gmail
  
  -- Timestamps
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_email_history_user_id ON email_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_history_meeting_id ON email_history(meeting_id);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON email_history(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_history_user_sent ON email_history(user_id, sent_at DESC);

-- RLS (Row Level Security)
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres emails
CREATE POLICY "Users can view own email history"
  ON email_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent insérer leurs propres emails
CREATE POLICY "Users can insert own email history"
  ON email_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres emails
CREATE POLICY "Users can delete own email history"
  ON email_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Commenter la table
COMMENT ON TABLE email_history IS 'Historique des emails envoyés par les utilisateurs';
COMMENT ON COLUMN email_history.recipients IS 'Destinataires principaux (séparés par virgules)';
COMMENT ON COLUMN email_history.method IS 'Méthode d''envoi: gmail, smtp, ou local';
COMMENT ON COLUMN email_history.status IS 'Statut: sent (envoyé) ou failed (échec)';
COMMENT ON COLUMN email_history.total_attachments_size IS 'Taille totale des pièces jointes en bytes';

