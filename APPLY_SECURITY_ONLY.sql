/*
  # APLICAR APENAS CORREÇÕES DE SEGURANÇA
  
  Este script aplica SOMENTE as migrations de segurança (enterprise + security)
  sem tentar re-aplicar as migrations base que já existem no banco.
  
  USO:
  1. Copie TODO este arquivo
  2. Cole no Supabase Dashboard → SQL Editor
  3. Clique em RUN
  
  NOTA: Erros de "already exists" são NORMAIS e podem ser ignorados.
*/

-- ============================================================================
-- PARTE 1: ENTERPRISE FEATURES (20260821000000)
-- ============================================================================

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  company text DEFAULT 'Sodecia',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'departments'
    AND policyname = 'Authenticated users can view departments'
  ) THEN
    CREATE POLICY "Authenticated users can view departments"
      ON departments FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'departments'
    AND policyname = 'Admins can manage departments'
  ) THEN
    CREATE POLICY "Admins can manage departments"
      ON departments FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;

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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'action_plans' AND policyname = 'Users can view action plans') THEN
    CREATE POLICY "Users can view action plans"
      ON action_plans FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- 4. Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

-- Add all columns conditionally
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'badges' AND column_name = 'title') THEN
    ALTER TABLE badges ADD COLUMN title text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'badges' AND column_name = 'description') THEN
    ALTER TABLE badges ADD COLUMN description text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'badges' AND column_name = 'icon') THEN
    ALTER TABLE badges ADD COLUMN icon text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'badges' AND column_name = 'points_required') THEN
    ALTER TABLE badges ADD COLUMN points_required integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'badges' AND column_name = 'color') THEN
    ALTER TABLE badges ADD COLUMN color text DEFAULT 'blue';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'badges' AND column_name = 'code') THEN
    ALTER TABLE badges ADD COLUMN code text;
    UPDATE badges SET code = 'BADGE_' || id::text WHERE code IS NULL;
  END IF;
END $$;

-- Set NOT NULL constraints
DO $$
BEGIN
  -- First, populate NULL values with defaults for existing rows
  UPDATE badges SET title = 'Badge ' || id::text WHERE title IS NULL;
  UPDATE badges SET description = 'Badge description' WHERE description IS NULL;
  UPDATE badges SET icon = 'Award' WHERE icon IS NULL;
  
  -- Now set NOT NULL
  ALTER TABLE badges ALTER COLUMN title SET NOT NULL;
  ALTER TABLE badges ALTER COLUMN description SET NOT NULL;
  ALTER TABLE badges ALTER COLUMN icon SET NOT NULL;
  ALTER TABLE badges ALTER COLUMN code SET NOT NULL;
  
  -- Add unique constraint on code if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'badges_code_unique'
    AND conrelid = 'public.badges'::regclass
  ) THEN
    ALTER TABLE badges ADD CONSTRAINT badges_code_unique UNIQUE (code);
  END IF;
END $$;

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'badges' AND policyname = 'Authenticated users can view badges') THEN
    CREATE POLICY "Authenticated users can view badges"
      ON badges FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Insert badges
INSERT INTO badges (code, title, description, icon, points_required, color) VALUES
  ('FIRST_KAIZEN', 'Primeiro Passo', 'Submeteu sua primeira ideia de melhoria Kaizen', 'Sparkles', 0, 'blue'),
  ('BRONZE_CONTRIBUTOR', 'Inovador Bronze', 'Alcançou 30 pontos em melhorias aprovadas', 'Award', 30, 'amber'),
  ('SILVER_CONTRIBUTOR', 'Inovador Prata', 'Alcançou 70 pontos em melhorias aprovadas', 'ShieldCheck', 70, 'slate'),
  ('GOLD_CONTRIBUTOR', 'Inovador Ouro', 'Alcançou 150 pontos e liderança no ranking', 'Trophy', 150, 'yellow'),
  ('ROI_CHAMPION', 'Campeão de Economia', 'Criou um Kaizen com economia acima de R$ 5.000', 'DollarSign', 0, 'emerald'),
  ('SAFETY_GUARDIAN', 'Guardião da Segurança', 'Kaizen aprovado na categoria Segurança do Trabalho', 'Shield', 0, 'red')
