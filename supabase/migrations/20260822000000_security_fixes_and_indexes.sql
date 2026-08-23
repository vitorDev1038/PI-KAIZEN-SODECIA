/*
  # Security Audit Fixes & Performance Indexes
  
  1. RLS Policy Corrections:
    - Fix profiles: prevent self-promotion to admin
    - Fix profiles: restrict public access to authenticated only
    - Fix notifications: prevent arbitrary user_id insertion
  
  2. Missing Foreign Key Indexes:
    - kaizens.category_id
    - kaizens.department_id
    - kaizens.employee_id
    - comments.kaizen_id
    - comments.user_id
    - action_plans.kaizen_id
    - user_badges.user_id
    - user_badges.badge_id
    - notifications.user_id
    - notifications.kaizen_id
  
  3. Additional Security Indexes:
    - Partial indexes for common filtered queries
    - Indexes on columns used in RLS policies
*/

-- ============================================================
-- 1. DROP PROBLEMATIC RLS POLICIES
-- ============================================================

-- Drop insecure profiles policies
DROP POLICY IF EXISTS "public_view_profiles" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles;

-- Drop insecure notifications policy
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;

-- ============================================================
-- 2. CREATE SECURE RLS POLICIES FOR PROFILES
-- ============================================================

-- Allow authenticated users to view profiles (needed for joins/listings)
CREATE POLICY "authenticated_view_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to view their own profile
CREATE POLICY "users_view_own_profile_secure"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile BUT prevent role escalation
CREATE POLICY "users_update_own_profile_no_role_change"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Allow users to create their own profile (during signup)
CREATE POLICY "users_create_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 3. CREATE SECURE RLS POLICY FOR NOTIFICATIONS (CONDITIONAL)
-- ============================================================

-- Users can only insert notifications for themselves OR admins can insert for anyone
-- Only create if notifications table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'notifications'
  ) THEN
    -- Drop old policy if exists
    DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
    
    -- Create new secure policy
    CREATE POLICY "insert_own_or_admin_notifications"
      ON notifications FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================
-- 4. CREATE MISSING FOREIGN KEY INDEXES (CRITICAL FOR PERFORMANCE)
-- ============================================================

-- Kaizens table foreign keys (base schema)
CREATE INDEX IF NOT EXISTS kaizens_category_id_idx ON kaizens (category_id);
CREATE INDEX IF NOT EXISTS kaizens_employee_id_idx ON kaizens (employee_id);

-- Kaizens table foreign keys (enterprise features - conditional)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'kaizens'
    AND column_name = 'department_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS kaizens_department_id_idx ON kaizens (department_id);
  END IF;
END $$;

-- Comments table foreign keys
CREATE INDEX IF NOT EXISTS comments_kaizen_id_idx ON comments (kaizen_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments (user_id);

-- Action plans table foreign key (enterprise features - conditional)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'action_plans'
  ) THEN
    CREATE INDEX IF NOT EXISTS action_plans_kaizen_id_idx ON action_plans (kaizen_id);
  END IF;
END $$;

-- User badges table foreign keys (enterprise features - conditional)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'user_badges'
  ) THEN
    CREATE INDEX IF NOT EXISTS user_badges_user_id_idx ON user_badges (user_id);
    CREATE INDEX IF NOT EXISTS user_badges_badge_id_idx ON user_badges (badge_id);
  END IF;
END $$;

-- Notifications table foreign keys (enterprise features - conditional)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'notifications'
  ) THEN
    CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id);
    CREATE INDEX IF NOT EXISTS notifications_kaizen_id_idx ON notifications (kaizen_id);
  END IF;
END $$;

-- ============================================================
-- 5. PARTIAL INDEXES FOR COMMON QUERIES (PERFORMANCE BOOST)
-- ============================================================

-- Pending kaizens (most common admin query)
CREATE INDEX IF NOT EXISTS kaizens_pending_created_idx 
  ON kaizens (created_at DESC)
  WHERE status = 'pending';

