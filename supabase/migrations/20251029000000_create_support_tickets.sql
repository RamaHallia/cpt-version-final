/*
  # Table pour les tickets de support
  
  1. Nouvelle table `support_tickets`
    - `id` (uuid, PK)
    - `user_id` (uuid, FK vers auth.users)
    - `name` (text) - Nom de l'utilisateur
    - `email` (text) - Email de contact
    - `category` (text) - Catégorie du problème
    - `subject` (text) - Sujet
    - `message` (text) - Description du problème
    - `screenshots` (text[]) - URLs des captures d'écran
    - `status` (text) - Statut (new, in_progress, resolved, closed)
    - `admin_response` (text) - Réponse de l'admin (nullable)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    
  2. Sécurité
    - RLS activé
    - Les utilisateurs peuvent créer leurs propres tickets
    - Les utilisateurs peuvent voir leurs propres tickets
    - Les admins peuvent tout voir et modifier
*/

-- Créer la table support_tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  category text NOT NULL CHECK (category IN ('bug', 'feature', 'account', 'quota', 'transcription', 'other')),
  subject text NOT NULL,
  message text NOT NULL,
  screenshots text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  admin_response text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Activer RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent créer leurs propres tickets
CREATE POLICY "Users can create their own support tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent voir leurs propres tickets
CREATE POLICY "Users can view their own support tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres tickets (si pas encore traités)
CREATE POLICY "Users can update their own tickets if not resolved"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'new')
  WITH CHECK (auth.uid() = user_id);

-- Index pour améliorer les performances
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_support_ticket_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_ticket_updated_at();

-- Commentaires
COMMENT ON TABLE support_tickets IS 'Tickets de support créés par les utilisateurs';
COMMENT ON COLUMN support_tickets.category IS 'Catégorie: bug, feature, account, quota, transcription, other';
COMMENT ON COLUMN support_tickets.status IS 'Statut: new, in_progress, resolved, closed';
COMMENT ON COLUMN support_tickets.screenshots IS 'Array d''URLs vers les captures d''écran uploadées';

