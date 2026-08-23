---
name: security-audit
description: 'Auditoria de segurança multi-projeto para Next.js e React — usa versões instaladas (package.json + lockfile), npm audit, Auth.js, Prisma, Stripe quando presentes. Anti-falso-positivo. Use em "auditar segurança", XSS, IDOR, Server Actions, ou "/security-audit [path]".'
---

# Security Audit (React / Next.js / TypeScript)

Scanner orientado a **pesquisador de segurança**: contexto, fluxo de dados e mitigações do **framework na versão que o projeto realmente usa** — não uma versão fixa global.

**Idioma do relatório:** português (termos OWASP/CVE podem ficar em inglês).

**Multi-repo:** cada execução começa lendo o `package.json` e lockfile **do repositório (ou subpath) auditado**. Funciona em Next 14–16+, React 18–19+, com ou sem Prisma/Stripe/Auth.js.

## Princípios

1. **Versão instalada > última lançada** — auditar CVEs e APIs na versão do lockfile; "há versão mais nova" é só **INFO** sem advisory
2. **Evidência > padrão** — não reportar só por `dangerouslySetInnerHTML`, ausência de `middleware.ts` **em Next 16+** (usar `proxy.ts`), ou CSP/HSTS ausente em `next.config`
3. **Rastrear imports** — auth em helpers (`auth()`, wrappers, `canPermission`)
4. **Auto-verificação** — verificar falsos positivos em todo achado
5. **Patches só como proposta** — nunca aplicar no repo automaticamente

## Fluxo de execução (ordem fixa)

### Step 1 — Escopo, stack e versões

1. Path informado → só esse escopo; senão → raiz do projeto (respeitar monorepo)
2. **Obrigatório:** ler `package.json` e lockfile do projeto — versões instaladas, router, deps presentes
3. Comandos recomendados:
   ```bash
   npm ls next react react-dom --depth=0
   ```
   Lockfile: `package-lock.json` | `pnpm-lock.yaml` | `yarn.lock`
4. Opcional (INFO no relatório):
   ```bash
   npm view next version && npm view react version
   ```
5. Aplicar gates de major (Next 14/15/16, React 18/19); se Next ≥ 16 → verificar `proxy.ts` em vez de `middleware.ts`
6. Mapear superfície de ataque: route handlers, server actions, auth, webhooks, uploads, ORM

### Step 2 — Dependências do projeto atual

```bash
npm audit --omit=dev
```

- CVE/GHSA apenas para pacotes **deste** lockfile
- Versão citada = **instalada**, não range do `package.json`
- Sem CVE → no máximo **INFO** (upgrade opcional)
- Não reportar devDependencies sem uso em runtime

### Step 3 — Segredos e exposição

- Verificar padrões de chaves no código
- `git ls-files` para arquivos sensíveis **tracked**
- CI/CD, `next.config`, Docker

### Step 4 — Scan profundo (código)

| Categoria   | Foco                                                  |
| ----------- | ----------------------------------------------------- |
| Injeção     | Prisma/Drizzle raw, XSS real, SSRF                    |
| AuthZ/AuthN | Server Actions, `route.ts`, BOLA/IDOR, sessão         |
| Dados       | PII em logs/API, rotas públicas                       |
| Crypto      | tokens fracos, hash obsoleto                          |
| Lógica      | webhooks, race, rate limit                            |
| Config      | `NEXT_PUBLIC_*`, `allowedOrigins`; CSP/HSTS com cautela |

**Não** auditar Python/Java/Go salvo pedido explícito.

### Step 5 — Fluxo entre arquivos

Entrada → validação → auth → autorização → sink (DB, fetch, HTML, fs, pagamentos).

Next ≥15: página protegida **não** substitui auth na Server Action.

### Step 6 — Anti-falso-positivo

Antes de reportar, responder **sim** a todas:
1. Existe **caminho de exploit** plausível (não só "padrão suspeito")?
2. A entrada é **controlada pelo atacante** (request, upload, header, query param, body)?
3. Não há **sanitização/validação/auth** no mesmo request ou em proxy/middleware upstream?
4. O código está em **caminho de produção** (não storybook, mock, teste, `node_modules/`)?

Se qualquer resposta for "não" ou "incerto" → **descartar** ou marcar **LOW + confiança LOW**.

### Step 7 — Relatório

Formato estruturado com:
- Cabeçalho com **Stack detectado (instalado — lockfile)**
- Resumo executivo (tabela CRITICAL → INFO)
- Achados por **categoria** (não só por arquivo)
- Path + linha + snippet + risco + correção + referência OWASP/CWE
- Auditoria de dependências (`npm audit`)
- Scan de segredos
- Patches propostos (CRITICAL/HIGH) com aviso: **"Revise cada patch antes de aplicar. Nada foi alterado no repositório."**
- Falsos positivos descartados (transparência)
- Cobertura e próximos passos