-- Active kaizens (exclude completed/rejected from main queries - conditional on department_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'kaizens'
    AND column_name = 'department_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS kaizens_active_employee_idx
      ON kaizens (employee_id, status, created_at DESC)
      WHERE status NOT IN ('rejected', 'completed');
  ELSE
    -- Without department_id, simpler index
    CREATE INDEX IF NOT EXISTS kaizens_active_employee_idx
      ON kaizens (employee_id, created_at DESC)
      WHERE status NOT IN ('rejected', 'completed');
  END IF;
END $$;

-- Unread notifications (common user query - conditional on notifications table)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'notifications'
  ) THEN
    CREATE INDEX IF NOT EXISTS notifications_unread_user_idx
      ON notifications (user_id, created_at DESC)
      WHERE read = false;
  END IF;
END $$;

-- ============================================================
-- 6. COMPOSITE INDEXES FOR MULTI-COLUMN FILTERS
-- ============================================================

-- Filter kaizens by employee + status (common in dashboards)
CREATE INDEX IF NOT EXISTS kaizens_employee_status_created_idx
  ON kaizens (employee_id, status, created_at DESC);

-- Filter comments by kaizen + created_at (chronological display)
CREATE INDEX IF NOT EXISTS comments_kaizen_created_idx
  ON comments (kaizen_id, created_at ASC);

-- ============================================================
-- 7. INDEXES ON COLUMNS USED IN RLS POLICIES (RLS PERFORMANCE)
-- ============================================================

-- Already created above, but ensuring they exist:
-- - kaizens.employee_id (for RLS: users see their own kaizens)
-- - comments.user_id (for RLS: users see comments on their kaizens)
-- - notifications.user_id (for RLS: users see their own notifications)
-- - profiles.id (for RLS: auth.uid() checks) → already has PK index

-- ============================================================
-- 8. ADD STATUS CHECK CONSTRAINT (IF NOT EXISTS PATTERN)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kaizens_status_check'
    AND conrelid = 'public.kaizens'::regclass
  ) THEN
    ALTER TABLE public.kaizens
    ADD CONSTRAINT kaizens_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'under_review', 'in_progress', 'completed'));
  END IF;
END $$;

-- ============================================================
-- 9. ENSURE RLS IS ENABLED AND FORCED ON ALL TABLES
-- ============================================================

-- Force RLS on profiles (even for table owner)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- Force RLS on base schema tables
ALTER TABLE kaizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaizens FORCE ROW LEVEL SECURITY;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments FORCE ROW LEVEL SECURITY;

-- Force RLS on enterprise feature tables (conditional)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'departments') THEN
    ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'action_plans') THEN
    ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'badges') THEN
    ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_badges') THEN
    ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================
-- 10. VACUUM ANALYZE (REFRESH QUERY PLANNER STATISTICS)
-- ============================================================

VACUUM ANALYZE profiles;
VACUUM ANALYZE kaizens;
VACUUM ANALYZE comments;

-- Vacuum enterprise tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    VACUUM ANALYZE notifications;
  END IF;
END $$;

-- ============================================================
-- NOTES:
-- ============================================================
-- 1. After applying this migration, verify RLS policies work correctly:
--    - Test that employees can't promote themselves to admin
--    - Test that unauthenticated users can't view profiles
--    - Test that users can't create notifications for other users
--
-- 2. Run EXPLAIN ANALYZE on your most common queries to verify index usage
--
-- 3. If repo is/was public, rotate Supabase keys immediately:
--    - Go to Supabase Dashboard → Settings → API
--    - Generate new anon/service_role keys
--    - Update .env.local (not tracked by Git)
--
-- 4. Consider adding application-level validations in parallel:
--    - Client-side: validate file upload types/sizes
--    - Client-side: enforce 8+ char password minimum
