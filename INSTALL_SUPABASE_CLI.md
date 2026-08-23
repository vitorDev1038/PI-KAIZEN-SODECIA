# 🛠️ Instalar Supabase CLI no Windows

Você tem **3 opções** para instalar o Supabase CLI. Escolha a que preferir:

---

## ✅ Opção 1: Via npm (Mais Simples) — RECOMENDADO

### Passo 1: Habilitar Scripts no PowerShell

Abra o **PowerShell como Administrador** e execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Digite `S` (Sim) quando perguntar.

### Passo 2: Instalar Supabase CLI

```powershell
npm install -g supabase
```

### Passo 3: Verificar Instalação

```powershell
supabase --version
```

**Esperado:** `1.x.x` ou superior

---

## ✅ Opção 2: Via Scoop (Gerenciador de Pacotes)

### Passo 1: Instalar Scoop

Abra o **PowerShell** (não precisa ser admin) e execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### Passo 2: Instalar Supabase CLI via Scoop

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Passo 3: Verificar Instalação

```powershell
supabase --version
```

---

## ✅ Opção 3: Download Direto (Sem Gerenciador)

### Passo 1: Baixar o Executável

1. Acesse: https://github.com/supabase/cli/releases
2. Baixe a versão Windows (arquivo `.zip` com `windows` no nome)
3. Extraia o arquivo `supabase.exe` para uma pasta, ex: `C:\supabase\`

### Passo 2: Adicionar ao PATH

1. Pressione `Win + X` → **Sistema**
2. **Configurações avançadas do sistema**
3. **Variáveis de Ambiente**
4. Em "Variáveis do usuário", selecione `Path` → **Editar**
5. **Novo** → Digite `C:\supabase` (ou onde extraiu o .exe)
6. **OK** em tudo

### Passo 3: Reiniciar Terminal e Verificar

Feche e abra um novo PowerShell:

```powershell
supabase --version
```

---

## 🚀 Após Instalação — Usar o CLI

### 1. Login no Supabase

```powershell
supabase login
```

Vai abrir o browser para você fazer login. Depois volta ao terminal.

### 2. Linkar ao Projeto

```powershell
cd "c:\Users\vitor\OneDrive\Documentos\kaizen-main"
supabase link --project-ref vottiwsddmwkiyztxjag
```

**Nota:** Vai pedir o **Database Password** (senha do banco). Se não souber:
1. Acesse o Supabase Dashboard
2. Settings → Database
3. "Reset Database Password" se necessário

### 3. Aplicar Migrations

```powershell
supabase db push
```

Isso aplica **todas** as migrations pendentes automaticamente!

### 4. Verificar Status

```powershell
supabase db diff
```

Se retornar vazio → ✅ todas migrations aplicadas!

---

## 🔧 Comandos Úteis do CLI

```powershell
# Ver migrations pendentes
supabase migration list

# Ver status do projeto
supabase status

# Criar nova migration (vazia)
supabase migration new nome_da_migration

# Ver logs do banco em tempo real
supabase db logs

# Ver diff do schema (diferenças entre local e remoto)
supabase db diff

# Resetar banco local (CUIDADO - deleta tudo)
supabase db reset

# Gerar tipos TypeScript do schema
supabase gen types typescript --project-id vottiwsddmwkiyztxjag > src/lib/database.types.ts
```

---

## ⚠️ Troubleshooting

### Erro: "supabase: command not found"

**Solução:** Reinicie o terminal após instalação. Se persistir, verifique se o PATH foi configurado corretamente (Opção 3).

### Erro: "Cannot find module 'supabase'"

**Solução:** Instale novamente com npm:
```powershell
npm install -g supabase --force
```

### Erro: "UnauthorizedAccess" ao rodar npm

**Solução:** Execute como admin ou habilite scripts:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erro: "Database password incorrect"

**Solução:**
1. Dashboard → Settings → Database
2. "Reset Database Password"
3. Copie a nova senha
4. Rode `supabase link` novamente

---

## 📚 Documentação Oficial

- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [GitHub Releases](https://github.com/supabase/cli/releases)
- [Supabase CLI Usage](https://supabase.com/docs/guides/cli)

---

## ✅ Depois de Instalar

Volte ao `MIGRATION_GUIDE.md` e siga a **Opção A: Via CLI** para aplicar as migrations de segurança!

**Comando final:**
```powershell
cd "c:\Users\vitor\OneDrive\Documentos\kaizen-main"
supabase login
supabase link --project-ref vottiwsddmwkiyztxjag
supabase db push
```

Pronto! 🎉
