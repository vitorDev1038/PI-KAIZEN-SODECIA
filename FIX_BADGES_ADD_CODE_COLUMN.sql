-- ============================================================================
-- FIX DEFINITIVO: Adicionar coluna 'code' à tabela badges
-- ============================================================================
-- Problema identificado: badges não tem coluna 'code'
-- Schema atual: tem 'name', NÃO tem 'title', NÃO tem 'code'
-- ============================================================================

-- 1. Adicionar coluna 'code' se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'badges' 
    AND column_name = 'code'
  ) THEN
    ALTER TABLE badges ADD COLUMN code text;
    RAISE NOTICE '✅ Coluna code adicionada';
  ELSE
    RAISE NOTICE '⚠️  Coluna code já existe';
  END IF;
END $$;

-- 2. Popular coluna 'code' com valores únicos para registros existentes
UPDATE badges 
SET code = 'BADGE_' || id::text 
WHERE code IS NULL;

-- 3. Adicionar constraint UNIQUE na coluna 'code'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'badges_code_unique'
    AND conrelid = 'public.badges'::regclass
  ) THEN
    ALTER TABLE badges ADD CONSTRAINT badges_code_unique UNIQUE (code);
    RAISE NOTICE '✅ Constraint UNIQUE adicionada em code';
  ELSE
    RAISE NOTICE '⚠️  Constraint badges_code_unique já existe';
  END IF;
END $$;

-- 4. Setar NOT NULL na coluna 'code'
ALTER TABLE badges ALTER COLUMN code SET NOT NULL;

-- 5. Inserir/atualizar os 6 badges principais
INSERT INTO badges (code, name, description, icon, points_required, color) VALUES
  ('FIRST_KAIZEN', 'Primeiro Passo', 'Submeteu sua primeira ideia de melhoria Kaizen', 'Sparkles', 0, 'blue'),
  ('BRONZE_CONTRIBUTOR', 'Inovador Bronze', 'Alcançou 30 pontos em melhorias aprovadas', 'Award', 30, 'amber'),
  ('SILVER_CONTRIBUTOR', 'Inovador Prata', 'Alcançou 70 pontos em melhorias aprovadas', 'ShieldCheck', 70, 'slate'),
  ('GOLD_CONTRIBUTOR', 'Inovador Ouro', 'Alcançou 150 pontos e liderança no ranking', 'Trophy', 150, 'yellow'),
  ('ROI_CHAMPION', 'Campeão de Economia', 'Criou um Kaizen com economia acima de R$ 5.000', 'DollarSign', 0, 'emerald'),
  ('SAFETY_GUARDIAN', 'Guardião da Segurança', 'Kaizen aprovado na categoria Segurança do Trabalho', 'Shield', 0, 'red')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  points_required = EXCLUDED.points_required,
  color = EXCLUDED.color;

-- 6. Verificação
SELECT 
  code,
  name,
  description,
  icon,
  points_required,
  color
FROM badges
ORDER BY points_required, code;
