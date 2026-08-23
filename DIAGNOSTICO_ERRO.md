# 🔍 DIAGNÓSTICO DO ERRO DE RELAÇÃO

## ⚠️ Problema

O CLI está travando em "Initialising login role" e não consegui executar remotamente.

**Você mencionou:** "é erro de relação eu acho"

Possíveis causas:
1. ❌ Tabela `badges` não existe
2. ❌ Tabela existe mas sem constraint `badges_code_unique`
3. ❌ Colunas `name`/`title` não existem
4. ❌ Schema não foi aplicado completamente

---

## 🔧 PASSO 1: DIAGNOSTICAR

### Abra o Dashboard:
👉 https://supabase.com/dashboard/project/vottiwsddmwkiyztxjag/sql/new

### Cole este SQL:

**Arquivo:** `CHECK_BADGES_SCHEMA.sql`

```sql
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
```

### **RODE** e me envie o resultado completo!

---

## 🎯 PASSO 2: RESOLVER BASEADO NO ERRO

### Se "relation badges does not exist":
→ A tabela não foi criada ainda
→ **Solução:** Aplicar `APPLY_SECURITY_ONLY.sql` COMPLETO primeiro

### Se "column name does not exist" E "column title does not exist":
→ Tabela existe mas sem as colunas corretas
→ **Solução:** Criar as colunas manualmente

### Se "constraint badges_code_unique does not exist":
→ Tabela existe mas sem UNIQUE constraint
→ **Solução:** Adicionar constraint antes do INSERT

### Se dados existem mas com name=NULL:
→ Tabela tem dados incompletos
→ **Solução:** UPDATE para popular antes do INSERT

---

## 🚀 PASSO 3: APÓS DIAGNÓSTICO

Me envie o **OUTPUT COMPLETO** das 4 queries acima e eu crio um script SQL **ESPECÍFICO** para o seu caso que VAI FUNCIONAR.

**Formato ideal:**
```
Mensagem de erro OU tabela com resultados
```

---

## 📝 EXEMPLO DE OUTPUT

**Query 1 (tabela existe):**
```
table_name | table_schema
-----------|-------------
badges     | public
```

**Query 2 (colunas):**
```
column_name     | data_type | is_nullable | column_default
----------------|-----------|-------------|---------------
id              | uuid      | NO          | gen_random_uuid()
created_at      | timestamp | YES         | now()
name            | text      | YES         | NULL
title           | text      | YES         | NULL
...
```

**Query 3 (constraints):**
```
constraint_name       | constraint_type | definition
----------------------|-----------------|--------------------
badges_pkey           | p               | PRIMARY KEY (id)
badges_code_unique    | u               | UNIQUE (code)
```

**Query 4 (dados):**
```
id   | name | title          | code
-----|------|----------------|------------
...  | NULL | Primeiro Passo | FIRST_KAIZEN
```

---

Com essas informações, crio o script PERFEITO para seu caso! 🎯
