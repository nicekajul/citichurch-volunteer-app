-- ── Training Progress RLS Fix ────────────────────────────────────────────────
-- Problem: browser client only returns the logged-in user's own rows, so
--   admins and leaders can't see other members' badge/progress data.
-- Fix: add SELECT policies for admins (all rows) and leaders (team rows).

-- Drop any existing SELECT policies on training_progress so we start clean
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'training_progress' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON training_progress', pol.policyname);
  END LOOP;
END $$;

-- Enable RLS (idempotent)
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

-- 1. Every user can read their own rows
CREATE POLICY "progress_select_own"
  ON training_progress FOR SELECT
  USING (user_id = auth.uid());

-- 2. Admins can read ALL rows
CREATE POLICY "progress_select_admin"
  ON training_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Leaders can read rows for members of their own team
CREATE POLICY "progress_select_leader_team"
  ON training_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS ldr
      WHERE ldr.id = auth.uid()
        AND ldr.role = 'leader'
        AND EXISTS (
          SELECT 1 FROM profiles AS mbr
          WHERE mbr.id = training_progress.user_id
            AND mbr.team_id = ldr.team_id
        )
    )
  );
