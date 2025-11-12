-- Ajout du suivi d'ouverture des emails

ALTER TABLE email_history
  ADD COLUMN IF NOT EXISTS tracking_id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS first_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_opened_recipient text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_history_tracking_id
  ON email_history(tracking_id);

CREATE TABLE IF NOT EXISTS email_open_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_history_id uuid NOT NULL REFERENCES email_history(id) ON DELETE CASCADE,
  recipient_email text,
  opened_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

ALTER TABLE email_open_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own email open events"
  ON email_open_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM email_history
      WHERE email_history.id = email_open_events.email_history_id
        AND email_history.user_id = auth.uid()
    )
  );

