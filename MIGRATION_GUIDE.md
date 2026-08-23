# 🚀 Migration Guide — Aplicação de Correções de Segurança

## 📋 Ordem de Aplicação

Aplique as migrations **nesta ordem exata**:

```
1. 20260313235136_create_kaizen_system_schema.sql          ← Schema base (já aplicado?)
2. 20260314010515_create_storage_bucket.sql                ← Storage (já aplicado?)
3. 20260322204150_fix_profiles_rls_policies.sql            ← RLS inicial (já aplicado?)
4. 20260821000000_enterprise_kaizen_features.sql           ← Features enterprise
5. 20260822000000_security_fixes_and_indexes.sql           ← Correções de segurança
```

---

## 🔧 Opção 1: Via Supabase CLI (Recomendado)

```bash
# 1. Login no Supabase (se ainda não fez)
supabase login

# 2. Link ao projeto (substitua com seu Project Ref)
supabase link --project-ref vottiwsddmwkiyztxjag

# 3. Aplicar todas as migrations pendentes
supabase db push

# 4. Verificar status
supabase db diff
```

---

## 🌐 Opção 2: Via Supabase Dashboard

### Passo 1: Acesse o SQL Editor

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto **kaizen-main**
3. No menu lateral: **SQL Editor** → **New Query**

### Passo 2: Aplique a Migration Enterprise (se ainda não aplicou)

Copie e cole o conteúdo completo de:
```
supabase/migrations/20260821000000_enterprise_kaizen_features.sql
```

Clique em **RUN** (Ctrl/Cmd + Enter)

**Erros esperados e como ignorar:**
- `relation "departments" already exists` → ✅ OK, pode ignorar
- `relation "badges" already exists` → ✅ OK, pode ignorar  
- `relation "notifications" already exists` → ✅ OK, pode ignorar
- `policy "..." already exists` → ✅ OK, pode ignorar
- `constraint "badges_code_unique" already exists` → ✅ OK, pode ignorar

### Passo 3: Aplique a Migration de Segurança

Copie e cole o conteúdo completo de:
```
supabase/migrations/20260822000000_security_fixes_and_indexes.sql
```

Clique em **RUN** (Ctrl/Cmd + Enter)

**Sucesso:** Se você ver mensagens como:
```
CREATE INDEX
CREATE POLICY
DROP POLICY
VACUUM
```
✅ Migration aplicada com sucesso!

---

## ✅ Verificação Pós-Migration

Execute estes comandos no **SQL Editor** para confirmar que tudo funcionou:

### 1. Verificar Policies Corrigidas

```sql
-- Deve retornar as policies de segurança
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('profiles', 'notifications')
ORDER BY tablename, policyname;
```

**Esperado:**
- `profiles`: `authenticated_view_profiles`, `users_update_own_profile_no_role_change`
- `notifications`: `insert_own_or_admin_notifications`

### 2. Verificar Índices Criados

```sql
-- Deve retornar os índices em FKs
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('kaizens', 'comments', 'notifications', 'user_badges')
ORDER BY tablename, indexname;
```

**Esperado (mínimo):**
- `kaizens_category_id_idx`
- `kaizens_employee_id_idx`
- `comments_kaizen_id_idx`
- `comments_user_id_idx`

### 3. Testar Proteção de Auto-Promoção

```sql
-- Simular tentativa de auto-promoção (deve FALHAR)
-- Substitua <seu_user_id> com um ID real de um employee
UPDATE profiles
SET role = 'admin'
WHERE id = '<seu_user_id>';
```

**Esperado:** Erro de RLS policy violation OU 0 rows updated

### 4. Verificar Tabelas Enterprise

```sql
-- Listar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Esperado:**
- `action_plans`
- `badges`
- `categories`
- `comments`
- `departments`
- `kaizens`
- `notifications`
- `profiles`
- `user_badges`

---

## 🔐 Pós-Migration: Ações Obrigatórias

### 1. Rotacionar Chaves (SE REPO FOI PÚBLICO)

Se o repositório foi público em algum momento:

1. Dashboard → **Settings** → **API**
2. Clique em **"Generate new anon key"**
3. Clique em **"Generate new service_role key"**
4. **Copie as novas chaves**
5. Atualize seu `.env` local:
   ```
   VITE_SUPABASE_URL=https://vottiwsddmwkiyztxjag.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<nova_anon_key>
   ```
6. Se usar Vercel/Netlify, atualize as **Environment Variables** lá também

### 2. Configurar Senha Mínima no Supabase

1. Dashboard → **Authentication** → **Policies**
2. Procure "Password Policy" ou "Password strength"
3. Altere:
   - Minimum password length: **8** (era 6)

### 3. Configurar Validação de Upload (Server-Side)

1. Dashboard → **Storage** → **Buckets**
2. Selecione bucket `kaizen-images`
3. **Settings** → Editar bucket:
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/gif`
   - **File size limit:** `5 MB`
