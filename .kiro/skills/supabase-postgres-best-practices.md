---
name: supabase-postgres-best-practices
description: "Postgres best practices maintained by Supabase, for Postgres running anywhere. Load this skill BEFORE writing or changing anything that lives in a Postgres database: creating or altering tables and columns (including choosing column types), schema design, migrations and declarative schema files, RLS policies and the tests that verify them, indexes, triggers, database functions, queues and scheduled jobs (pg_cron, pgmq), vector/semantic search (pgvector), and restoring dumps (pg_restore) or importing data. Also load it when diagnosing slow queries, high CPU, timeouts, EXPLAIN plans, connection exhaustion, locking, bloat, or rows visible to the wrong user or tenant. This is not just a performance guide — schema, migration, security, and SQL authoring tasks need these rules too, even for a one-column change or a single query."
license: MIT
metadata:
  author: supabase
  version: "1.1.1"
  organization: Supabase
  date: January 2026
  source: https://github.com/supabase/agent-skills
---

# Supabase Postgres Best Practices

Comprehensive performance optimization guide for Postgres, maintained by Supabase. Contains rules across 8 categories, prioritized by impact to guide automated query optimization and schema design.

## When to Apply

Reference these guidelines when:
- Writing SQL queries or designing schemas
- Implementing indexes or query optimization
- Reviewing database performance issues
- Configuring connection pooling or scaling
- Optimizing for Postgres-specific features
- Working with Row-Level Security (RLS)

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Query Performance | CRITICAL | `query-` |
| 2 | Connection Management | CRITICAL | `conn-` |
| 3 | Security & RLS | CRITICAL | `security-` |
| 4 | Schema Design | HIGH | `schema-` |
| 5 | Concurrency & Locking | MEDIUM-HIGH | `lock-` |
| 6 | Data Access Patterns | MEDIUM | `data-` |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | `monitor-` |
| 8 | Advanced Features | LOW | `advanced-` |

---

## 1. Query Performance (CRITICAL)

### Add Indexes on WHERE and JOIN Columns
**Impact:** 100-1000x faster queries on large tables

Queries filtering or joining on unindexed columns cause full table scans, which become exponentially slower as tables grow.

```sql
-- ❌ No index on employee_id causes full table scan
select * from kaizens where employee_id = '...';

-- ✅ Create index on frequently filtered column
create index kaizens_employee_id_idx on kaizens (employee_id);

-- ✅ For JOIN columns, always index the foreign key side
create index comments_kaizen_id_idx on comments (kaizen_id);
create index comments_user_id_idx on comments (user_id);
```

### Use Partial Indexes for Filtered Queries
**Impact:** 5-20x smaller indexes, faster writes and queries

Partial indexes only include rows matching a WHERE condition.

```sql
-- ❌ Full index includes irrelevant rows
create index kaizens_status_idx on kaizens (status);

-- ✅ Partial index for most common query (pending approval)
create index kaizens_pending_idx on kaizens (created_at)
  where status = 'pending';

create index kaizens_active_employee_idx on kaizens (employee_id)
  where status not in ('rejected', 'completed');
```

### Composite Indexes for Multi-Column Filters
**Impact:** Eliminates redundant index scans

```sql
-- ✅ When filtering by both employee_id AND status
create index kaizens_employee_status_idx on kaizens (employee_id, status);

-- Column order matters: most selective first, matches WHERE clause order
```

### Covering Indexes (INCLUDE)
**Impact:** Avoids heap fetches for common queries

```sql
-- ✅ Include frequently selected columns to avoid table lookup
create index kaizens_employee_covering_idx on kaizens (employee_id)
  include (title, status, created_at);
```

---

## 2. Connection Management (CRITICAL)

### Always Use Connection Pooling
**Impact:** Prevents connection exhaustion under load

Supabase provides PgBouncer. Use the pooler connection string for all application connections except migrations.

```
# Transaction mode (recommended for serverless/edge)
postgres://user:pass@db.project.supabase.co:6543/postgres?pgbouncer=true

# Session mode (for apps that use session-level features)
postgres://user:pass@db.project.supabase.co:5432/postgres
```

### Set Idle Connection Timeouts

```sql
-- Reclaim connections that have been idle too long
alter system set idle_in_transaction_session_timeout = '30s';
alter system set statement_timeout = '30s';
```

---

## 3. Security & RLS (CRITICAL)

### Always Enable RLS on Public Tables

```sql
-- ✅ Required pattern for every table exposed via Supabase API
alter table kaizens enable row level security;
alter table profiles enable row level security;
alter table comments enable row level security;

-- Force RLS even for table owners
alter table kaizens force row level security;
```