ON CONFLICT (code) DO NOTHING;

-- 5. Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_badges' AND policyname = 'Users can view user badges') THEN
    CREATE POLICY "Users can view user badges"
      ON user_badges FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- 6. Create notifications table
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can view their notifications') THEN
    CREATE POLICY "Users can view their notifications"
      ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can update their notifications') THEN
    CREATE POLICY "Users can update their notifications"
      ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- PARTE 2: SECURITY FIXES (20260822000000)
-- ============================================================================

-- 1. DROP PROBLEMATIC RLS POLICIES
DROP POLICY IF EXISTS "public_view_profiles" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;

-- 2. CREATE SECURE RLS POLICIES FOR PROFILES
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_view_profiles') THEN
    CREATE POLICY "authenticated_view_profiles"
      ON profiles FOR SELECT
      TO authenticated
      USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_update_own_profile_no_role_change') THEN
    CREATE POLICY "users_update_own_profile_no_role_change"
      ON profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (
        auth.uid() = id
        AND role = (SELECT role FROM profiles WHERE id = auth.uid())
      );
  END IF;
END $$;

-- 3. CREATE SECURE RLS POLICY FOR NOTIFICATIONS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'insert_own_or_admin_notifications') THEN
      CREATE POLICY "insert_own_or_admin_notifications"
        ON notifications FOR INSERT
        TO authenticated
        WITH CHECK (
          auth.uid() = user_id
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
          )
        );
    END IF;
  END IF;
END $$;

-- 4. CREATE MISSING FOREIGN KEY INDEXES
CREATE INDEX IF NOT EXISTS kaizens_category_id_idx ON kaizens (category_id);
CREATE INDEX IF NOT EXISTS kaizens_employee_id_idx ON kaizens (employee_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kaizens' AND column_name = 'department_id') THEN
    CREATE INDEX IF NOT EXISTS kaizens_department_id_idx ON kaizens (department_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS comments_kaizen_id_idx ON comments (kaizen_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments (user_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'action_plans') THEN
    CREATE INDEX IF NOT EXISTS action_plans_kaizen_id_idx ON action_plans (kaizen_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges') THEN
    CREATE INDEX IF NOT EXISTS user_badges_user_id_idx ON user_badges (user_id);
    CREATE INDEX IF NOT EXISTS user_badges_badge_id_idx ON user_badges (badge_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id);
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'kaizen_id') THEN
      CREATE INDEX IF NOT EXISTS notifications_kaizen_id_idx ON notifications (kaizen_id);
    END IF;
  END IF;
END $$;

-- 5. PARTIAL INDEXES
CREATE INDEX IF NOT EXISTS kaizens_pending_created_idx 
  ON kaizens (created_at DESC)
  WHERE status = 'pending';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kaizens' AND column_name = 'department_id') THEN
    CREATE INDEX IF NOT EXISTS kaizens_active_employee_idx
      ON kaizens (employee_id, status, created_at DESC)
      WHERE status NOT IN ('rejected', 'completed');
  ELSE
    CREATE INDEX IF NOT EXISTS kaizens_active_employee_idx
      ON kaizens (employee_id, created_at DESC)
      WHERE status NOT IN ('rejected', 'completed');
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND column_name = 'read') THEN
    CREATE INDEX IF NOT EXISTS notifications_unread_user_idx
      ON notifications (user_id, created_at DESC)
      WHERE read = false;
  END IF;
END $$;

-- 6. COMPOSITE INDEXES
CREATE INDEX IF NOT EXISTS kaizens_employee_status_created_idx
  ON kaizens (employee_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS comments_kaizen_created_idx
  ON comments (kaizen_id, created_at ASC);

-- 7. FORCE RLS ON ALL TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE kaizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaizens FORCE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 8. ANALYZE TABLES
ANALYZE profiles;
ANALYZE kaizens;
ANALYZE comments;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ANALYZE notifications;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'action_plans') THEN
    ANALYZE action_plans;
  END IF;
END $$;

-- ============================================================================
-- CONCLUÍDO!
-- ============================================================================

-- Verificar policies criadas:
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('profiles', 'notifications')
ORDER BY tablename, policyname;

-- Verificar índices criados:
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('kaizens', 'comments', 'notifications')
ORDER BY tablename, indexname;
