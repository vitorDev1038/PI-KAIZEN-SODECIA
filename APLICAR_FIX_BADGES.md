# 🎯 APLICAR FIX BADGES - SOLUÇÃO DEFINITIVA

## ❌ Problema

O banco tem a coluna `name` mas o script estava tentando usar `title`:

```
ERROR 23502: null value in column "name" violates not-null constraint
Failing row: name=null, title='Primeiro Passo'
```

## ✅ Solução

Criei um script que **detecta automaticamente** qual coluna existe e usa a correta via LOOP.

---

## 🚀 PASSO A PASSO

### 1️⃣ Abra o Arquivo

**`FIX_BADGES_FINAL.sql`** (na raiz do projeto)

### 2️⃣ Copie TODO o Conteúdo

Ctrl+A → Ctrl+C

### 3️⃣ Cole no Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/vottiwsddmwkiyztxjag/sql/new
2. Cole o conteúdo (Ctrl+V)
3. Clique em **RUN** (ou F5)

### 4️⃣ Mensagens Esperadas

```
NOTICE: Detected schema uses column: name
NOTICE: Inserted/Updated badge: FIRST_KAIZEN (using name column)
NOTICE: Inserted/Updated badge: BRONZE_CONTRIBUTOR (using name column)
NOTICE: Inserted/Updated badge: SILVER_CONTRIBUTOR (using name column)
NOTICE: Inserted/Updated badge: GOLD_CONTRIBUTOR (using name column)
NOTICE: Inserted/Updated badge: ROI_CHAMPION (using name column)
NOTICE: Inserted/Updated badge: SAFETY_GUARDIAN (using name column)
NOTICE: ✅ All 6 badges inserted/updated successfully!
```

### 5️⃣ Verificação

O script já mostra uma tabela no final com os 6 badges:

| code | badge_name | description | icon | points_required | color |
|------|-----------|-------------|------|----------------|-------|
| FIRST_KAIZEN | Primeiro Passo | Submeteu sua primeira... | Sparkles | 0 | blue |
| ... | ... | ... | ... | ... | ... |

---

## 🔧 Como Funciona

1. **Detecta** se coluna é `name` ou `title`:
   ```sql
   SELECT EXISTS (...column_name = 'name') INTO has_name_col;
   ```

2. **LOOP** sobre cada badge:
   ```sql
   FOREACH badge_record IN ARRAY badges_data LOOP
   ```

3. **IF/ELSE** para usar coluna correta:
   ```sql
   IF has_name_col THEN
     INSERT INTO badges (code, name, ...) VALUES (...)
   ELSE
     INSERT INTO badges (code, title, ...) VALUES (...)
   END IF;
   ```

4. **UPSERT** com `ON CONFLICT DO UPDATE` (não duplica)

---

## 🎉 Resultado

✅ 6 badges inseridos corretamente  
✅ Usa a coluna `name` (schema atual)  
✅ Não quebra se schema mudar para `title`  
✅ UPSERT previne duplicatas  

---

## 🆘 Se Der Erro

**Erro: "relation badges does not exist"**
→ Execute primeiro o `APPLY_SECURITY_ONLY.sql` completo

**Erro: "constraint badges_code_unique already exists"**
→ IGNORE, é normal

**Erro: "permission denied"**
→ Use uma conta com role `service_role` ou `postgres`

---

## ✅ Teste Final

Execute no SQL Editor:

```sql
-- Deve retornar 6 badges
SELECT code, name, points_required FROM badges ORDER BY points_required;

-- Deve retornar 0 (nenhum badge com name NULL)
SELECT COUNT(*) FROM badges WHERE name IS NULL;
```

---

## 🎯 Próximos Passos

Após aplicar este fix:

1. ✅ Badges funcionando
2. ✅ Voltar para `APPLY_SECURITY_ONLY.sql` e rodar o resto (índices, policies)
3. ✅ Testar a aplicação React

---

**Criado por:** Kiro AI  
**Data:** 2026-08-23  
**Versão:** 1.0 DEFINITIVA