### Wrap auth.uid() in SELECT for Performance
**Impact:** 100x+ faster on large tables

```sql
-- ❌ auth.uid() called once per row — kills performance
create policy "employees_own_kaizens" on kaizens
  using (auth.uid() = employee_id);

-- ✅ Wrap in SELECT — called once and cached for the whole query
create policy "employees_own_kaizens" on kaizens
  using ((select auth.uid()) = employee_id);
```

### Never Use `TO public` for Sensitive Data

```sql
-- ❌ Exposes all profile data to unauthenticated requests
create policy "public_view_profiles"
  on profiles for select
  to public
  using (true);

-- ✅ Restrict to authenticated users only
create policy "authenticated_view_profiles"
  on profiles for select
  to authenticated
  using (true);
```

### Prevent Role Escalation in UPDATE Policies

```sql
-- ❌ Users can update their own row — including changing role to 'admin'
create policy "users_update_own_profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ✅ Prevent self-promotion: role must remain unchanged
create policy "users_update_own_profile_restricted"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from profiles where id = auth.uid())
  );
```

### Use SECURITY DEFINER Functions for Complex Checks

```sql
-- ✅ Avoids recursive RLS and improves performance
create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
    and role = 'admin'
  );
$$;

-- Revoke from public roles
revoke execute on function private.is_admin() from public, anon, authenticated;

-- Use in policy
create policy "admins_manage_all"
  on kaizens for all
  to authenticated
  using ((select private.is_admin()));
```

### Apply Principle of Least Privilege

```sql
-- ❌ Overly broad — any SQL injection is catastrophic
grant all privileges on all tables in schema public to app_user;

-- ✅ Minimal, specific grants
create role app_readonly nologin;
grant usage on schema public to app_readonly;
grant select on public.kaizens, public.categories, public.profiles to app_readonly;

-- Revoke default public access
revoke all on schema public from public;
revoke all on all tables in schema public from public;
```

### Always Index Columns Used in RLS Policies

```sql
-- ✅ Policies filtering by user_id need an index
create index kaizens_employee_id_idx on kaizens (employee_id);
create index comments_user_id_idx on comments (user_id);
create index notifications_user_id_idx on notifications (user_id);
create index action_plans_kaizen_id_idx on action_plans (kaizen_id);
```

---

## 4. Schema Design (HIGH)

### Index All Foreign Key Columns
**Impact:** 10-100x faster JOINs and CASCADE operations

Postgres does NOT automatically index foreign key columns.

```sql
-- ✅ After every FK definition, add an index
-- kaizens.employee_id → profiles.id
create index kaizens_employee_id_idx on kaizens (employee_id);

-- kaizens.category_id → categories.id
create index kaizens_category_id_idx on kaizens (category_id);

-- kaizens.department_id → departments.id
create index kaizens_department_id_idx on kaizens (department_id);

-- comments.kaizen_id → kaizens.id
create index comments_kaizen_id_idx on comments (kaizen_id);

-- Find missing FK indexes:
select
  conrelid::regclass as table_name,
  a.attname as fk_column
from pg_constraint c
join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
where c.contype = 'f'
  and not exists (
    select 1 from pg_index i
    where i.indrelid = c.conrelid and a.attnum = any(i.indkey)
  );
```

### Choose Appropriate Data Types

```sql
-- ❌ Common mistakes
id int,                -- Overflows at 2.1B rows
created_at timestamp,  -- No timezone → bugs across environments
price varchar(20),     -- String for numeric → can't do math
is_active varchar(5),  -- String for boolean → wastes space

-- ✅ Correct types
id bigint generated always as identity primary key,  -- 9 quintillion max
created_at timestamptz default now(),               -- Always timezone-aware
price numeric(10,2),                                 -- Exact decimal arithmetic
is_active boolean default true,                      -- 1 byte
```

### Add Constraints Safely in Migrations

Postgres does NOT support `ADD CONSTRAINT IF NOT EXISTS` — use a DO block:

```sql
-- ✅ Idempotent constraint creation
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'kaizens_status_check'
    and conrelid = 'public.kaizens'::regclass
  ) then
    alter table public.kaizens
    add constraint kaizens_status_check
    check (status in ('pending','approved','rejected','under_review','in_progress','completed'));
  end if;
end $$;
```

---

## 5. Concurrency & Locking (MEDIUM-HIGH)

### Keep Transactions Short

