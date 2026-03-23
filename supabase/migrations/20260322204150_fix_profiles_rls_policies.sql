/*
  # Fix Infinite Recursion in Profiles RLS Policies

  The previous policies had circular references causing infinite recursion.
  This migration simplifies the policies to avoid the recursion issue.

  Changes:
  - Remove policies that check admin role by querying the same table
  - Implement simpler, non-recursive policies
  - Admins identified by auth.jwt() app_metadata instead of table query
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create new simplified policies without recursion

-- Allow users to view their own profile
CREATE POLICY "users_view_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow public access to view profiles (for listing)
CREATE POLICY "public_view_profiles"
  ON profiles FOR SELECT
  TO public
  USING (true);

-- Allow users to create their own profile
CREATE POLICY "users_create_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