### Step 8 — Patches (CRITICAL e HIGH)

Before/after; frase: **"Revise cada patch antes de aplicar. Nada foi alterado no repositório."**

**Não** incluir patches de CSP/HSTS genéricos em `next.config` (hardening opcional → INFO).

## Guia de severidade

| Nível    | Significado                                                      |
| -------- | ---------------------------------------------------------------- |
| CRITICAL | Exploração imediata (SQLi, RCE, bypass auth, secret live no Git) |
| HIGH     | Exploit claro (IDOR, XSS stored, webhook sem assinatura)         |
| MEDIUM   | Condições ou encadeamento (CSRF em proxy mal configurado)        |
| LOW      | Boas práticas pontuais                                           |
| INFO     | Sem CVE; versão atrás da latest; CSP/HSTS não custom no Next config |

## Regras de saída

- Tabela resumo primeiro
- Achados por **categoria**
- Path + linha + snippet
- **Stack detectado (instalado)** sempre no cabeçalho
- Comparar com latest só em INFO
- Falsos positivos descartados quando houver

## Atalhos grep (pistas, não achados)

```
dangerouslySetInnerHTML
$queryRawUnsafe
Prisma.sql
'use server'
export const GET = auth
proxy.ts
middleware.ts
constructEvent
sk_live_
```

Confirmar contexto antes de reportar.

---

## Referências de falsos positivos

### React / JSX — NÃO é achado automático

- `dangerouslySetInnerHTML` com HTML de **constantes**, tema, ou CSS gerado de config interno
- Texto `{user.name}` em JSX — React escapa por padrão
- `href={userUrl}` — só reportar se sem validação de protocolo (`javascript:`, `data:`)
- `target="_blank"` sem `rel` — no máximo **LOW**

### Next.js App Router — NÃO é achado automático

- Server Action sem `auth()` visível no mesmo arquivo — pode estar em wrapper/helper
- `middleware.ts` ausente em Next ≥ 16 → procurar `proxy.ts` primeiro
- `next.config` sem `headers()` custom — no máximo **INFO** (HSTS pode estar no CDN)
- CSP/HSTS copiado de outra versão do Next → **descartar como patch**

### Prisma / SQL — NÃO é achado automático

- `prisma.user.findMany({ where: { id } })` com `id` validado por Zod/uuid — ORM parametrizado
- `$queryRaw` com **tagged template** `Prisma.sql`...`` — API segura do Prisma
- `findFirst` com `userId: session.user.id` — BOLA mitigado se `userId` vem da sessão

### Segredos — NÃO é achado automático

- `process.env.STRIPE_SECRET_KEY` sem valor literal — correto
- `NEXT_PUBLIC_*` com chave **publishable** Stripe (`pk_`) — propositalmente pública
- Placeholders: `your-api-key`, `changeme`, `xxx`, exemplos em README
- Arquivo `.env*` no `.gitignore` mas **não tracked** — OK

---

## Formato do relatório

```
╔══════════════════════════════════════════════════════════╗
║           🔐 RELATÓRIO DE AUDITORIA DE SEGURANÇA        ║
║           Skill: security-audit                         ║
╚══════════════════════════════════════════════════════════╝

Projeto:     <nome ou caminho>
Data:        <data da varredura>
Escopo:      <paths analisados>
Stack detectado (instalado — lockfile):
  next@<resolved>  react@<resolved>  react-dom@<resolved>
  <outras deps do projeto>
Router:      App Router | Pages | híbrido
Excluídos:   <node_modules, .next, generated, …>
```

### Resumo executivo

```
┌────────────────────────────────────────────────┐
│           RESUMO DE ACHADOS                    │
├──────────────┬─────────────────────────────────┤
│ 🔴 CRITICAL  │  <n>                           │
│ 🟠 HIGH      │  <n>                           │
│ 🟡 MEDIUM    │  <n>                           │
│ 🔵 LOW       │  <n>                           │
│ ⚪ INFO      │  <n>                           │
├──────────────┼─────────────────────────────────┤
│ TOTAL        │  <n>                           │
└──────────────┴─────────────────────────────────┘
```

### Card de achado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟠 HIGH — IDOR / BOLA (Autorização)
Confiança: HIGH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Local:  src/..., linha X

🔍 Código:
  <snippet>

⚠️  Risco:
  <descrição + exemplo de abuso>

✅ Correção:
  <ação acionável>

📚 Referência: OWASP ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Próximos passos

```
⚡ PRÓXIMOS PASSOS
  1. Corrigir CRITICAL imediatamente
  2. HIGH no sprint atual
  3. MEDIUM/LOW no backlog
  4. Opcional: DAST, rate limiting, CSP (alinhado à versão do Next), SAST no CI

💡 Limitação: auditoria estática — não substitui teste dinâmico nem pentest.
```