```sql
-- ❌ Long transaction holds locks, blocks other queries
begin;
  update kaizens set status = 'approved' where id = $1;
  -- ... slow external API call here ...
  insert into notifications ...;
commit;

-- ✅ Do external work outside the transaction
-- 1. Fetch data needed
-- 2. Do external work
-- 3. Short transaction for DB writes only
begin;
  update kaizens set status = 'approved' where id = $1;
  insert into notifications ...;
commit;
```

### Prevent Deadlocks — Consistent Table Order

```sql
-- ✅ Always update tables in the same order across all transactions
-- Transaction A and B both: update profiles first, then kaizens
begin;
  update profiles set points = points + 10 where id = $1;
  update kaizens set status = 'approved' where id = $2;
commit;
```

---

## 6. Data Access Patterns (MEDIUM)

### Avoid N+1 Queries — Use JOINs or Supabase Nested Selects

```sql
-- ❌ N+1: fetches kaizen, then profile for each row (N+1 queries)
-- In supabase-js: separate .from('kaizens') then .from('profiles') per row

-- ✅ Single query with JOIN
select k.*, p.full_name, p.email
from kaizens k
join profiles p on p.id = k.employee_id
where k.status = 'pending';

-- ✅ In supabase-js: use nested selects (single round-trip)
supabase.from('kaizens').select('*, profile:profiles(*), category:categories(*)')
```

### Use Cursor-Based Pagination for Large Tables

```sql
-- ❌ OFFSET gets slower as page number increases
select * from kaizens order by created_at desc limit 20 offset 1000;

-- ✅ Cursor-based: always fast regardless of page
select * from kaizens
where created_at < $last_seen_created_at
order by created_at desc
limit 20;
```

### Batch Inserts Instead of Individual Rows

```sql
-- ❌ 1000 round-trips
insert into notifications (user_id, title, message) values ($1, $2, $3);
-- repeated 1000 times

-- ✅ Single round-trip
insert into notifications (user_id, title, message)
values ($1, $2, $3), ($4, $5, $6), ...;

-- In supabase-js: pass array to .insert()
supabase.from('notifications').insert([...items])
```

---

## 7. Monitoring & Diagnostics (LOW-MEDIUM)

### Use EXPLAIN ANALYZE for Slow Queries

```sql
-- Always use ANALYZE to get actual runtime stats
explain (analyze, buffers, format text)
select k.*, p.full_name
from kaizens k
join profiles p on p.id = k.employee_id
where k.status = 'pending'
order by k.created_at desc;

-- Look for:
-- "Seq Scan" on large tables → missing index
-- "Rows Removed by Filter" >> actual rows → index not selective enough
-- High "Buffers: shared hit/read" → cache miss
```

### Enable pg_stat_statements

```sql
-- Enable extension (Supabase: already enabled)
create extension if not exists pg_stat_statements;

-- Find slowest queries
select
  round(total_exec_time::numeric, 2) as total_ms,
  calls,
  round(mean_exec_time::numeric, 2) as mean_ms,
  left(query, 100) as query_snippet
from pg_stat_statements
order by mean_exec_time desc
limit 20;
```

### Monitor Table Bloat — Run VACUUM Regularly

```sql
-- Check table bloat
select schemaname, tablename, n_dead_tup, n_live_tup,
  round(n_dead_tup::numeric / nullif(n_live_tup,0) * 100, 2) as dead_pct
from pg_stat_user_tables
order by n_dead_tup desc;

-- Manual vacuum if needed (Supabase autovacuum handles most cases)
vacuum analyze kaizens;
```

---

## 8. Advanced Features (LOW)

### Full-Text Search with tsvector

```sql
-- ✅ Add a generated tsvector column for fast full-text search on kaizens
alter table kaizens add column search_vector tsvector
  generated always as (
    to_tsvector('portuguese',
      coalesce(title, '') || ' ' ||
      coalesce(problem, '') || ' ' ||
      coalesce(suggestion, '')
    )
  ) stored;

create index kaizens_search_idx on kaizens using gin(search_vector);

-- Query
select * from kaizens
where search_vector @@ plainto_tsquery('portuguese', 'melhoria segurança');
```

### JSONB Indexing

```sql
-- For JSONB columns, use GIN index
create index ON table_name using gin(jsonb_column);

-- For specific key access, use expression index
create index ON table_name ((jsonb_column->>'specific_key'));
```

---

## References

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [RLS Performance Recommendations](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
- [Query Optimization](https://supabase.com/docs/guides/database/query-optimization)
- [Postgres Roles and Privileges](https://supabase.com/blog/postgres-roles-and-privileges)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [Source skill](https://github.com/supabase/agent-skills/tree/main/skills/supabase-postgres-best-practices)
