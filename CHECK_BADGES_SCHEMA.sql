-- VERIFICAR SCHEMA DA TABELA BADGES
-- Copie este SQL e cole no Dashboard para ver o erro exato

-- 1. Ver se a tabela existe
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_name = 'badges';

-- 2. Ver todas as colunas da tabela badges
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'badges'
ORDER BY ordinal_position;

-- 3. Ver constraints (NOT NULL, UNIQUE, etc)
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.badges'::regclass;

-- 4. Ver dados existentes (se houver)
SELECT * FROM badges LIMIT 5;