4. Salvar

---

## 🧪 Testes de Segurança

Execute após aplicar migrations:

### Teste 1: Auto-Promoção Bloqueada ✅

Como **employee** (não admin), tente:

```sql
UPDATE profiles SET role = 'admin' WHERE id = auth.uid();
```

**Esperado:** ❌ Erro ou 0 rows affected

---

### Teste 2: Perfis Exigem Autenticação ✅

Tente acessar via API **sem** header `Authorization`:

```bash
curl https://vottiwsddmwkiyztxjag.supabase.co/rest/v1/profiles \
  -H "apikey: <sua_anon_key>"
```

**Esperado:** ❌ `401 Unauthorized` ou `403 Forbidden`

---

### Teste 3: Notificação para Outro User Bloqueada ✅

Como **employee** (não admin), tente:

```sql
INSERT INTO notifications (user_id, title, message)
VALUES ('<outro_user_id>', 'Teste', 'Mensagem maliciosa');
```

**Esperado:** ❌ RLS policy violation

---

### Teste 4: Upload de Arquivo Inválido Bloqueado ✅

No frontend, tente fazer upload de:
- Arquivo `.exe`, `.pdf`, ou `.svg` → ❌ Deve rejeitar
- Arquivo > 5MB → ❌ Deve rejeitar
- Arquivo `.jpg`, `.png` < 5MB → ✅ Deve aceitar

---

## 📊 Performance: Verificar Uso de Índices

Execute um `EXPLAIN ANALYZE` em queries comuns:

```sql
-- Query 1: Kaizens pendentes (admin dashboard)
EXPLAIN ANALYZE
SELECT * FROM kaizens
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 20;
```

**Esperado:** Deve usar `kaizens_pending_created_idx` (Index Scan)

```sql
-- Query 2: Kaizens por employee (employee dashboard)
EXPLAIN ANALYZE
SELECT * FROM kaizens
WHERE employee_id = '<um_employee_id>'
  AND status NOT IN ('rejected', 'completed')
ORDER BY created_at DESC;
```

**Esperado:** Deve usar `kaizens_active_employee_idx` (Index Scan)

```sql
-- Query 3: Comentários de um kaizen
EXPLAIN ANALYZE
SELECT c.*, p.full_name
FROM comments c
JOIN profiles p ON p.id = c.user_id
WHERE c.kaizen_id = '<um_kaizen_id>'
ORDER BY c.created_at ASC;
```

**Esperado:** Deve usar `comments_kaizen_id_idx` (Index Scan)

---

## 🚨 Troubleshooting

### Erro: "relation already exists"

✅ **Solução:** Pode ignorar — a migration é idempotente (segura para re-executar)

### Erro: "column does not exist"

❌ **Problema:** Migration anterior não foi aplicada completamente OU tabela já existia com schema diferente

**Solução:**
1. Aplicar migrations na ordem correta (ver topo deste guia)
2. Se erro persistir, as migrations agora são **totalmente idempotentes** — simplesmente rode novamente:
   - Elas verificam se colunas/tabelas/policies já existem antes de criar
   - Populam dados padrão em colunas novas (ex: `badges.code`)
   - Seguras para re-executar quantas vezes necessário

**Exemplo de erro resolvido:**
- ❌ `column "code" contains null values` → ✅ Agora popula com `BADGE_<id>` antes de set NOT NULL
- ❌ `column "kaizen_id" does not exist` → ✅ Agora verifica existência antes de criar índice

### Erro: "policy already exists"

✅ **Solução:** Pode ignorar — a migration usa `DROP POLICY IF EXISTS` antes de criar

### Performance não melhorou

**Diagnóstico:**
1. Verificar se índices foram realmente criados (query de verificação acima)
2. Rodar `VACUUM ANALYZE` manualmente:
   ```sql
   VACUUM ANALYZE kaizens;
   VACUUM ANALYZE comments;
   VACUUM ANALYZE profiles;
   ```
3. Esperar alguns minutos para o planner atualizar estatísticas

---

## 📚 Referências

- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) — Relatório completo de auditoria
- [Supabase RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Postgres Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)

---

**Status:** ✅ Todas as correções aplicadas via migrations  
**Próximo passo:** Aplicar migrations e testar!
