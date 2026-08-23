/*
  # Enterprise Kaizen Features & ROI Management SQL Migration

  1. New Tables:
    - `departments`: Sectors/Lines for Sodecia (Prensa, Solda, Montagem, etc.)
    - `action_plans`: 5W2H Kanban tasks linked to approved Kaizens
    - `badges` & `user_badges`: Gamification achievements and awards
    - `notifications`: Real-time user notification logs

  2. Kaizens Enhancements:
    - Added financial ROI columns (`estimated_savings`, `realized_savings`, `implementation_cost`)
    - Added effort/impact matrix levels (`effort_level`, `impact_level`)
    - Added link to `department_id`
    - Added support for Before/After images (`before_image_url`, `after_image_url`)
*/

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  company text DEFAULT 'Sodecia',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view departments"
  ON departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Insert default Sodecia industrial departments
INSERT INTO departments (name, company) VALUES
  ('Prensa & Estamparia', 'Sodecia'),
  ('Solda & Armação (Body in White)', 'Sodecia'),
  ('Montagem & Pintura', 'Sodecia'),
  ('Logística & Almoxarifado', 'Sodecia'),
  ('Engenharia & Manutenção', 'Sodecia'),
  ('Qualidade & Laboratório', 'Sodecia'),
  ('Segurança & Meio Ambiente (EHS)', 'Sodecia'),
  ('Administrativo & RH', 'Sodecia')
ON CONFLICT (name) DO NOTHING;

-- 2. Enhance kaizens table with ROI, Effort/Impact, Department, and Before/After photos
ALTER TABLE kaizens DROP CONSTRAINT IF EXISTS kaizens_status_check;

-- Add columns if they don't exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kaizens' AND column_name = 'estimated_savings') THEN
    ALTER TABLE kaizens ADD COLUMN estimated_savings numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kaizens' AND column_name = 'realized_savings') THEN
    ALTER TABLE kaizens ADD COLUMN realized_savings numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kaizens' AND column_name = 'implementation_cost') THEN
    ALTER TABLE kaizens ADD COLUMN implementation_cost numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kaizens' AND column_name = 'effort_level') THEN
    ALTER TABLE kaizens ADD COLUMN effort_level text DEFAULT 'medium';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kaizens' AND column_name = 'impact_level') THEN
    ALTER TABLE kaizens ADD COLUMN impact_level text DEFAULT 'medium';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kaizens' AND column_name = 'department_id') THEN
    ALTER TABLE kaizens ADD COLUMN department_id uuid REFERENCES departments(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kaizens' AND column_name = 'before_image_url') THEN
    ALTER TABLE kaizens ADD COLUMN before_image_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kaizens' AND column_name = 'after_image_url') THEN
    ALTER TABLE kaizens ADD COLUMN after_image_url text;
  END IF;
END $$;

-- 3. Create action_plans (5W2H) table
CREATE TABLE IF NOT EXISTS action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kaizen_id uuid REFERENCES kaizens(id) ON DELETE CASCADE NOT NULL,
  what text NOT NULL,
  who text NOT NULL,
  where_location text,
  why_reason text,
  how_method text,
  cost numeric DEFAULT 0,
  due_date date,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view action plans"
  ON action_plans FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and kaizen owners can insert action plans"
  ON action_plans FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM kaizens WHERE kaizens.id = action_plans.kaizen_id AND (kaizens.employee_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')))
  );

CREATE POLICY "Admins and kaizen owners can update action plans"
  ON action_plans FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM kaizens WHERE kaizens.id = action_plans.kaizen_id AND (kaizens.employee_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')))
  );

CREATE POLICY "Admins can delete action plans"
  ON action_plans FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 4. Create badges table & user_badges
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  points_required integer DEFAULT 0,
  color text DEFAULT 'blue',
  created_at timestamptz DEFAULT now()
);

-- Add code column if it doesn't exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'badges'
    AND column_name = 'code'
  ) THEN
    -- Add column as nullable first
    ALTER TABLE badges ADD COLUMN code text;
    
    -- Update existing rows with generated codes if any exist
    UPDATE badges SET code = 'BADGE_' || id::text WHERE code IS NULL;
    
    -- Now make it NOT NULL and UNIQUE
    ALTER TABLE badges ALTER COLUMN code SET NOT NULL;
    ALTER TABLE badges ADD CONSTRAINT badges_code_unique UNIQUE (code);
  END IF;
END $$;

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view badges"
  ON badges FOR SELECT TO authenticated USING (true);

INSERT INTO badges (code, title, description, icon, points_required, color) VALUES
  ('FIRST_KAIZEN', 'Primeiro Passo', 'Submeteu sua primeira ideia de melhoria Kaizen', 'Sparkles', 0, 'blue'),
  ('BRONZE_CONTRIBUTOR', 'Inovador Bronze', 'Alcançou 30 pontos em melhorias aprovadas', 'Award', 30, 'amber'),
  ('SILVER_CONTRIBUTOR', 'Inovador Prata', 'Alcançou 70 pontos em melhorias aprovadas', 'ShieldCheck', 70, 'slate'),
  ('GOLD_CONTRIBUTOR', 'Inovador Ouro', 'Alcançou 150 pontos e liderança no ranking', 'Trophy', 150, 'yellow'),
  ('ROI_CHAMPION', 'Campeão de Economia', 'Criou um Kaizen com economia acima de R$ 5.000', 'DollarSign', 0, 'emerald'),
  ('SAFETY_GUARDIAN', 'Guardião da Segurança', 'Kaizen aprovado na categoria Segurança do Trabalho', 'Shield', 0, 'red')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view user badges"
  ON user_badges FOR SELECT TO authenticated USING (true);

-- 5. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add kaizen_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notifications'
    AND column_name = 'kaizen_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN kaizen_id uuid REFERENCES kaizens(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT TO authenticated WITH CHECK (true);
