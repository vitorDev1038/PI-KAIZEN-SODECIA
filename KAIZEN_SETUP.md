# Kaizen Flow - Sistema de Gerenciamento de Melhorias

Um sistema web completo de gerenciamento de Kaizens (Programa de Ideias e Melhorias) desenvolvido com React, Vite, Tailwind CSS e Supabase.

## Funcionalidades Principais

### Para Funcionários
- **Dashboard Pessoal**: Visualizar estatísticas de kaizens submetidos (total, aprovados, pendentes)
- **Submissão de Kaizens**: Formulário completo com campos para título, categoria, problema, sugestão, benefícios e imagem
- **Meus Kaizens**: Lista de kaizens submetidos com filtro de status
- **Detalhes e Feedback**: Visualizar detalhes completos e feedback do administrador
- **Pontuação**: Ganhar 10 pontos por cada kaizen aprovado (gamificação)

### Para Administradores
- **Dashboard Administrativo**: Estatísticas gerais (total, aprovados, pendentes, taxa de aprovação)
- **Top Contribuidores**: Ranking dos 5 funcionários com mais pontos
- **Estatísticas por Categoria**: Visualização da distribuição de kaizens por categoria
- **Gestão Completa de Kaizens**:
  - Visualizar todos os kaizens do sistema
  - Filtrar por status, categoria ou buscar por título/problema/funcionário
  - Aprovar, reprovar ou solicitar ajustes
  - Adicionar feedback obrigatório
  - Exportar relatório em CSV
  - Adicionar comentários e feedback
- **Gestão de Usuários**:
  - Visualizar lista de funcionários
  - Ativar/desativar contas
  - Promover funcionário a administrador
- **Gestão de Categorias**: Adicionar, editar e remover categorias

## Fluxo de Aprovação

1. **Aguardando Aprovação**: Status inicial quando funcionário envia kaizen
2. **Em Análise**: Admin solicita ajustes com feedback. Funcionário pode editar e reenviar
3. **Aprovado**: Kaizen aprovado. Funcionário recebe 10 pontos
4. **Reprovado**: Kaizen recusado com feedback obrigatório do admin

## Dados de Teste

Use as seguintes credenciais para testar:

**Funcionário:**
- Email: `employee@test.com`
- Senha: `123456`

**Administrador:**
- Email: `admin@test.com`
- Senha: `123456`

## Estrutura Técnica

### Frontend
- **Framework**: React 18 com TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide React
- **Database Client**: @supabase/supabase-js

### Backend
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (Email/Senha)
- **Storage**: Supabase Storage (para imagens)
- **Edge Functions**: Para funções serverless

### Database Schema

#### Tabelas Principais
- **profiles**: Perfis de usuários (id, email, full_name, role, points, is_active, created_at)
- **categories**: Categorias de kaizens (id, name, description, color, created_at)
- **kaizens**: Ideias de melhorias (id, title, category_id, problem, suggestion, benefits, image_url, status, employee_id, created_at, updated_at)
- **comments**: Comentários e feedback (id, kaizen_id, user_id, content, is_feedback, created_at)

#### Segurança
- RLS (Row Level Security) ativado em todas as tabelas
- Políticas de acesso granulares por papel (employee/admin)
- Funcionários veem apenas seus próprios kaizens
- Admins veem todos os kaizens
- Storage bucket com acesso público para leitura de imagens

## Instruções de Uso

### Desenvolvimento Local

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente**:
   - As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` já estão configuradas no arquivo `.env`

3. **Executar em desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Build para produção**:
   ```bash
   npm run build
   ```

5. **Preview de produção**:
   ```bash
   npm run preview
   ```

### Primeiro Acesso

1. Abra a aplicação no navegador
2. Faça login com as credenciais de teste fornecidas acima
3. Como **funcionário**, você pode:
   - Submeter novos kaizens
   - Visualizar seus kaizens
   - Ver feedback do administrador
   - Editar kaizens em análise
4. Como **administrador**, você pode:
   - Gerenciar todos os kaizens
   - Filtrar e buscar kaizens
   - Aprovar, reprovar ou solicitar ajustes
   - Visualizar estatísticas e ranking
   - Gerenciar usuários e categorias

## Componentes Principais

### Pages
- `Login`: Página de autenticação
- `Register`: Página de registro (apenas para funcionários)
- `EmployeeDashboard`: Dashboard do funcionário com formulário e lista de kaizens
- `AdminDashboard`: Dashboard do administrador com estatísticas
- `AdminKaizens`: Gestão completa de kaizens
- `AdminUsers`: Gestão de usuários

### Components
- `KaizenForm`: Formulário de submissão de kaizen
- `KaizenList`: Listagem de kaizens com modal de detalhes
- `Layout`: Layout principal com navegação
- `Toast`: Sistema de notificações

### UI Components
- `Button`: Botões reutilizáveis
- `Input`: Campos de entrada
- `Textarea`: Áreas de texto
- `Select`: Dropdowns
- `Card`: Cartões/containers
- `Modal`: Modais para detalhes
- `Badge`: Badges de status
- `Toast`: Notificações toast

## Recursos Adicionais

### Gamificação
- Funcionários ganham 10 pontos por cada kaizen aprovado
- Ranking dos top 5 contribuidores visível no admin dashboard
- Pontuação acumulada mostrada no perfil

### Busca e Filtros
- Busca global por título, problema ou funcionário
- Filtro por status (Aguardando, Aprovado, Reprovado, Em Análise)
- Filtro por categoria
- Exportação de relatório em CSV

### Comentários e Feedback
- Thread de comentários para cada kaizen
- Feedback oficial do administrador marcado
- Histórico completo de comunicação

### Design Responsivo
- Interface totalmente responsiva
- Otimizada para celular, tablet e desktop
- Tema profissional com cores sóbrias (azul, cinza, verde, vermelho)
- Animações suaves e feedback visual

## Troubleshooting

### Erro ao enviar kaizen com imagem
- Verifique se o bucket de storage está criado
- Certifique-se de que as permissões de storage estão corretas

### Não consigo fazer login
- Use as credenciais de teste fornecidas
- Verifique se o Supabase Auth está configurado corretamente
- Limpe o cache do navegador e tente novamente

### Kaizens não aparecem
- Verifique as políticas de RLS
- Certifique-se de que o usuário tem permissão para acessar os dados
- Verifique o console do navegador para mensagens de erro

## Próximas Melhorias Sugeridas

- Notificações em tempo real com Supabase Realtime
- Sistema de aprovação em lote
- Integração com email para notificações
- Dashboard com gráficos mais avançados (Chart.js/Recharts)
- Sistema de tags para kaizens
- Histórico de versões de kaizens
- Integração com sistema de projetos
