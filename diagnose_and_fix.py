#!/usr/bin/env python3
"""
Script para diagnosticar e corrigir a tabela badges no Supabase
"""
import os

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("❌ psycopg2 não instalado!")
    print("Execute: pip install psycopg2-binary")
    exit(1)

# Connection string
conn_string = "postgresql://postgres.vottiwsddmwkiyztxjag:3iGSfUC0kxfHYCLa@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

print("🔌 Conectando ao Supabase...")
try:
    conn = psycopg2.connect(conn_string)
    cur = conn.cursor()
    print("✅ Conectado com sucesso!\n")
except Exception as e:
    print(f"❌ Erro ao conectar: {e}")
    exit(1)

# DIAGNÓSTICO 1: Ver se tabela existe
print("=" * 60)
print("📋 DIAGNÓSTICO 1: Verificando se tabela badges existe")
print("=" * 60)
cur.execute("""
    SELECT table_name, table_schema
    FROM information_schema.tables
    WHERE table_name = 'badges';
""")
result = cur.fetchall()
if result:
    print(f"✅ Tabela badges encontrada: {result}")
else:
    print("❌ Tabela badges NÃO existe!")
    cur.close()
    conn.close()
    exit(1)

# DIAGNÓSTICO 2: Ver colunas
print("\n" + "=" * 60)
print("📋 DIAGNÓSTICO 2: Colunas da tabela badges")
print("=" * 60)
cur.execute("""
    SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'badges'
    ORDER BY ordinal_position;
""")
columns = cur.fetchall()
print(f"\n{'COLUNA':<20} {'TIPO':<15} {'NULL?':<10} {'DEFAULT'}")
print("-" * 70)
for col in columns:
    print(f"{col[0]:<20} {col[1]:<15} {col[2]:<10} {col[3] or ''}")

# Verificar se tem 'name' ou 'title'
has_name = any(col[0] == 'name' for col in columns)
has_title = any(col[0] == 'title' for col in columns)
print(f"\n🔍 Coluna 'name': {'✅ EXISTE' if has_name else '❌ NÃO EXISTE'}")
print(f"🔍 Coluna 'title': {'✅ EXISTE' if has_title else '❌ NÃO EXISTE'}")

# DIAGNÓSTICO 3: Ver constraints
print("\n" + "=" * 60)
print("📋 DIAGNÓSTICO 3: Constraints da tabela badges")
print("=" * 60)
cur.execute("""
    SELECT
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = 'public.badges'::regclass;
""")
constraints = cur.fetchall()
if constraints:
    for const in constraints:
        print(f"  {const[0]}: {const[2]}")
else:
    print("  Nenhuma constraint encontrada")

# DIAGNÓSTICO 4: Ver dados existentes
print("\n" + "=" * 60)
print("📋 DIAGNÓSTICO 4: Dados existentes (primeiros 5)")
print("=" * 60)
cur.execute("SELECT * FROM badges LIMIT 5;")
rows = cur.fetchall()
if rows:
    print(f"  {len(rows)} registro(s) encontrado(s)")
    for row in rows:
        print(f"  {row}")
else:
    print("  Tabela vazia")

# APLICAR FIX
print("\n" + "=" * 60)
print("🔧 APLICANDO FIX DOS BADGES")
print("=" * 60)

badges_data = [
    ('FIRST_KAIZEN', 'Primeiro Passo', 'Submeteu sua primeira ideia de melhoria Kaizen', 'Sparkles', 0, 'blue'),
    ('BRONZE_CONTRIBUTOR', 'Inovador Bronze', 'Alcançou 30 pontos em melhorias aprovadas', 'Award', 30, 'amber'),
    ('SILVER_CONTRIBUTOR', 'Inovador Prata', 'Alcançou 70 pontos em melhorias aprovadas', 'ShieldCheck', 70, 'slate'),
    ('GOLD_CONTRIBUTOR', 'Inovador Ouro', 'Alcançou 150 pontos e liderança no ranking', 'Trophy', 150, 'yellow'),
    ('ROI_CHAMPION', 'Campeão de Economia', 'Criou um Kaizen com economia acima de R$ 5.000', 'DollarSign', 0, 'emerald'),
    ('SAFETY_GUARDIAN', 'Guardião da Segurança', 'Kaizen aprovado na categoria Segurança do Trabalho', 'Shield', 0, 'red')
]

column_to_use = 'name' if has_name else 'title'
print(f"📌 Usando coluna: {column_to_use}")

for badge in badges_data:
    code, name, description, icon, points, color = badge
    try:
        if has_name:
            cur.execute("""
                INSERT INTO badges (code, name, description, icon, points_required, color)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    icon = EXCLUDED.icon,
                    points_required = EXCLUDED.points_required,
                    color = EXCLUDED.color;
            """, (code, name, description, icon, points, color))
        else:
            cur.execute("""
                INSERT INTO badges (code, title, description, icon, points_required, color)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (code) DO UPDATE SET
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    icon = EXCLUDED.icon,
                    points_required = EXCLUDED.points_required,
                    color = EXCLUDED.color;
            """, (code, name, description, icon, points, color))
        
        conn.commit()
        print(f"  ✅ {code}")
    except Exception as e:
        print(f"  ❌ {code}: {e}")
        conn.rollback()

# VERIFICAÇÃO FINAL
print("\n" + "=" * 60)
print("✅ VERIFICAÇÃO FINAL")
print("=" * 60)
cur.execute(f"SELECT code, {column_to_use}, points_required FROM badges ORDER BY points_required, code;")
final_badges = cur.fetchall()
print(f"\n{'CODE':<20} {'NAME/TITLE':<20} {'POINTS'}")
print("-" * 60)
for badge in final_badges:
    print(f"{badge[0]:<20} {badge[1]:<20} {badge[2]}")

print(f"\n🎉 Total de badges: {len(final_badges)}")

# Cleanup
cur.close()
conn.close()
print("\n✅ Conexão fechada. FIX APLICADO COM SUCESSO!")
