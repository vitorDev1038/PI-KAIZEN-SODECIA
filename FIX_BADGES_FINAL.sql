-- ============================================================================
-- FIX BADGES SCHEMA - SOLUÇÃO DEFINITIVA
-- ============================================================================
-- Este script detecta automaticamente se a coluna é 'name' ou 'title'
-- e insere os dados usando a coluna correta via LOOP
-- ============================================================================

DO $$
DECLARE
  has_name_col boolean;
  v_code text;
  v_title text;
  v_description text;
  v_icon text;
  v_points integer;
  v_color text;
  badges_data text[][] := ARRAY[
    ARRAY['FIRST_KAIZEN', 'Primeiro Passo', 'Submeteu sua primeira ideia de melhoria Kaizen', 'Sparkles', '0', 'blue'],
    ARRAY['BRONZE_CONTRIBUTOR', 'Inovador Bronze', 'Alcançou 30 pontos em melhorias aprovadas', 'Award', '30', 'amber'],
    ARRAY['SILVER_CONTRIBUTOR', 'Inovador Prata', 'Alcançou 70 pontos em melhorias aprovadas', 'ShieldCheck', '70', 'slate'],
    ARRAY['GOLD_CONTRIBUTOR', 'Inovador Ouro', 'Alcançou 150 pontos e liderança no ranking', 'Trophy', '150', 'yellow'],
    ARRAY['ROI_CHAMPION', 'Campeão de Economia', 'Criou um Kaizen com economia acima de R$ 5.000', 'DollarSign', '0', 'emerald'],
    ARRAY['SAFETY_GUARDIAN', 'Guardião da Segurança', 'Kaizen aprovado na categoria Segurança do Trabalho', 'Shield', '0', 'red']
  ];
  badge_record text[];
BEGIN
  -- Detect which column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'badges' 
    AND column_name = 'name'
  ) INTO has_name_col;
  
  RAISE NOTICE 'Detected schema uses column: %', CASE WHEN has_name_col THEN 'name' ELSE 'title' END;
  
  -- Insert each badge using the correct column
  FOREACH badge_record SLICE 1 IN ARRAY badges_data
  LOOP
    v_code := badge_record[1];
    v_title := badge_record[2];
    v_description := badge_record[3];
    v_icon := badge_record[4];
    v_points := badge_record[5]::integer;
    v_color := badge_record[6];
    
    IF has_name_col THEN
      -- Schema uses 'name' column
      INSERT INTO badges (code, name, description, icon, points_required, color)
      VALUES (v_code, v_title, v_description, v_icon, v_points, v_color)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        points_required = EXCLUDED.points_required,
        color = EXCLUDED.color;
      
      RAISE NOTICE 'Inserted/Updated badge: % (using name column)', v_code;
    ELSE
      -- Schema uses 'title' column
      INSERT INTO badges (code, title, description, icon, points_required, color)
      VALUES (v_code, v_title, v_description, v_icon, v_points, v_color)
      ON CONFLICT (code) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        points_required = EXCLUDED.points_required,
        color = EXCLUDED.color;
      
      RAISE NOTICE 'Inserted/Updated badge: % (using title column)', v_code;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ All 6 badges inserted/updated successfully!';
END $$;

-- Verify the results
SELECT 
  code,
  COALESCE(name, title) as badge_name,
  description,
  icon,
  points_required,
  color
FROM badges
ORDER BY points_required, code;
