-- ==========================================
-- SCRIPT DE CRIAÇÃO E INICIALIZAÇÃO DE SETORES (DEPARTMENTS)
-- Execute este script no SQL Editor do Supabase para habilitar 
-- a criação e seleção de setores no sistema Kaizen.
-- ==========================================

-- 1. Criar tabela de departamentos / setores se não existir
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  company text DEFAULT 'Sodecia',
  created_at timestamptz DEFAULT now()
);

-- 2. Garantir que a coluna department_id existe na tabela kaizens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'kaizens' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE public.kaizens ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de permissão RLS sem bloqueios
DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;
CREATE POLICY "Anyone can view departments" ON public.departments 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage departments" ON public.departments;
CREATE POLICY "Authenticated users can manage departments" ON public.departments 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 5. Inserir setores padrão da Sodecia
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

-- 6. Criar índice para alta performance
CREATE INDEX IF NOT EXISTS kaizens_department_id_idx ON public.kaizens (department_id);
