-- Fix badges schema - detect and use correct column name
DO $$
DECLARE
  has_name_col boolean;
  v_code text;
  v_title text;
  v_description text;
  v_icon text;
  v_points integer;
  v_color text;
BEGIN
  -- Check if 'name' column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'badges' AND column_name = 'name'
  ) INTO has_name_col;
  
  -- Define badges data
  CREATE TEMP TABLE temp_badges (
    code text,
    badge_name text,
    description text,
    icon text,
    points_required integer,
    color text
  );
  
  INSERT INTO temp_badges VALUES
    ('FIRST_KAIZEN', 'Primeiro Passo', 'Submeteu sua primeira ideia de melhoria Kaizen', 'Sparkles', 0, 'blue'),
    ('BRONZE_CONTRIBUTOR', 'Inovador Bronze', 'Alcançou 30 pontos em melhorias aprovadas', 'Award', 30, 'amber'),
    ('SILVER_CONTRIBUTOR', 'Inovador Prata', 'Alcançou 70 pontos em melhorias aprovadas', 'ShieldCheck', 70, 'slate'),
    ('GOLD_CONTRIBUTOR', 'Inovador Ouro', 'Alcançou 150 pontos e liderança no ranking', 'Trophy', 150, 'yellow'),
    ('ROI_CHAMPION', 'Campeão de Economia', 'Criou um Kaizen com economia acima de R$ 5.000', 'DollarSign', 0, 'emerald'),
    ('SAFETY_GUARDIAN', 'Guardião da Segurança', 'Kaizen aprovado na categoria Segurança do Trabalho', 'Shield', 0, 'red');
  
  -- Insert badges using correct column name
  FOR v_code, v_title, v_description, v_icon, v_points, v_color IN
    SELECT code, badge_name, description, icon, points_required, color FROM temp_badges
  LOOP
    IF has_name_col THEN
      -- Use 'name' column
      INSERT INTO badges (code, name, description, icon, points_required, color)
      VALUES (v_code, v_title, v_description, v_icon, v_points, v_color)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        points_required = EXCLUDED.points_required,
        color = EXCLUDED.color;
    ELSE
      -- Use 'title' column
      INSERT INTO badges (code, title, description, icon, points_required, color)
      VALUES (v_code, v_title, v_description, v_icon, v_points, v_color)
      ON CONFLICT (code) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        points_required = EXCLUDED.points_required,
        color = EXCLUDED.color;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Badges inserted/updated successfully using % column', CASE WHEN has_name_col THEN 'name' ELSE 'title' END;
END $$;

-- Verify
SELECT 
  code,
  COALESCE(name, title) as badge_name,
  description,
  icon,
  points_required,
  color
FROM badges
ORDER BY points_required, code;
