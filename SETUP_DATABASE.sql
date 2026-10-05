-- ==============================================================================
-- SCRIPT DE INICIALIZAÇÃO COMPLETA DO BANCO DE DADOS (SUPABASE)
-- Execute este script no SQL Editor do Supabase para criar/atualizar todas as
-- tabelas, colunas, permissões (RLS) e dados iniciais necessários para a plataforma Kaizen Sodecia.
-- ==============================================================================

-- 1. TABELA DE PERFIS (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role text DEFAULT 'employee',
  points integer DEFAULT 0,
  department text,
  created_at timestamptz DEFAULT now()
);

-- 2. TABELA DE CATEGORIAS (categories)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);

-- 3. TABELA DE DEPARTAMENTOS / SETORES (departments)
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  company text DEFAULT 'Sodecia',
  created_at timestamptz DEFAULT now()
);

-- 4. TABELA DE KAIZENS (kaizens) E COLUNAS
CREATE TABLE IF NOT EXISTS public.kaizens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  problem text NOT NULL,
  suggestion text NOT NULL,
  benefits text,
  status text DEFAULT 'pending',
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  estimated_savings numeric DEFAULT 0,
  realized_savings numeric DEFAULT 0,
  implementation_cost numeric DEFAULT 0,
  effort_level text DEFAULT 'medium',
  impact_level text DEFAULT 'medium',
  image_url text,
  before_image_url text,
  after_image_url text,
  created_at timestamptz DEFAULT now()
);

-- Garantir adição de colunas se a tabela kaizens já existia em versão legada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kaizens' AND column_name = 'estimated_savings') THEN
    ALTER TABLE public.kaizens ADD COLUMN estimated_savings numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kaizens' AND column_name = 'realized_savings') THEN
    ALTER TABLE public.kaizens ADD COLUMN realized_savings numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kaizens' AND column_name = 'implementation_cost') THEN
    ALTER TABLE public.kaizens ADD COLUMN implementation_cost numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kaizens' AND column_name = 'effort_level') THEN
    ALTER TABLE public.kaizens ADD COLUMN effort_level text DEFAULT 'medium';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kaizens' AND column_name = 'impact_level') THEN
    ALTER TABLE public.kaizens ADD COLUMN impact_level text DEFAULT 'medium';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kaizens' AND column_name = 'department_id') THEN
    ALTER TABLE public.kaizens ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kaizens' AND column_name = 'category_id') THEN
    ALTER TABLE public.kaizens ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kaizens' AND column_name = 'before_image_url') THEN
    ALTER TABLE public.kaizens ADD COLUMN before_image_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kaizens' AND column_name = 'after_image_url') THEN
    ALTER TABLE public.kaizens ADD COLUMN after_image_url text;
  END IF;
END $$;

-- 5. TABELA DE COMENTÁRIOS (comments)
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kaizen_id uuid REFERENCES public.kaizens(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 6. TABELA DE NOTIFICAÇÕES (notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 7. TABELA DE PLANOS DE AÇÃO 5W2H (action_plans)
CREATE TABLE IF NOT EXISTS public.action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kaizen_id uuid REFERENCES public.kaizens(id) ON DELETE CASCADE NOT NULL,
  what text NOT NULL,
  who text NOT NULL,
  where_location text,
  why_reason text,
  how_method text,
  cost numeric DEFAULT 0,
  due_date date,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  created_at timestamptz DEFAULT now()
);

-- 8. TABELA DE CONFIGURAÇÕES (site_settings)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name text DEFAULT 'Sodecia Group',
  logo_url text,
  primary_color text DEFAULT 'blue',
  updated_at timestamptz DEFAULT now()
);

-- 9. TABELA DE BADGES / CONQUISTAS (badges)
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text UNIQUE NOT NULL,
  description text NOT NULL,
  points_required integer NOT NULL DEFAULT 10,
  icon text DEFAULT 'Sparkles',
  created_at timestamptz DEFAULT now()
);

-- 10. TABELA DE TICKETS DE RESGATE DE PRÊMIOS (tickets)
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reward_title text NOT NULL,
  reward_description text,
  points_spent integer NOT NULL DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'used')),
  created_at timestamptz DEFAULT now(),
  used_at timestamptz
);

