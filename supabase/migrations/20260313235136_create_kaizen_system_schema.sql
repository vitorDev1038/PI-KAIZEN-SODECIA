/*
  # Kaizen Flow - Complete Database Schema

  ## Overview
  This migration creates the complete database structure for the Kaizen Flow system,
  a web-based continuous improvement management platform.

  ## New Tables

  ### 1. profiles
  Stores extended user information beyond auth.users
  - `id` (uuid, FK to auth.users) - User identifier
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `role` (text) - User role: 'employee' or 'admin'
  - `points` (integer) - Gamification points earned
  - `is_active` (boolean) - Account status
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. categories
  Predefined categories for kaizens
  - `id` (uuid, PK) - Category identifier
  - `name` (text) - Category name
  - `description` (text) - Category description
  - `color` (text) - Badge color for UI
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. kaizens
  Main table for improvement ideas
  - `id` (uuid, PK) - Kaizen identifier
  - `title` (text) - Kaizen title
  - `category_id` (uuid, FK) - Category reference
  - `problem` (text) - Problem identified
  - `suggestion` (text) - Improvement suggestion
  - `benefits` (text) - Expected benefits
  - `image_url` (text) - Optional attached image
  - `status` (text) - Current status: 'pending', 'approved', 'rejected', 'under_review'
  - `employee_id` (uuid, FK) - Submitter reference
  - `created_at` (timestamptz) - Submission timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. comments
  Feedback and communication thread for each kaizen
  - `id` (uuid, PK) - Comment identifier
  - `kaizen_id` (uuid, FK) - Related kaizen
  - `user_id` (uuid, FK) - Comment author
  - `content` (text) - Comment text
  - `is_feedback` (boolean) - Whether this is official admin feedback
  - `created_at` (timestamptz) - Comment timestamp

  ## Security
  - Enable RLS on all tables
  - Employees can view and create their own kaizens
  - Admins can view and manage all kaizens
  - Comments are visible to kaizen owners and admins
  - Categories are readable by all authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  points integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  color text DEFAULT 'blue',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create kaizens table
CREATE TABLE IF NOT EXISTS kaizens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  problem text NOT NULL,
  suggestion text NOT NULL,
  benefits text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kaizens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their own kaizens"
  ON kaizens FOR SELECT
  TO authenticated
  USING (auth.uid() = employee_id);

CREATE POLICY "Admins can view all kaizens"
  ON kaizens FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Employees can create kaizens"
  ON kaizens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can update their own pending kaizens"
  ON kaizens FOR UPDATE
  TO authenticated
  USING (auth.uid() = employee_id AND status = 'under_review')
  WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Admins can update all kaizens"
  ON kaizens FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kaizen_id uuid REFERENCES kaizens(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_feedback boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kaizen owners can view comments on their kaizens"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kaizens
      WHERE kaizens.id = comments.kaizen_id
      AND kaizens.employee_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all comments"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert default categories
INSERT INTO categories (name, description, color) VALUES
  ('Qualidade', 'Melhorias relacionadas à qualidade do produto ou serviço', 'green'),
  ('Segurança', 'Ideias para aumentar a segurança no trabalho', 'red'),
  ('Produtividade', 'Sugestões para aumentar a produtividade', 'blue'),
  ('Redução de Custo', 'Ideias para reduzir custos operacionais', 'yellow'),
  ('Ergonomia', 'Melhorias no ambiente e condições de trabalho', 'purple'),
  ('Outro', 'Outras categorias de melhoria', 'gray')
ON CONFLICT (name) DO NOTHING;

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for kaizens updated_at
DROP TRIGGER IF EXISTS update_kaizens_updated_at ON kaizens;
CREATE TRIGGER update_kaizens_updated_at
  BEFORE UPDATE ON kaizens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update points when kaizen is approved
CREATE OR REPLACE FUNCTION update_employee_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE profiles
    SET points = points + 10
    WHERE id = NEW.employee_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for points update
DROP TRIGGER IF EXISTS kaizen_approval_points ON kaizens;
CREATE TRIGGER kaizen_approval_points
  AFTER UPDATE ON kaizens
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_points();
