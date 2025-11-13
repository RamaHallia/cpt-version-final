/*
  # Create Contact Groups and Contacts Tables

  1. New Tables
    - `contact_groups`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text) - Group name
      - `description` (text, nullable) - Optional group description
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `contacts`
      - `id` (uuid, primary key)
      - `group_id` (uuid, foreign key to contact_groups)
      - `name` (text) - Contact name
      - `email` (text) - Contact email address
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own contact groups and contacts
    - Users can only access their own contact groups and related contacts

  3. Indexes
    - Add index on user_id for faster lookups
    - Add index on group_id for faster contact queries
*/

-- Create contact_groups table
CREATE TABLE IF NOT EXISTS contact_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES contact_groups(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contact_groups_user_id ON contact_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_group_id ON contacts(group_id);

-- Enable RLS
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Contact Groups Policies
CREATE POLICY "Users can view own contact groups"
  ON contact_groups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contact groups"
  ON contact_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contact groups"
  ON contact_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contact groups"
  ON contact_groups FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Contacts Policies
CREATE POLICY "Users can view contacts in own groups"
  ON contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contact_groups
      WHERE contact_groups.id = contacts.group_id
      AND contact_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contacts in own groups"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contact_groups
      WHERE contact_groups.id = contacts.group_id
      AND contact_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contacts in own groups"
  ON contacts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contact_groups
      WHERE contact_groups.id = contacts.group_id
      AND contact_groups.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contact_groups
      WHERE contact_groups.id = contacts.group_id
      AND contact_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contacts in own groups"
  ON contacts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contact_groups
      WHERE contact_groups.id = contacts.group_id
      AND contact_groups.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_group_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_contact_groups_updated_at ON contact_groups;
CREATE TRIGGER update_contact_groups_updated_at
  BEFORE UPDATE ON contact_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_group_updated_at();