-- 11. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Badges Access" ON public.badges;
CREATE POLICY "Public Badges Access" ON public.badges FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Tickets Access" ON public.tickets;
CREATE POLICY "Public Tickets Access" ON public.tickets FOR ALL USING (true) WITH CHECK (true);

-- 11. INSERIR BADGES PADRÃO
INSERT INTO public.badges (title, description, points_required, icon) VALUES
  ('Primeiro Passo', 'Submeteu a primeira ideia Kaizen aprovada na Sodecia.', 10, 'Sparkles'),
  ('Inovador Ativo', 'Acumulou 30 pontos em melhorias contínuas.', 30, 'Award'),
  ('Especialista 5S', 'Acumulou 50 pontos com foco em organização e eficiência.', 50, 'ShieldCheck'),
  ('Kaizen Master', 'Alcançou a marca impressionante de 100 pontos.', 100, 'Trophy'),
  ('Economista Sodecia', 'Implementou ideia de alto impacto financeiro na planta.', 150, 'DollarSign'),
  ('Campeão EHS & Segurança', 'Alcançou 200 pontos garantindo ambiente de trabalho seguro.', 200, 'Shield')
ON CONFLICT (title) DO NOTHING;

-- 10. LIBERAR PERMISSÕES RLS SEM BLOQUEIOS
DROP POLICY IF EXISTS "Public Profiles Access" ON public.profiles;
CREATE POLICY "Public Profiles Access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Categories Access" ON public.categories;
CREATE POLICY "Public Categories Access" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Departments Access" ON public.departments;
CREATE POLICY "Public Departments Access" ON public.departments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Kaizens Access" ON public.kaizens;
CREATE POLICY "Public Kaizens Access" ON public.kaizens FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Comments Access" ON public.comments;
CREATE POLICY "Public Comments Access" ON public.comments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Notifications Access" ON public.notifications;
CREATE POLICY "Public Notifications Access" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Action Plans Access" ON public.action_plans;
CREATE POLICY "Public Action Plans Access" ON public.action_plans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Settings Access" ON public.site_settings;
CREATE POLICY "Public Settings Access" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

-- 11. INSERIR CATEGORIAS PADRÃO
INSERT INTO public.categories (name, description, color) VALUES
  ('Segurança (EHS)', 'Melhorias de segurança e ergonomia no trabalho', '#ef4444'),
  ('Qualidade', 'Redução de refugos, retrabalhos e defeitos de peça', '#10b981'),
  ('Produtividade & 5S', 'Redução de tempo de ciclo, setups e organização', '#3b82f6'),
  ('Custo & Redução de Desperdício', 'Economia de matéria-prima, insumos e energia', '#f59e0b'),
  ('Manutenção & TPM', 'Melhorias em máquinas, dispositivos e ferramentas', '#8b5cf6'),
  ('Processos & TI', 'Automação, simplificação de fluxos e sistemas', '#ec4899')
ON CONFLICT (name) DO NOTHING;

-- 12. INSERIR SETORES PADRÃO DA SODECIA
INSERT INTO public.departments (name, company) VALUES
  ('Prensa & Estamparia', 'Sodecia'),
  ('Solda & Armação (Body in White)', 'Sodecia'),
  ('Montagem & Pintura', 'Sodecia'),
  ('Logística & Almoxarifado', 'Sodecia'),
  ('Engenharia & Manutenção', 'Sodecia'),
  ('Qualidade & Laboratório', 'Sodecia'),
  ('Segurança & Meio Ambiente (EHS)', 'Sodecia'),
  ('Administrativo & RH', 'Sodecia'),
  ('Tecnologia da Informação (TI)', 'Sodecia'),
  ('Geral / Outros', 'Sodecia')
ON CONFLICT (name) DO NOTHING;

-- 13. CRIAR ÍNDICES DE ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS kaizens_department_id_idx ON public.kaizens (department_id);
CREATE INDEX IF NOT EXISTS kaizens_category_id_idx ON public.kaizens (category_id);
CREATE INDEX IF NOT EXISTS kaizens_employee_id_idx ON public.kaizens (employee_id);
