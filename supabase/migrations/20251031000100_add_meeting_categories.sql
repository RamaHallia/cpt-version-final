/*
  # Meeting categories

  1. Create table `meeting_categories`
      - `id` uuid primary key
      - `user_id` references auth.users
      - `name` text
      - `created_at` timestamp
  2. Add optional `category_id` column to `meetings`
  3. Apply RLS policies so users can manage their own categories and update meetings
*/

-- Create meeting_categories table
CREATE TABLE IF NOT EXISTS meeting_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meeting_categories_user_id ON meeting_categories(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_categories_user_name
  ON meeting_categories(user_id, lower(name));

ALTER TABLE meeting_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meeting categories"
  ON meeting_categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meeting categories"
  ON meeting_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meeting categories"
  ON meeting_categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meeting categories"
  ON meeting_categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add optional category_id column to meetings
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES meeting_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_meetings_category_id ON meetings(category_id);

COMMENT ON TABLE meeting_categories IS 'Categories defined by users to classify their meetings';
COMMENT ON COLUMN meeting_categories.name IS 'Category label (unique per user)';
COMMENT ON COLUMN meetings.category_id IS 'Optional link to meeting_categories';

